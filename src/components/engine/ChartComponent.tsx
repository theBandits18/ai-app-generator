"use client";
// src/components/engine/ChartComponent.tsx
import { isArr, isNum, isStr } from "./guards";

interface Props { config: Record<string, unknown>; }

export function ChartComponent({ config }: Props) {
  const title   = isStr(config?.title) ? config.title : "Chart";
  const rawData = isArr(config?.data)
    ? (config.data as unknown[]).filter(isNum)
    : [];
  const labels  = isArr(config?.labels)
    ? (config.labels as unknown[]).map((l) => String(l))
    : rawData.map((_, i) => `${i + 1}`);

  if (rawData.length === 0) {
    return (
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "16px 20px",
        fontFamily: "var(--mono)", fontSize: 12, color: "var(--warning)",
      }}>
        ⚠ Chart "{title}" — no valid numeric data. Received: {JSON.stringify(config?.data)}
      </div>
    );
  }

  const W = 440, H = 110, padX = 8;
  const max = Math.max(...rawData, 1);
  const barW = (W - padX * (rawData.length + 1)) / rawData.length;

  return (
    <div className="fade-up" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
    }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent3)", display: "inline-block" }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          {String(config?.chartType ?? "BAR").toUpperCase()}
        </span>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", overflow: "visible" }}>
          {rawData.map((v, i) => {
            const bh  = (v / max) * H;
            const x   = padX + i * (barW + padX);
            const y   = H - bh;
            const hue = 240 + i * 18;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={bh} rx={4}
                  fill={`hsl(${hue},68%,62%)`} opacity={0.9} />
                <text x={x + barW / 2} y={H + 16} textAnchor="middle"
                  style={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text3)" }}>
                  {labels[i] ?? ""}
                </text>
                <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                  style={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text2)" }}>
                  {v}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
