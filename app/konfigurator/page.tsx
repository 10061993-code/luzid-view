"use client";

import { useEffect, useState } from "react";

type EventItem = {
  id: string;
  title: string;
  startUTC: string;
};

export default function KonfiguratorPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => setEvents([]));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Hier später: Request an Backend /preview o.ä.
    alert(`Ausgewählt:\nEvent: ${eventId}\nLänge: ${length}`);
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Konfigurator
      </h1>

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

