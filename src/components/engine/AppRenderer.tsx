"use client";
// src/components/engine/AppRenderer.tsx
import { ComponentDispatcher } from "./ComponentDispatcher";
import { StatCard }            from "./StatCard";
import { FormComponent }       from "./FormComponent";
import { ErrorBoundary }       from "./ErrorBoundary";
import { isArr, isObj, isStr } from "./guards";

interface Props { config: unknown; }

const KNOWN_COMPONENT_TYPES = ["stat", "table", "chart", "form"];

function DashboardLayout({ config }: { config: Record<string, unknown> }) {
  const title      = isStr(config?.title) ? config.title : "Untitled App";
  const components = isArr(config?.components) ? config.components : [];
  const stats      = (components as unknown[]).filter(c => isObj(c) && (c as Record<string,unknown>).type === "stat");
  const others     = (components as unknown[]).filter(c => !isObj(c) || (c as Record<string,unknown>).type !== "stat");
  const total      = (components as unknown[]).length;
  const skipped    = (components as unknown[]).filter(c => !isObj(c) || !KNOWN_COMPONENT_TYPES.includes(String((c as Record<string,unknown>)?.type))).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h1>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          {total} component(s) defined · {skipped} skipped / degraded
        </div>
      </div>

      {stats.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 14, marginBottom: 20,
        }}>
          {(stats as Record<string, unknown>[]).map((c, i) => (
            <ErrorBoundary key={i} label={`stat[${i}]`}>
              <StatCard config={c} />
            </ErrorBoundary>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(others as unknown[]).map((c, i) => (
          <ComponentDispatcher key={i} config={c} index={i} />
        ))}
      </div>
    </div>
  );
}

function FormLayout({ config }: { config: Record<string, unknown> }) {
  return <FormComponent config={config} />;
}

function GenericLayout({ config }: { config: Record<string, unknown> }) {
  const components = isArr(config?.components) ? config.components : [];
  return (
    <div>
      {isStr(config?.title) && (
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{config.title}</h2>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(components as unknown[]).map((c, i) => (
          <ComponentDispatcher key={i} config={c} index={i} />
        ))}
      </div>
    </div>
  );
}

export function AppRenderer({ config }: Props) {
  if (!isObj(config)) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--error)" }}>
          Invalid config — expected a JSON object, got: {config === null ? "null" : typeof config}
        </div>
      </div>
    );
  }

  const type = String(config.type ?? "");
  switch (type) {
    case "dashboard": return <DashboardLayout config={config} />;
    case "form":      return <FormLayout      config={config} />;
    default:          return <GenericLayout   config={config} />;
  }
}
