// src/app/api/apps/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth, authEnabled } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateAppSchema, validateConfig } from "@/lib/config-validator";
import {
  LOCAL_USER_ID,
  deleteLocalApp,
  getLocalApp,
  hasDatabaseUrl,
  updateLocalApp,
} from "@/lib/local-store";

type Params = { params: { id: string } };

// GET /api/apps/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const { id } = params;

    if (!hasDatabaseUrl()) {
      const app = await getLocalApp(id);
      if (!app) {
        return NextResponse.json({ data: null, error: "App not found" }, { status: 404 });
      }

      const requesterId = session?.user?.id ?? (!authEnabled ? LOCAL_USER_ID : null);
      if (!app.isPublic && app.userId !== requesterId) {
        return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ data: app, error: null, mode: "local-demo" });
    }

    const app = await prisma.app.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        configs: {
          orderBy: { version: "desc" },
        },
        user: { select: { name: true, image: true, email: true } },
      },
    });

    if (!app) {
      return NextResponse.json({ data: null, error: "App not found" }, { status: 404 });
    }

    // Private apps only visible to owner
    if (!app.isPublic && app.userId !== session?.user?.id) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    const activeConfig = app.configs.find((c) => c.isActive) ?? app.configs[0] ?? null;

    return NextResponse.json({
      data: {
        id: app.id,
        name: app.name,
        description: app.description,
        slug: app.slug,
        isPublic: app.isPublic,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        userId: app.userId,
        author: app.user,
        activeConfig: activeConfig
          ? { id: activeConfig.id, version: activeConfig.version, config: activeConfig.config }
          : null,
        configHistory: app.configs.map((c) => ({
          id: c.id,
          version: c.version,
          isActive: c.isActive,
          createdAt: c.createdAt.toISOString(),
        })),
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/apps/[id]]", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/apps/[id] — update app + optionally push new config version
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? (!authEnabled && !hasDatabaseUrl() ? LOCAL_USER_ID : null);
    if (!userId) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = UpdateAppSchema.safeParse(body);
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
    const configWarnings: string[] = [];

    if (!hasDatabaseUrl()) {
      const existing = await getLocalApp(id);
      if (!existing) return NextResponse.json({ data: null, error: "App not found" }, { status: 404 });
      if (existing.userId !== userId) {
        return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
      }

      if (config !== undefined) {
        const { errors } = validateConfig(config);
        configWarnings.push(...errors);
      }

      const updated = await updateLocalApp(id, { name, description, isPublic, config });
      if (!updated) return NextResponse.json({ data: null, error: "App not found" }, { status: 404 });

      return NextResponse.json({
        data: {
          ...updated,
          configWarnings,
        },
        error: null,
        mode: "local-demo",
      });
    }

    const app = await prisma.app.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!app) return NextResponse.json({ data: null, error: "App not found" }, { status: 404 });
    if (app.userId !== userId) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    // If new config provided, push a new version
    if (config !== undefined) {
      const { errors } = validateConfig(config);
      configWarnings.push(...errors);

      const latest = await prisma.appConfig.findFirst({
        where: { appId: app.id },
        orderBy: { version: "desc" },
      });
      const nextVersion = (latest?.version ?? 0) + 1;

      // Deactivate old configs
      await prisma.appConfig.updateMany({
        where: { appId: app.id },
        data: { isActive: false },
      });

      // Create new active version
      await prisma.appConfig.create({
        data: {
          appId: app.id,
          version: nextVersion,
          config: config as Prisma.InputJsonValue,
          isActive: true,
        },
      });
    }

    const updated = await prisma.app.update({
      where: { id: app.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        configs: { where: { isActive: true }, take: 1 },
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        updatedAt: updated.updatedAt.toISOString(),
        activeConfig: updated.configs[0] ?? null,
        configWarnings,
      },
      error: null,
    });
  } catch (err) {
    console.error("[PUT /api/apps/[id]]", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/apps/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? (!authEnabled && !hasDatabaseUrl() ? LOCAL_USER_ID : null);
    if (!userId) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!hasDatabaseUrl()) {
      const existing = await getLocalApp(id);
      if (!existing) return NextResponse.json({ data: null, error: "App not found" }, { status: 404 });
      if (existing.userId !== userId) {
        return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
      }

      await deleteLocalApp(id);
      return NextResponse.json({
        data: { deleted: true, id: existing.id },
        error: null,
        mode: "local-demo",
      });
    }

    const app = await prisma.app.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!app) return NextResponse.json({ data: null, error: "App not found" }, { status: 404 });
    if (app.userId !== userId) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    await prisma.app.delete({ where: { id: app.id } });
    return NextResponse.json({ data: { deleted: true, id: app.id }, error: null });
  } catch (err) {
    console.error("[DELETE /api/apps/[id]]", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
