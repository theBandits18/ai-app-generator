"use client";
// src/components/ui/LoadingState.tsx

export function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="shimmer" style={{ height: 28, width: 200 }} />
      <div className="shimmer" style={{ height: 14, width: 140 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 8 }}>
        {[0,1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 90 }} />)}
      </div>
      <div className="shimmer" style={{ height: 180, marginTop: 4 }} />
      <div className="shimmer" style={{ height: 120 }} />
    </div>
  );
}

export function AppCardSkeleton() {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div className="shimmer" style={{ height: 18, width: "60%" }} />
      <div className="shimmer" style={{ height: 12, width: "80%" }} />
      <div className="shimmer" style={{ height: 12, width: "40%" }} />
    </div>
  );
}
