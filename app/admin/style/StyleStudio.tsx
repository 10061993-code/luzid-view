// app/admin/style/StyleStudio.tsx
"use client";
import { useEffect, useState } from "react";

type Tenant = { slug: string; display_id?: string; public_name?: string };
type StyleOption = { id: string; label: string; description?: string };
type Horoscope = "birth" | "weekly" | "partner" | "quiz";
type Length = "short" | "medium" | "long";

export default function StyleStudio() {
  // Tenants & Auswahl
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [slug, setSlug] = useState<string>("");

  // Ebenen
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>([]);
  const [styleId, setStyleId] = useState<string>("");
  const [horoscope, setHoroscope] = useState<Horoscope>("weekly");
  const [length, setLength] = useState<Length>("medium");

  // Preview/Status
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Tenants laden (mit optionalem ?tenant=&?role= aus der URL)
  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        const params = new URLSearchParams(
          typeof window !== "undefined" ? window.location.search : ""
        );
        const hint = params.get("tenant") || "";
        const role = params.get("role") || ""; // "admin" für Dev, sonst leer
        const qs = new URLSearchParams();
        if (hint) qs.set("tenant", hint);
        if (role) qs.set("role", role);
        const url = `/api/tenants${qs.toString() ? `?${qs}` : ""}`;

        const r = await fetch(url, { cache: "no-store" });
        const d = await r.json();
        const list: Tenant[] = Array.isArray(d?.tenants) ? d.tenants : [];
        setTenants(list);
        if (list.length >= 1) setSlug(list[0].slug);
      } catch {
        setErr("Konnte Creator-Liste nicht laden.");
      }
    })();
  }, []);

  // Creator-spezifische Stiloptionen laden
  useEffect(() => {
    if (!slug) return;
    (async () => {
      setErr(null);
      try {
        const r = await fetch(`/api/style-options/${slug}`, { cache: "no-store" });
        const d = await r.json();
        const opts: StyleOption[] = Array.isArray(d?.styles) ? d.styles : [];
        if (opts.length === 0) {
          const fb: StyleOption[] = [
            { id: "style1", label: "Stil 1 (tbd.)" },
            { id: "style2", label: "Stil 2 (tbd.)" },
            { id: "style3", label: "Stil 3 (tbd.)" },
          ];
          setStyleOptions(fb);
          setStyleId("style1");
        } else {
          setStyleOptions(opts);
          setStyleId(opts[0].id);
        }
      } catch {
        setErr("Konnte Stil-Optionen nicht laden.");
      }
    })();
  }, [slug]);

  // Preview erzeugen
  async function generatePreview() {
    if (!slug || !styleId) return;
    setBusy(true);
    setErr(null);
    setPreview("");
    try {
      const r = await fetch(`/api/style/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style_id: styleId, horoscope, length }),
      });
      const d = await r.json();
      setPreview(d?.styled || "—");
    } catch {
      setErr("Fehler bei der Vorschau-Erzeugung.");
    } finally {
      setBusy(false);
    }
  }

  const showTenantDropdown = tenants.length > 1;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Style-Studio</h1>

      {/* Zeile 1: Creator / Stil / Horoskop / Länge */}
      <div className="grid md:grid-cols-4 gap-3 items-end">
        {/* Creator */}
        <div className="flex flex-col">
          <label className="text-sm">Creator</label>
          {showTenantDropdown ? (
            <select
              className="border rounded px-2 py-1"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.public_name || t.display_id || t.slug}
                </option>
              ))}
            </select>
          ) : (
            <div className="border rounded px-2 py-1 text-sm">
              {tenants[0]?.public_name ||
                tenants[0]?.display_id ||
                tenants[0]?.slug ||
                "—"}
            </div>
          )}
        </div>

        {/* Stil */}
        <div className="flex flex-col">
          <label className="text-sm">Stil</label>
          <select
            className="border rounded px-2 py-1"
            value={styleId}
            onChange={(e) => setStyleId(e.target.value)}
            disabled={!slug}
          >
            {styleOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Horoskop */}
        <div className="flex flex-col">
          <label className="text-sm">Horoskop</label>
          <select
            className="border rounded px-2 py-1"
            value={horoscope}
            onChange={(e) => setHoroscope(e.target.value as Horoscope)}
          >
            <option value="birth">Birth</option>
            <option value="weekly">Weekly</option>
            <option value="partner">Partner</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>

        {/* Text-Länge */}
        <div className="flex flex-col">
          <label className="text-sm">Text-Länge</label>
          <div className="flex gap-3 text-sm">
            <label>
              <input
                type="radio"
                value="short"
                checked={length === "short"}
                onChange={(e) => setLength(e.target.value as Length)}
              />{" "}
              Kurz
            </label>
            <label>
              <input
                type="radio"
                value="medium"
                checked={length === "medium"}
                onChange={(e) => setLength(e.target.value as Length)}
              />{" "}
              Medium
            </label>
            <label>
              <input
                type="radio"
                value="long"
                checked={length === "long"}
                onChange={(e) => setLength(e.target.value as Length)}
              />{" "}
              Lang
            </label>
          </div>
        </div>
      </div>

      {/* Aktion */}
      <div>
        <button
          onClick={generatePreview}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={!slug || !styleId || busy}
        >
          {busy ? "Generiere…" : "Preview generieren"}
        </button>
      </div>

      {/* Ausgabe */}
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="space-y-2">
        <div className="text-sm opacity-70">Preview</div>
        <div className="border rounded p-4 min-h-[160px] whitespace-pre-wrap leading-relaxed bg-white/70">
          {preview}
        </div>
      </div>
    </div>
  );
}

