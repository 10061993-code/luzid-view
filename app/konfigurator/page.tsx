'use client';

import { useMemo, useState } from "react";
import LeadCTAForm from "@/components/LeadCTAForm";

type Device = "phone" | "tablet" | "desktop";

const BRANDING_ENABLED = process.env.NEXT_PUBLIC_BRANDING_ENABLED === "true";
const DEFAULT_TEXT =
  "Klicke auf „Text generieren“, um eine Vorschau deines Horoskop-Textes zu erhalten. " +
  "Im Demo-Modus sind Speichern & Export deaktiviert. Für deinen eigenen Style (Logo, Farben, Typo) – einfach unten Demo anfragen.";

export default function KonfiguratorPage() {
  // Formular-State
  const [type, setType] = useState<"birth" | "weekly" | "partner" | "quiz">("weekly");
  const [style, setStyle] = useState<"neutral" | "warm" | "direct" | "poetic">("neutral");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  // Branding (nur Vorschau; echte Freischaltung später hinter Login)
  const [font, setFont] = useState<"Inter" | "Playfair" | "Helvetica Neue" | "System">("Inter");

  // Preview-State
  const [device, setDevice] = useState<Device>("phone");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string>(DEFAULT_TEXT);

  // API-Ziel: Entweder öffentlich konfigurierbar (NEXT_PUBLIC_GENERATE_URL) oder Fallback
  const API_URL = process.env.NEXT_PUBLIC_GENERATE_URL || "";

  const deviceWidth = useMemo(() => {
    switch (device) {
      case "phone":
        return 390; // iPhone 15 Breite ~390px
      case "tablet":
        return 744; // iPad Mini
      case "desktop":
        return 1024;
      default:
        return 390;
    }
  }, [device]);

  const fontFamily = useMemo(() => {
    switch (font) {
      case "Inter":
        return `'Inter', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'`;
      case "Playfair":
        return `'Playfair Display', Georgia, Cambria, 'Times New Roman', Times, serif`;
      case "Helvetica Neue":
        return `'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans'`;
      case "System":
      default:
        return `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`;
    }
  }, [font]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      if (API_URL) {
        // Einfache GET-Variante (du kannst auch POST verwenden)
        const url = new URL(API_URL);
        url.searchParams.set("type", type);
        url.searchParams.set("style", style);
        url.searchParams.set("length", length);

        const res = await fetch(url.toString(), { method: "GET" });
        if (!res.ok) {
          throw new Error(`API ${res.status}`);
        }

        // Versuche zuerst JSON zu lesen, falle auf Text zurück
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          const text = data.text || data.result || data.output || "";
          setResult(text || DEFAULT_TEXT);
        } else {
          const text = await res.text();
          setResult(text || DEFAULT_TEXT);
        }
      } else {
        // Fallback: Demo-Text lokal
        const demo = `Demo-Vorschau (${type}, ${style}, ${length}): 
Heute öffnet sich ein klares Fenster für Fokus und kleine Neuanfänge. 
Nutze die nächsten Stunden, um etwas Konkretes anzustoßen – weniger Grübeln, mehr Tun.`;
        setResult(demo);
      }
    } catch (e: any) {
      setErr(e?.message || "Fehler beim Generieren.");
      setResult(DEFAULT_TEXT);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-black">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Konfigurator</h1>
        <p className="text-gray-700">
          Öffentliche Demo. Wähle Art, Stil und Länge und generiere eine Vorschau.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {/* Linke Spalte: Formular */}
        <form onSubmit={handleGenerate} className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Horoskop-Art</label>
            <select
              className="rounded-lg border px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="weekly">Wöchentlich (Transit)</option>
              <option value="birth">Geburtshoroskop</option>
              <option value="partner">Partner (Synastrie)</option>
              <option value="quiz">Quiz/Antwort-Interpretation</option>
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Stil (Tonalität)</label>
            <select
              className="rounded-lg border px-3 py-2"
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
            >
              <option value="neutral">Neutral/ausgewogen</option>
              <option value="warm">Warm & konkret</option>
              <option value="direct">Direkt & prägnant</option>
              <option value="poetic">Poetisch</option>
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Textlänge</label>
            <select
              className="rounded-lg border px-3 py-2"
              value={length}
              onChange={(e) => setLength(e.target.value as any)}
            >
              <option value="short">Kurz (~120–180 Wörter)</option>
              <option value="medium">Mittel (~250–400 Wörter)</option>
              <option value="long">Lang (~500–700 Wörter)</option>
            </select>
          </div>

          {/* Branding-Preview (immer erlaubt als Vorschau; echte Freischaltung später hinter Login) */}
          <div className="grid gap-1">
            <label className="text-sm font-medium">
              Typografie {BRANDING_ENABLED ? "" : <span className="text-xs text-gray-500">(Vorschau)</span>}
            </label>
            <select
              className="rounded-lg border px-3 py-2"
              value={font}
              onChange={(e) => setFont(e.target.value as any)}
            >
              <option value="Inter">Inter</option>
              <option value="Playfair">Playfair</option>
              <option value="Helvetica Neue">Helvetica Neue</option>
              <option value="System">System</option>
            </select>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Generiere…" : "Text generieren"}
          </button>

          {!process.env.NEXT_PUBLIC_GENERATE_URL && (
            <p className="text-xs text-gray-500">
              Hinweis: <code>NEXT_PUBLIC_GENERATE_URL</code> ist nicht gesetzt – zeige Demo-Text.
            </p>
          )}
        </form>

        {/* Rechte Spalte: Preview */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vorschau</h2>
            <div className="flex gap-2">
              <button
                className={`rounded-lg border px-3 py-1 text-sm ${device === "phone" ? "bg-gray-100" : ""}`}
                onClick={() => setDevice("phone")}
                type="button"
                aria-pressed={device === "phone"}
              >
                Phone
              </button>
              <button
                className={`rounded-lg border px-3 py-1 text-sm ${device === "tablet" ? "bg-gray-100" : ""}`}
                onClick={() => setDevice("tablet")}
                type="button"
                aria-pressed={device === "tablet"}
              >
                Tablet
              </button>
              <button
                className={`rounded-lg border px-3 py-1 text-sm ${device === "desktop" ? "bg-gray-100" : ""}`}
                onClick={() => setDevice("desktop")}
                type="button"
                aria-pressed={device === "desktop"}
              >
                Desktop
              </button>
            </div>
          </div>

          <div className="mx-auto overflow-hidden rounded-xl border" style={{ width: deviceWidth }}>
            <article
              className="prose max-w-none p-4"
              style={{ fontFamily }}
            >
              {result.split("\n").map((line, i) => (
                <p key={i} className="whitespace-pre-wrap leading-relaxed">
                  {line}
                </p>
              ))}
            </article>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Diese Vorschau zeigt nur Typografie & Layout. Branding in Produktion wird im Login/Pro-Modus freigeschaltet.
          </p>
        </section>
      </section>

      {/* === CTA: Demo-Anfrage-Formular === */}
      <LeadCTAForm className="mt-10" />
    </main>
  );
}

