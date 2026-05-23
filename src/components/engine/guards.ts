// src/components/engine/guards.ts
export const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
export const isStr = (v: unknown): v is string => typeof v === "string" && (v as string).trim().length > 0;
export const isNum = (v: unknown): v is number => typeof v === "number" && isFinite(v);
export const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

export const safe = <T>(fn: () => T, fallback: T): T => {
  try { return fn(); } catch { return fallback; }
};

export const colorVar = (c?: string): string =>
  ({
    accent: "var(--accent)",
    accent2: "var(--accent2)",
    accent3: "var(--accent3)",
    success: "var(--success)",
    warning: "var(--warning)",
    error: "var(--error)",
  }[c ?? ""] ?? "var(--accent)");
