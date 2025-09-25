'use client';

import { useState } from "react";

export default function AdminThemePage() {
  const [slug, setSlug] = useState<string>("lena");
  const [json, setJson] = useState<string>("{}");
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function loadTenant() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/tenants/${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as unknown;
      setJson(JSON.stringify(data, null, 2));
      setMsg("Geladen.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  async function saveTheme() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      let body: unknown;
      try {
        body = JSON.parse(json);
      } catch {
        throw new Error("JSON ist ungültig.");
      }
      const res = await fetch(`/api/tenants/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("Gespeichert.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-black">
      <h1 className="text-2xl font-bold">Admin · Theme</h1>

      <div className="mt-4 grid gap-3">
        <label className="text-sm font-medium">Tenant-Slug</label>
        <input
          className="rounded-lg border px-3 py-2"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadTenant}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-100 font-semibold hover:bg-gray-200"
          >
            {loading ? "Lade…" : "Laden"}
          </button>
          <button
            type="button"
            onClick={saveTheme}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            {loading ? "Speichere…" : "Speichern"}
          </button>
        </div>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

        <label className="text-sm font-medium mt-4">JSON</label>
        <textarea
          className="rounded-lg border px-3 py-2 min-h-[360px] font-mono text-sm"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
      </div>
    </main>
  );
}

