"use client";

import { useEffect, useMemo, useState } from "react";

type EventItem = { id: string; title: string; startUTC: string };
type StyleItem = { id: string; name: string };            // vormals Theme
type FontItem  = { id: string; name: string; css?: string | null };
type ColorItem = { id: string; name: string; hex?: string | null };

function usePersistedState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal] as const;
}

function useQuerySync(obj: Record<string, string | undefined>) {
  const search = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => { if (v) p.set(k, v); });
    return p.toString();
  }, [obj]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${location.pathname}?${search}`;
    window.history.replaceState(null, "", url);
  }, [search]);
}

export default function KonfiguratorPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [styles, setStyles] = useState<StyleItem[]>([]);  // vormals themes
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [textColors, setTextColors] = useState<ColorItem[]>([]);

  const [eventId, setEventId] = usePersistedState("cfg:eventId", "");
  const [length, setLength] = usePersistedState<"short"|"medium"|"long">("cfg:length","medium");
  const [styleId, setStyleId] = usePersistedState("cfg:styleId", ""); // vormals themeId
  const [fontId, setFontId] = usePersistedState("cfg:fontId", "");
  const [textColorId, setTextColorId] = usePersistedState("cfg:textColorId", "");

  useQuerySync({ eventId, length, styleId, fontId, textColorId });

  useEffect(() => {
    fetch("/api/events").then(r=>r.json()).then(d=>setEvents(d.events||[])).catch(()=>setEvents([]));
    // NOTE: Wir nutzen weiterhin /api/themes als Quelle, benennen es im UI aber "Stile"
    fetch("/api/themes").then(r=>r.json()).then(d=>setStyles(d.themes||[])).catch(()=>setStyles([]));
    fetch("/api/style-options").then(r=>r.json()).then(d=>{
      setFonts(d.fonts||[]);
      setTextColors(d.textColors||[]);
    }).catch(()=>{
      setFonts([]); setTextColors([]);
    });
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    alert(
      `Ausgewählt:
Event=${eventId}
Länge=${length}
Stil=${styleId || "(default)"}
Font=${fontId || "(default)"}
Textfarbe=${textColorId || "(default)"}`
    );
    // Später: echte Vorschau
    // window.location.href = `/preview?eventId=${encodeURIComponent(eventId)}&length=${length}&styleId=${encodeURIComponent(styleId)}&fontId=${encodeURIComponent(fontId)}&textColorId=${encodeURIComponent(textColorId)}`
  }

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Konfigurator</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span>Astro-Event</span>
          <select required value={eventId} onChange={(e)=>setEventId(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="">Bitte wählen…</option>
            {events.map(e=>(
              <option key={e.id} value={e.id}>
                {e.title} — {new Date(e.startUTC).toLocaleString("de-DE")}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>Textlänge</span>
          <select value={length} onChange={(e)=>setLength(e.target.value as any)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="short">Kurz (80–120 W)</option>
            <option value="medium">Mittel (140–200 W)</option>
            <option value="long">Lang (220–320 W)</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>Stil</span> {/* vormals Theme */}
          <select value={styleId} onChange={(e)=>setStyleId(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="">Standard</option>
            {styles.map(s=>(
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>Typografie</span>
          <select value={fontId} onChange={(e)=>setFontId(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="">Standard</option>
            {fonts.map(f=>(
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>Textfarbe</span>
          <select value={textColorId} onChange={(e)=>setTextColorId(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="">Standard</option>
            {textColors.map(c=>(
              <option key={c.id} value={c.id}>{c.name}{c.hex ? ` (${c.hex})` : ""}</option>
            ))}
          </select>
        </label>

        <button type="submit"
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #111",
                   background: "#111", color: "#fff", fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
          Vorschau erstellen
        </button>
      </form>
    </main>
  );
}

