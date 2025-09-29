// app/konfigurator/page.tsx
"use client";

import { useMemo, useState } from "react";

// Zentrale Kataloge & Presets (Single Source of Truth)
import { EVENT_CATALOG } from "../../lib/events";
import { TONES, LENGTH_PRESETS, FOCUSES } from "../../lib/contentPresets";
import { FONTS, COLOR_TOKENS_DARK, themeToStyle, validateTheme } from "../../lib/themes";


// Typsicher bleiben
import type {
  Tone,
  Length,
  ContentConfig,
  ThemeConfig,
  BirthInput,
  GeneratorPayload,
  Focus,
} from "@/lib/types";

const DEFAULT_CONTENT: ContentConfig = { event: "new-moon", tone: "warm", length: "short" };
const DEFAULT_THEME: ThemeConfig = { font_family: "Inter", font_weight_scale: "normal", font_color: "#111111" };
const DEFAULT_BIRTH: BirthInput = { name: "", city: "", date: "", time: "12:00", unknown_time: false };

export default function KonfiguratorPage() {
  const [creator] = useState<string>(process.env.NEXT_PUBLIC_CREATOR_SLUG || "lena");
  const [content, setContent] = useState<ContentConfig>(DEFAULT_CONTENT);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [birth, setBirth] = useState<BirthInput>(DEFAULT_BIRTH);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");

  const canGenerate = useMemo(() => !!content.event, [content.event]);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      // Theme bleibt Frontend-only, nicht an GPT senden
      const payload: GeneratorPayload = {
        type: "drop",
        event: content.event,
        creator,
        tone: content.tone,
        length: content.length,
        focus: content.focus,
        birth:
          birth.name || birth.city || birth.date || birth.time || birth.unknown_time
            ? {
                name: birth.name,
                city: birth.city,
                date: birth.date,
                time: birth.unknown_time ? "12:00" : birth.time,
                unknown_time: birth.unknown_time,
              }
            : undefined,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Generator responded ${res.status}`);
      const data = (await res.json()) as { text?: string };
      setText(data?.text || "Kein Text erhalten.");
    } catch (e: any) {
      setError(e?.message || "Fehler bei der Generierung.");
    } finally {
      setLoading(false);
    }
  }

  // Preview-Styles strikt aus Theme ableiten (validiert)
  const previewStyle = themeToStyle(validateTheme(theme));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Luzid – Events Konfigurator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Eine Seite, zwei Bereiche: <strong>Content</strong> (wirkt auf GPT) & <strong>Theme</strong> (wirkt auf CSS).
        Live-Preview rechts.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <section className="lg:col-span-2 space-y-6">
          {/* Content */}
          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Content</h2>
              <span className="text-xs text-gray-500">wirkt auf GPT</span>
            </div>

            {/* Event */}
            <label className="block text-sm font-medium mb-2">Astro Event</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.values(EVENT_CATALOG).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setContent((c) => ({ ...c, event: ev.id }))}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    content.event === ev.id ? "border-black" : "border-gray-300"
                  }`}
                  title={`${ev.leitfrage} · ${ev.zeitlicherKontext}`}
                >
                  {ev.title}
                </button>
              ))}
            </div>

            {/* Tone */}
            <label className="block text-sm font-medium mb-2">Tone</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {TONES.map((t: Tone) => (
                <button
                  key={t}
                  onClick={() => setContent((c) => ({ ...c, tone: t }))}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    content.tone === t ? "border-black" : "border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Length */}
            <label className="block text-sm font-medium mb-2">Länge</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {(["short", "medium", "long"] as Length[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setContent((c) => ({ ...c, length: l }))}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    content.length === l ? "border-black" : "border-gray-300"
                  }`}
                  title={LENGTH_PRESETS[l].label}
                >
                  {LENGTH_PRESETS[l].label}
                </button>
              ))}
            </div>

            {/* Optional: Focus */}
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium">Fokus (optional)</label>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={content.focus || ""}
                onChange={(e) =>
                  setContent((c) => ({ ...c, focus: (e.target.value || undefined) as Focus }))
                }
              >
                <option value="">—</option>
                {FOCUSES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Birth Inline */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full border rounded-md px-2 py-1"
                  value={birth.name}
                  onChange={(e) => setBirth((b) => ({ ...b, name: e.target.value }))}
                  placeholder="z. B. Lena"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stadt</label>
                <input
                  className="w-full border rounded-md px-2 py-1"
                  value={birth.city}
                  onChange={(e) => setBirth((b) => ({ ...b, city: e.target.value }))}
                  placeholder="z. B. Hamburg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Geburtsdatum</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-2 py-1"
                  value={birth.date}
                  onChange={(e) => setBirth((b) => ({ ...b, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Geburtszeit</label>
                <input
                  type="time"
                  disabled={birth.unknown_time}
                  className="w-full border rounded-md px-2 py-1 disabled:opacity-50"
                  value={birth.time}
                  onChange={(e) => setBirth((b) => ({ ...b, time: e.target.value }))}
                />
                <label className="mt-1 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={birth.unknown_time}
                    onChange={(e) =>
                      setBirth((b) => ({
                        ...b,
                        unknown_time: e.target.checked,
                        time: e.target.checked ? "12:00" : b.time,
                      }))
                    }
                  />
                  Uhrzeit unbekannt (setzt 12:00)
                </label>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Theme</h2>
              <span className="text-xs text-gray-500">wirkt auf CSS</span>
            </div>

            {/* Font */}
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm font-medium w-28">Typo</label>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={theme.font_family}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, font_family: e.target.value as ThemeConfig["font_family"] }))
                }
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Weight */}
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm font-medium w-28">Gewicht</label>
              <div className="flex gap-2">
                {(["normal", "strong"] as ThemeConfig["font_weight_scale"][]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setTheme((t) => ({ ...t, font_weight_scale: w }))}
                    className={`px-3 py-1.5 rounded-full border text-sm ${
                      theme.font_weight_scale === w ? "border-black" : "border-gray-300"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Color */}
            <div className="flex items-center gap-3 mb-1">
              <label className="text-sm font-medium w-28">Farbe Typo</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_TOKENS_DARK.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setTheme((t) => ({ ...t, font_color: hex }))}
                    className={`w-8 h-8 rounded-full border ${
                      theme.font_color === hex ? "border-black" : "border-gray-300"
                    }`}
                    style={{ background: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>

            {/* Optional extras */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">Background (optional)</label>
                <input
                  className="w-full border rounded-md px-2 py-1"
                  placeholder="#FFFFFF oder CSS var()"
                  value={theme.bg_color || ""}
                  onChange={(e) => setTheme((t) => ({ ...t, bg_color: e.target.value || undefined }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Accent (optional)</label>
                <input
                  className="w-full border rounded-md px-2 py-1"
                  placeholder="#EAB308"
                  value={theme.accent_color || ""}
                  onChange={(e) => setTheme((t) => ({ ...t, accent_color: e.target.value || undefined }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className="px-4 py-2 rounded-xl border bg-black text-white disabled:opacity-60"
            >
              {loading ? "Generiere…" : "Vorschau anzeigen"}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </section>

        {/* Preview */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border p-5 min-h-[520px]" style={previewStyle as any}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60">
                  {EVENT_CATALOG[content.event].title}
                </div>
                <h3 className="text-xl font-semibold mt-1">Preview</h3>
              </div>
              {theme.accent_color && (
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: theme.accent_color }} />
              )}
            </div>

            <p className="mt-4 text-xs opacity-70">
              {EVENT_CATALOG[content.event].leitfrage} · {EVENT_CATALOG[content.event].zeitlicherKontext}
            </p>

            <div className="mt-4 whitespace-pre-wrap leading-relaxed text-[15px]">
              {text
                ? text
                : "Generische Vorschau: Wir zeigen hier einen Beispieltext im gewählten Ton & Länge. Personalisierte Inhalte erscheinen nach Klick auf „Vorschau anzeigen“."}
            </div>

            <div className="mt-6 border-t pt-3 text-xs opacity-70">
              <div>
                <strong>Ton:</strong> {content.tone} · <strong>Länge:</strong> {LENGTH_PRESETS[content.length].label}
              </div>
              <div className="mt-1">
                <strong>Typo:</strong> {theme.font_family} · <strong>Farbe:</strong> {theme.font_color}
                {theme.bg_color ? ` · BG: ${theme.bg_color}` : ""} {theme.accent_color ? ` · Accent: ${theme.accent_color}` : ""}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Hinweis: Theme-Einstellungen gehen <em>nicht</em> an GPT. Der Request an <code>/api/generate</code> enthält nur
        Content-Parameter (Event, Tone, Length, optional Focus & Birth).
      </div>
    </main>
  );
}

