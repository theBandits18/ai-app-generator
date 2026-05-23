"use client";
// src/components/engine/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; label?: string; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(e: Error): State { return { error: e }; }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "10px 14px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 8,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 16, marginTop: 1 }}>⚠️</span>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--error)", fontWeight: 500 }}>
              {this.props.label ?? "Component"} crashed
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              {this.state.error.message}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
