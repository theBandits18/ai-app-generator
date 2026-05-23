"use client";
// src/components/engine/TableComponent.tsx
import { isArr, isStr } from "./guards";

interface Props { config: Record<string, unknown>; }

const statusColor: Record<string, string> = {
  active: "var(--success)", pending: "var(--warning)", churned: "var(--error)",
  inactive: "var(--text3)", verified: "var(--accent3)",
};

export function TableComponent({ config }: Props) {
  const title   = isStr(config?.title)   ? config.title   : "Table";
  const columns = isArr(config?.columns) ? (config.columns as unknown[]).filter(isStr) : [];
  const rows    = isArr(config?.rows)    ? (config.rows as unknown[]).filter(isArr) as unknown[][] : [];

  return (
    <div className="fade-up" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
    }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10,
          color: "var(--text3)" }}>{rows.length} rows</span>
      </div>

      {columns.length === 0 ? (
        <div style={{ padding: 20, fontFamily: "var(--mono)", fontSize: 12,
          color: "var(--warning)" }}>⚠ No valid columns — received: {JSON.stringify(config?.columns)}</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 20, fontFamily: "var(--mono)", fontSize: 12,
          color: "var(--text3)" }}>No data rows</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={{
                    padding: "9px 20px", textAlign: "left",
                    fontFamily: "var(--mono)", fontSize: 10, fontWeight: 500,
                    color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em",
                    borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  {columns.map((_, ci) => {
                    const cell = String(row[ci] ?? "—");
                    const sc   = statusColor[cell.toLowerCase()];
                    return (
                      <td key={ci} style={{
                        padding: "11px 20px", fontSize: 13,
                        color: sc ? sc : "var(--text)",
                        fontFamily: ci === 0 ? "var(--sans)" : "var(--mono)",
                        fontWeight: ci === 0 ? 600 : 400,
                      }}>
                        {sc ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc }} />
                            {cell}
                          </span>
                        ) : cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
