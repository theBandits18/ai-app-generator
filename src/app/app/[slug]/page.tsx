"use client";
// src/app/app/[slug]/page.tsx
import { useEffect, useState } from "react";
import { AppRenderer }  from "@/components/engine/AppRenderer";
import { ErrorBoundary } from "@/components/engine/ErrorBoundary";
import { LoadingState }  from "@/components/ui/LoadingState";
import type { AppRecord } from "@/types";

export default function AppPage({ params }: { params: { slug: string } }) {
  const [app, setApp]         = useState<AppRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/apps/${params.slug}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) setError(j.error);
        else setApp(j.data);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [params.slug]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Mini navbar */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: 48, display: "flex", alignItems: "center", gap: 12,
      }}>
        <a href="/" style={{ textDecoration: "none", color: "var(--text3)",
          fontFamily: "var(--mono)", fontSize: 12 }}>← AppGen</a>
        {app && (
          <>
            <span style={{ color: "var(--border)" }}>/</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{app.name}</span>
            {app.isPublic && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 7px",
                background: "rgba(16,185,129,0.1)", borderRadius: 4, color: "var(--success)" }}>
                public
              </span>
            )}
          </>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
        {loading && <LoadingState />}
        {error && (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--error)" }}>{error}</div>
            <a href="/" style={{ display: "inline-block", marginTop: 16,
              color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 12 }}>← Go home</a>
          </div>
        )}
        {app && (
          <div className="fade-up">
            <ErrorBoundary label="App">
              <AppRenderer config={app.activeConfig?.config ?? {}} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
