// src/app/api/configs/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateConfig } from "@/lib/config-validator";

// POST /api/configs/validate — validate a config without saving
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (body === null) {
      return NextResponse.json({ data: null, error: "Invalid JSON" }, { status: 400 });
    }

    const result = validateConfig(body);

    return NextResponse.json({
      data: {
        valid: result.valid,
        errors: result.errors,
        componentCount: Array.isArray(result.config?.components)
          ? result.config.components.length
          : null,
        type: result.config?.type ?? null,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: String(err) }, { status: 500 });
  }
}
