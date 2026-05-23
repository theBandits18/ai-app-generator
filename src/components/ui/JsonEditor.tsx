"use client";
// src/components/ui/JsonEditor.tsx

interface Props {
  value: string;
  onChange: (v: string) => void;
  error: boolean;
}

export function JsonEditor({ value, onChange, error }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        padding: "10px 16px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)",
          textTransform: "uppercase", letterSpacing: "0.1em" }}>JSON Config</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10,
          color: error ? "var(--error)" : "var(--success)" }}>
          {error ? "✕ Parse error" : "✓ Valid JSON"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          flex: 1, background: "transparent", border: "none", outline: "none",
          color: error ? "rgba(239,68,68,0.8)" : "var(--accent2)",
          fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.75,
          padding: "16px", resize: "none", minHeight: 300,
        }}
      />
    </div>
  );
}
