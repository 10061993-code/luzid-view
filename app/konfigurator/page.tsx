"use client";

import { useEffect, useState } from "react";

type EventItem = { id: string; title: string; startUTC: string };
type ThemeItem = { id: string; name: string; previewCssUrl?: string | null };

export default function KonfiguratorPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);

  const [eventId, setEventId] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [themeId, setThemeId] = useState("");

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => setEvents([]));
    fetch("/api/themes").then(r => r.json()).then(d => setThemes(d.themes || [])).catch(() => setThemes([]));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    alert(
      `Ausgewählt:\nEvent: ${eventId}\nLänge: ${length}\nTheme: ${themeId || "(keins)"}`
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Konfigurator</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span>Astro-Event</span>
          <select
            required
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          >
            <option value="">Bitte wählen…</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {new Date(e.startUTC).toLocaleString("de-DE")}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>Textlänge</span>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value as any)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          >
            <option value="short">Kurz (80–120 W)</option>
            <option value="medium">Mittel (140–200 W)</option>
            <option value="long">Lang (220–320 W)</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>Theme</span>
          <select
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          >
            <option value="">Standard</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {themeId && (
            <small style={{ opacity: 0.7 }}>
              Ausgewählt: <code>{themeId}</code>
            </small>
          )}
        </label>

        <button
          type="submit"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          Vorschau erstellen
        </button>
      </form>
    </main>
  );
}

