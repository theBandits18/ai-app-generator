// src/app/api/apps/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { auth, authEnabled } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateAppSchema, validateConfig } from "@/lib/config-validator";
import {
  LOCAL_USER_ID,
  createLocalApp,
  hasDatabaseUrl,
  listLocalApps,
} from "@/lib/local-store";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

// GET /api/apps — list apps for current user + public apps
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get("public") === "true";

    if (!hasDatabaseUrl()) {
      const apps = await listLocalApps({
        publicOnly,
        userId: session?.user?.id ?? (!authEnabled ? LOCAL_USER_ID : null),
      });
      return NextResponse.json({ data: apps, error: null, mode: "local-demo" });
    }

    const where = publicOnly
      ? { isPublic: true }
      : session?.user?.id
      ? { OR: [{ userId: session.user.id }, { isPublic: true }] }
      : { isPublic: true };

    const apps = await prisma.app.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        configs: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          take: 1,
        },
        user: { select: { name: true, image: true } },
      },
    });

    const formatted = apps.map((app) => ({
      id: app.id,
      name: app.name,
      description: app.description,
      slug: app.slug,
      isPublic: app.isPublic,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      userId: app.userId,
      author: app.user,
      activeConfig: app.configs[0]
        ? {
            id: app.configs[0].id,
            version: app.configs[0].version,
            config: app.configs[0].config,
          }
        : null,
    }));

    return NextResponse.json({ data: formatted, error: null });
  } catch (err) {
    console.error("[GET /api/apps]", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/apps — create new app (auth required)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? (!authEnabled && !hasDatabaseUrl() ? LOCAL_USER_ID : null);
    if (!userId) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = CreateAppSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: "Validation failed",
          validationErrors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 422 }
      );
    }

    const { name, description, isPublic, config } = parsed.data;

    // Validate the app config structure
    const { errors: configErrors } = validateConfig(config);
    // configErrors are warnings only — we still save the config

    if (!hasDatabaseUrl()) {
      const app = await createLocalApp({
        name,
        description,
        isPublic,
        config,
        userId,
      });

      return NextResponse.json(
        {
          data: {
            ...app,
            configWarnings: configErrors,
          },
          error: null,
          mode: "local-demo",
        },
        { status: 201 }
      );
    }

    // Generate unique slug
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.app.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${randomUUID().slice(0, 4)}`;
      if (++attempt > 10) slug = `${baseSlug}-${Date.now()}`;
    }

    const app = await prisma.app.create({
      data: {
        name,
        description: description ?? null,
        slug,
        isPublic: isPublic ?? false,
        userId,
        configs: {
          create: { version: 1, config: config as Prisma.InputJsonValue, isActive: true },
        },
      },
      include: {
        configs: { where: { isActive: true }, take: 1 },
      },
    });

    return NextResponse.json(
      {
        data: {
          id: app.id,
          name: app.name,
          slug: app.slug,
          isPublic: app.isPublic,
          createdAt: app.createdAt.toISOString(),
          activeConfig: app.configs[0] ?? null,
          configWarnings: configErrors,
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/apps]", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
