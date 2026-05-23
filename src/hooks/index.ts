"use client";
// src/hooks/index.ts
import { useState, useEffect, useRef, useCallback } from "react";
import type { AppRecord } from "@/types";

// ── useDebounce ────────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── useApps — fetch list of apps ──────────────────────────────────────────────
export function useApps(publicOnly = false) {
  const [apps, setApps]       = useState<AppRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/apps${publicOnly ? "?public=true" : ""}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load apps");
      setApps(json.data ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [publicOnly]);

  useEffect(() => { load(); }, [load]);
  return { apps, loading, error, reload: load };
}

// ── useApp — fetch single app by id or slug ───────────────────────────────────
export function useApp(idOrSlug: string | null) {
  const [app, setApp]         = useState<AppRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    setLoading(true);
    setError(null);
    fetch(`/api/apps/${idOrSlug}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) setError(j.error);
        else setApp(j.data);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  return { app, loading, error };
}

// ── useJsonEditor — manage live JSON editing + debounced parse ─────────────────
export function useJsonEditor(initial: object) {
  const [rawJson, setRawJson]         = useState(() => JSON.stringify(initial, null, 2));
  const [parsedConfig, setParsed]     = useState<unknown>(initial);
  const [jsonError, setJsonError]     = useState<string | null>(null);
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((val: string) => {
    setRawJson(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const parsed = JSON.parse(val);
        setParsed(parsed);
        setJsonError(null);
      } catch {
        setJsonError("Invalid JSON");
      }
    }, 380);
  }, []);

  const setConfig = useCallback((cfg: object) => {
    const str = JSON.stringify(cfg, null, 2);
    setRawJson(str);
    setParsed(cfg);
    setJsonError(null);
  }, []);

  return { rawJson, parsedConfig, jsonError, handleChange, setConfig };
}
