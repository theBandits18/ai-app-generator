"use client";
// src/app/dashboard/page.tsx
import { useState } from "react";
import { useApps }        from "@/hooks";
import { AppCardSkeleton } from "@/components/ui/LoadingState";
import { AppRenderer }    from "@/components/engine/AppRenderer";
import { ErrorBoundary }  from "@/components/engine/ErrorBoundary";
import type { AppRecord } from "@/types";

function AppCard({ app, onSelect }: { app: AppRecord; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const cfg = app.activeConfig?.config ?? {};
  const typeLabel = String((cfg as Record<string,unknown>)?.type ?? "unknown");
  const compCount = Array.isArray((cfg as Record<string,unknown>)?.components)
    ? ((cfg as Record<string,unknown>).components as unknown[]).length
    : null;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--surface2)" : "var(--surface)",
        border: `1px solid ${hovered ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 12, padding: 20, cursor: "pointer",
        transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>
          {typeLabel === "dashboard" ? "◈" : typeLabel === "form" ? "▦" : "⚙"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{app.name}</div>
          {app.description && (
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4 }}>{app.description}</div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 8px",
          background: "rgba(99,102,241,0.1)", borderRadius: 4, color: "var(--accent)" }}>
          {typeLabel}
        </span>
        {compCount !== null && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 8px",
            background: "var(--surface3)", borderRadius: 4, color: "var(--text3)" }}>
            {compCount} components
          </span>
        )}
        {app.isPublic && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 8px",
            background: "rgba(16,185,129,0.1)", borderRadius: 4, color: "var(--success)" }}>
            public
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { apps, loading, error, reload } = useApps();
  const [selected, setSelected] = useState<AppRecord | null>(null);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* Sidebar */}
      <div style={{
        width: 300, flexShrink: 0, background: "var(--surface)",
        borderRight: "1px solid var(--border)", display: "flex",
        flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>Your Apps</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
            {loading ? "Loading..." : `${apps.length} app(s)`}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {error && (
            <div style={{ padding: 12, background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
              fontFamily: "var(--mono)", fontSize: 11, color: "var(--error)" }}>
              {error}
              <button onClick={reload} style={{ display: "block", marginTop: 8, fontSize: 11,
                background: "none", border: "none", color: "var(--accent)", cursor: "pointer",
                fontFamily: "var(--mono)" }}>↻ Retry</button>
            </div>
          )}
          {loading
            ? [0,1,2].map(i => <AppCardSkeleton key={i} />)
            : apps.map(app => (
                <AppCard key={app.id} app={app}
                  onSelect={() => setSelected(app)} />
              ))}
          {!loading && apps.length === 0 && !error && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text3)",
              textAlign: "center", marginTop: 40 }}>
              No apps yet.<br/>Run db:seed to populate.
            </div>
          )}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <a href="/" style={{ display: "block", padding: "8px 14px",
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 8, color: "var(--accent)", textDecoration: "none",
            fontFamily: "var(--mono)", fontSize: 12, textAlign: "center",
            transition: "background 0.15s" }}>
            ← Back to Editor
          </a>
        </div>
      </div>

      {/* Preview */}
      <div style={{ flex: 1, overflow: "auto", padding: 32, background: "var(--bg)" }}>
        {selected ? (
          <div className="fade-up">
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setSelected(null)} style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 8,
                padding: "6px 12px", color: "var(--text3)", cursor: "pointer",
                fontFamily: "var(--mono)", fontSize: 11,
              }}>← Back</button>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  /{selected.slug} · v{selected.activeConfig?.version ?? "—"}
                </div>
              </div>
            </div>
            <ErrorBoundary label="App Preview">
              <AppRenderer config={selected.activeConfig?.config ?? {}} />
            </ErrorBoundary>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 48, opacity: 0.15 }}>⚙</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text3)" }}>
              Select an app to preview
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
