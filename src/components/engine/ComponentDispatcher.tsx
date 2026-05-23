"use client";
// src/components/engine/ComponentDispatcher.tsx
import { ErrorBoundary } from "./ErrorBoundary";
import { StatCard }        from "./StatCard";
import { TableComponent }  from "./TableComponent";
import { ChartComponent }  from "./ChartComponent";
import { FormComponent }   from "./FormComponent";
import { isObj, isStr }    from "./guards";

interface Props {
  config: unknown;
  index: number;
}

const REGISTRY: Record<string, React.ComponentType<{ config: Record<string, unknown> }>> = {
  stat:  StatCard,
  table: TableComponent,
  chart: ChartComponent,
  form:  FormComponent,
};

function UnknownComponent({ config }: { config: Record<string, unknown> }) {
  return (
    <div style={{
      padding: "10px 14px", background: "rgba(245,158,11,0.07)",
      border: "1px dashed rgba(245,158,11,0.3)", borderRadius: 8,
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <span style={{ fontSize: 16 }}>🔲</span>
      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--warning)" }}>
          Unknown component type: <b>"{String(config?.type ?? "undefined")}"</b> — rendered as fallback
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
          Keys present: {Object.keys(config).join(", ") || "none"}
        </div>
      </div>
    </div>
  );
}

export function ComponentDispatcher({ config, index }: Props) {
  // Null / non-object
  if (!isObj(config)) {
    return (
      <div style={{
        padding: "8px 14px", background: "rgba(239,68,68,0.07)",
        border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
        fontFamily: "var(--mono)", fontSize: 11, color: "var(--error)",
      }}>
        ✕ Null or invalid component at index {index} — skipped
      </div>
    );
  }

  const type = isStr(config.type) ? config.type : null;
  const Comp = type ? REGISTRY[type] : null;

  if (!Comp) {
    return <UnknownComponent config={config} />;
  }

  return (
    <ErrorBoundary label={`${type}[${index}]`}>
      <Comp config={config} />
    </ErrorBoundary>
  );
}
