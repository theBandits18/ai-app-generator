"use client";
// src/components/engine/StatCard.tsx
import { colorVar, isStr } from "./guards";

interface Props { config: Record<string, unknown>; }

export function StatCard({ config }: Props) {
  const label  = isStr(config?.label)  ? config.label  : "Metric";
  const value  = isStr(config?.value)  ? config.value  : "—";
  const delta  = isStr(config?.delta)  ? config.delta  : null;
  const color  = colorVar(config?.color as string);
  const isPos  = delta ? !delta.startsWith("-") && !delta.startsWith("−") : true;

  return (
    <div className="fade-up" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "20px 24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 11,
          color: isPos ? "var(--success)" : "var(--error)", fontWeight: 500 }}>
          {isPos ? "↑" : "↓"} {delta}
        </div>
      )}
    </div>
  );
}
