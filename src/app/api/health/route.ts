// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasBlobStore, hasDatabaseUrl } from "@/lib/local-store";

export async function GET() {
  try {
    if (hasBlobStore() && !hasDatabaseUrl()) {
      return NextResponse.json({
        status: "ok",
        db: "vercel-blob-store",
        timestamp: new Date().toISOString(),
      });
    }

    if (!hasDatabaseUrl()) {
      return NextResponse.json({
        status: "ok",
        db: "local-demo-store",
        timestamp: new Date().toISOString(),
      });
    }

    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", db: "disconnected", error: String(err) },
      { status: 503 }
    );
  }
}
