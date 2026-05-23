"use client";
// src/app/page.tsx
import { useState } from "react";
import { AppRenderer }  from "@/components/engine/AppRenderer";
import { ErrorBoundary } from "@/components/engine/ErrorBoundary";
import { JsonEditor }   from "@/components/ui/JsonEditor";
import { LoadingState } from "@/components/ui/LoadingState";
import { useJsonEditor, useApps } from "@/hooks";

// ── Sample configs bundled on client ──────────────────────────────────────────
const PRESETS: Record<string, object> = {
  dashboard: {
    type: "dashboard", title: "Analytics Dashboard",
    components: [
      { type: "stat", label: "Total Users",  value: "24,391", delta: "+12%",   color: "accent"  },
      { type: "stat", label: "Revenue",      value: "$84,200", delta: "+8.3%", color: "success" },
      { type: "stat", label: "Churn Rate",   value: "2.4%",   delta: "-0.6%", color: "warning" },
      { type: "stat", label: "Uptime",       value: "99.98%", delta: "+0.02%",color: "accent3" },
      { type: "table", title: "Recent Signups",
        columns: ["Name","Plan","Date","Status"],
        rows: [
          ["Priya Mehta","Pro","2026-05-21","active"],
          ["Arjun Shah","Free","2026-05-20","pending"],
          ["Neha Joshi","Enterprise","2026-05-19","active"],
          ["Ravi Kumar","Pro","2026-05-18","churned"],
        ]},
      { type: "chart", chartType: "bar", title: "Weekly Signups",
        labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        data: [42,78,55,91,63,30,48] },
    ],
  },
  form: {
    type: "form", title: "User Onboarding", submitLabel: "Create Account",
    fields: [
      { type: "text",     name: "fullName",   label: "Full Name",     required: true,  placeholder: "Jane Doe" },
      { type: "email",    name: "email",      label: "Email",         required: true,  placeholder: "jane@example.com" },
      { type: "select",   name: "role",       label: "Role",          required: true,  options: ["Engineer","Designer","Product","Marketing"] },
      { type: "textarea", name: "bio",        label: "Short Bio",     required: false, placeholder: "Tell us about yourself..." },
      { type: "toggle",   name: "newsletter", label: "Subscribe to newsletter", defaultValue: true },
    ],
  },
  broken: {
    type: "dashboard", title: null,
    components: [
      { type: "stat" },
      { type: "unknown_widget", label: "Mystery" },
      { type: "table", columns: null, rows: "not-an-array" },
      { type: "chart", chartType: "pie", data: null },
      null,
      { label: "No type at all" },
    ],
  },
};

const PRESET_META = [
  { key: "dashboard", label: "Dashboard", icon: "◈", desc: "Stats, table & chart" },
  { key: "form",      label: "Form",      icon: "▦", desc: "Dynamic form engine"  },
  { key: "broken",    label: "Broken",    icon: "⚡", desc: "Graceful degradation" },
];

type ViewMode = "split" | "preview" | "editor";
type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "error"; message: string }
  | { state: "success"; message: string; slug: string };

export default function Home() {
  const [activePreset, setActivePreset] = useState("dashboard");
  const [viewMode, setViewMode]         = useState<ViewMode>("split");
  const [presetLoading, setPresetLoading] = useState(false);
  const [appName, setAppName] = useState("Analytics Dashboard");
  const [appDescription, setAppDescription] = useState("Saved from the live editor");
  const [isPublic, setIsPublic] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" });
  const { rawJson, parsedConfig, jsonError, handleChange, setConfig } = useJsonEditor(PRESETS.dashboard);
  const { apps, reload } = useApps(true);

  const loadPreset = (key: string) => {
    setActivePreset(key);
    setPresetLoading(true);
    setTimeout(() => {
      setConfig(PRESETS[key] ?? PRESETS.dashboard);
      const preset = PRESET_META.find((entry) => entry.key === key);
      setAppName(preset?.label ? `AppGen ${preset.label}` : "AppGen Project");
      setAppDescription(preset?.desc ?? "Saved from the live editor");
      setSaveStatus({ state: "idle" });
      setPresetLoading(false);
    }, 500);
  };

  const saveApp = async () => {
    if (jsonError) {
      setSaveStatus({ state: "error", message: "Fix the JSON error before saving." });
      return;
    }

    const name = appName.trim();
    if (!name) {
      setSaveStatus({ state: "error", message: "App name is required." });
      return;
    }

    setSaveStatus({ state: "saving" });

    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: appDescription.trim() || undefined,
          isPublic,
          config: parsedConfig,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save app");
      }

      const slug = String(json.data?.slug ?? "");
      setSaveStatus({
        state: "success",
        message: "App saved successfully.",
        slug,
      });
      reload();
    } catch (error) {
      setSaveStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to save app",
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <header style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 20px", display: "flex", alignItems: "center", gap: 12,
        height: 52, flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 6 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800,
          }}>⚙</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em" }}>AppGen</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em" }}>
              JSON → UI RUNTIME
            </div>
          </div>
        </div>

        {/* Preset buttons */}
        <div style={{ display: "flex", gap: 5 }}>
          {PRESET_META.map(p => (
            <button key={p.key} onClick={() => loadPreset(p.key)} style={{
              padding: "5px 12px", borderRadius: 7, border: "1px solid",
              fontSize: 12, fontFamily: "var(--mono)", cursor: "pointer",
              transition: "all 0.15s", whiteSpace: "nowrap",
              background: activePreset === p.key ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: activePreset === p.key ? "var(--accent)" : "var(--border)",
              color: activePreset === p.key ? "var(--accent)" : "var(--text3)",
            }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="App name"
            style={{
              width: 180,
              padding: "7px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              color: "var(--text)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              outline: "none",
            }}
          />
          <input
            value={appDescription}
            onChange={(e) => setAppDescription(e.target.value)}
            placeholder="Short description"
            style={{
              width: 220,
              padding: "7px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              color: "var(--text)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              outline: "none",
            }}
          />
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--text3)",
          }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>
          <button
            onClick={saveApp}
            disabled={saveStatus.state === "saving"}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid rgba(99,102,241,0.25)",
              background: "rgba(99,102,241,0.14)",
              color: "var(--accent)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              cursor: saveStatus.state === "saving" ? "default" : "pointer",
              opacity: saveStatus.state === "saving" ? 0.7 : 1,
            }}
          >
            {saveStatus.state === "saving" ? "Saving..." : "Save App"}
          </button>
          <a
            href="/dashboard"
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              color: "var(--text3)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: 11,
            }}
          >
            Dashboard
          </a>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["editor","split","preview"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding: "4px 12px", borderRadius: 6, border: "none",
              fontSize: 11, fontFamily: "var(--mono)", cursor: "pointer",
              transition: "all 0.15s", textTransform: "capitalize",
              background: viewMode === v ? "var(--surface3)" : "transparent",
              color: viewMode === v ? "var(--text)" : "var(--text3)",
            }}>{v}</button>
          ))}
        </div>
      </header>

      {/* ── ERROR BANNER ── */}
      {jsonError && (
        <div style={{
          background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.2)",
          padding: "7px 20px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--error)",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        }}>
          ✕ JSON parse error — preview showing last valid config
        </div>
      )}
      {saveStatus.state !== "idle" && (
        <div style={{
          background: saveStatus.state === "error" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
          borderBottom: `1px solid ${saveStatus.state === "error" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
          padding: "7px 20px",
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: saveStatus.state === "error" ? "var(--error)" : "var(--success)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}>
          <span>
            {saveStatus.state === "saving" ? "Saving app..." : saveStatus.message}
          </span>
          {saveStatus.state === "success" && (
            <a
              href={`/app/${saveStatus.slug}`}
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Open app
            </a>
          )}
        </div>
      )}

      {/* ── WORKSPACE ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* Editor pane */}
        {(viewMode === "editor" || viewMode === "split") && (
          <div style={{
            flex: viewMode === "split" ? "0 0 42%" : 1,
            borderRight: viewMode === "split" ? "1px solid var(--border)" : "none",
            display: "flex", flexDirection: "column",
            background: "var(--surface)", overflow: "hidden",
          }}>
            <JsonEditor value={rawJson} onChange={handleChange} error={!!jsonError} />
          </div>
        )}

        {/* Preview pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div style={{ flex: 1, overflow: "auto", background: "var(--bg)", padding: 24 }}>
            {presetLoading ? <LoadingState /> : (
              <div className="fade-up">
                <ErrorBoundary label="AppRenderer">
                  <AppRenderer config={parsedConfig} />
                </ErrorBoundary>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{
        background: "var(--surface)", borderTop: "1px solid var(--border)",
        padding: "5px 20px", display: "flex", alignItems: "center",
        gap: 20, height: 28, flexShrink: 0,
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          {rawJson.split("\n").length} lines · {rawJson.length} chars
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10,
          color: jsonError ? "var(--error)" : "var(--success)" }}>
          {jsonError ? "✕ Invalid JSON" : "✓ Valid JSON"}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          {apps.length > 0 && `${apps.length} saved apps`}
        </span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          type: {String((parsedConfig as Record<string,unknown>)?.type ?? "—")} · preset: {activePreset}
        </span>
      </div>
    </div>
  );
}
