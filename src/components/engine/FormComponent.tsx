"use client";
// src/components/engine/FormComponent.tsx
import { useState } from "react";
import { isArr, isObj, isStr } from "./guards";
import { ErrorBoundary } from "./ErrorBoundary";

interface Props { config: Record<string, unknown>; }

const KNOWN_TYPES = ["text","email","password","number","textarea","select","toggle","date","url","tel"];

const inputBase: React.CSSProperties = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "10px 14px", color: "var(--text)",
  fontFamily: "var(--mono)", fontSize: 13, outline: "none", transition: "border 0.15s",
};

function Field({ field, value, onChange }: {
  field: Record<string, unknown>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (!isObj(field)) return (
    <div style={{ padding: "8px 12px", background: "rgba(245,158,11,0.06)",
      border: "1px dashed rgba(245,158,11,0.25)", borderRadius: 8,
      fontFamily: "var(--mono)", fontSize: 11, color: "var(--warning)" }}>
      ⚠ Invalid field definition (not an object)
    </div>
  );

  const type  = isStr(field.type) && KNOWN_TYPES.includes(field.type) ? field.type : null;
  const label = isStr(field.label) ? field.label : isStr(field.name) ? field.name : "Unlabeled";
  const ph    = isStr(field.placeholder) ? field.placeholder : "";
  const req   = field.required === true;

  if (!type) return (
    <div style={{ padding: "8px 12px", background: "rgba(245,158,11,0.06)",
      border: "1px dashed rgba(245,158,11,0.25)", borderRadius: 8 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--warning)" }}>
        ⚠ Unknown field type: <b>"{String(field.type ?? "undefined")}"</b> — skipped gracefully
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
        name: {String(field.name ?? "—")}, label: {String(field.label ?? "—")}
      </div>
    </div>
  );

  const labelEl = (
    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: 10,
      color: "var(--text3)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {label}{req && <span style={{ color: "var(--error)", marginLeft: 4 }}>*</span>}
    </label>
  );

  const focus = (e: React.FocusEvent<HTMLElement>) =>
    ((e.target as HTMLElement).style.borderColor = "var(--accent)");
  const blur  = (e: React.FocusEvent<HTMLElement>) =>
    ((e.target as HTMLElement).style.borderColor = "var(--border)");

  if (type === "toggle") {
    const on = value === true || value === "true";
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div onClick={() => onChange(!on)} style={{
          width: 40, height: 22, borderRadius: 11,
          background: on ? "var(--accent)" : "var(--surface3)",
          position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
        }}>
          <div style={{ position: "absolute", top: 3, left: on ? 20 : 3, width: 16, height: 16,
            borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </div>
        <span style={{ fontSize: 13, color: "var(--text2)" }}>{label}</span>
      </label>
    );
  }

  if (type === "textarea") return (
    <div>{labelEl}
      <textarea value={String(value ?? "")} onChange={e => onChange(e.target.value)}
        placeholder={ph} rows={4} onFocus={focus} onBlur={blur}
        style={{ ...inputBase, resize: "vertical", lineHeight: 1.6 }} />
    </div>
  );

  if (type === "select") {
    const opts = isArr(field.options) ? (field.options as unknown[]).filter(isStr) : [];
    return (
      <div>{labelEl}
        <select value={String(value ?? "")} onChange={e => onChange(e.target.value)}
          onFocus={focus} onBlur={blur} style={{ ...inputBase, cursor: "pointer" }}>
          <option value="">— Select —</option>
          {opts.length === 0
            ? <option disabled>No valid options</option>
            : opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div>{labelEl}
      <input type={type} value={String(value ?? "")} onChange={e => onChange(e.target.value)}
        placeholder={ph} onFocus={focus} onBlur={blur} style={inputBase} />
    </div>
  );
}

export function FormComponent({ config }: Props) {
  const title  = isStr(config?.title)        ? config.title        : "Form";
  const btnLbl = isStr(config?.submitLabel)  ? config.submitLabel  : "Submit";
  const fields = isArr(config?.fields)       ? config.fields as Record<string, unknown>[] : [];

  const [values,    setValues]    = useState<Record<string, unknown>>({});
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      if (!isObj(f)) return;
      if (f.required && !values[f.name as string]) errs[f.name as string] = "This field is required";
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="fade-up" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: 32, textAlign: "center",
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--success)", marginBottom: 8 }}>Submitted!</div>
      <pre style={{
        textAlign: "left", background: "var(--surface2)", borderRadius: 8,
        padding: 16, fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent2)",
        overflowX: "auto", maxHeight: 300,
      }}>
        {JSON.stringify(values, null, 2)}
      </pre>
      <button onClick={() => { setSubmitted(false); setValues({}); setErrors({}); }}
        style={{ marginTop: 16, padding: "8px 20px", background: "var(--surface2)",
          border: "1px solid var(--border)", borderRadius: 8, color: "var(--text2)",
          cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12 }}>
        Reset
      </button>
    </div>
  );

  return (
    <div className="fade-up" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          {fields.length} field(s) defined
        </div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {fields.length === 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text3)" }}>
            No fields defined in config.
          </div>
        )}
        {fields.map((field, i) => (
          <div key={i}>
            <ErrorBoundary label={`Field[${i}]`}>
              <Field
                field={field}
                value={isStr(field?.name) ? values[field.name as string] : undefined}
                onChange={v => isStr(field?.name) && setValues(p => ({ ...p, [field.name as string]: v }))}
              />
            </ErrorBoundary>
            {isStr(field?.name) && errors[field.name as string] && (
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--error)", marginTop: 4 }}>
                ✕ {errors[field.name as string]}
              </div>
            )}
          </div>
        ))}
        <button onClick={handleSubmit} style={{
          alignSelf: "flex-start", padding: "10px 28px",
          background: "var(--accent)", border: "none", borderRadius: 8,
          color: "#fff", fontFamily: "var(--sans)", fontWeight: 700,
          fontSize: 14, cursor: "pointer", transition: "opacity 0.15s",
        }}
          onMouseEnter={e => ((e.target as HTMLElement).style.opacity = "0.85")}
          onMouseLeave={e => ((e.target as HTMLElement).style.opacity = "1")}>
          {btnLbl}
        </button>
      </div>
    </div>
  );
}
