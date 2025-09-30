// lib/registry.ts
// Zentrale, fehlertolerante Registry für Events, Stile (Themes), Fonts, Textfarben.

import * as eventsLib from "@/lib/events";
import * as themesLib from "@/lib/themes";
import * as contentLib from "@/lib/contentPresets";

type AnyRec = Record<string, any>;

export type RegistryEvent = {
  id: string;
  title: string;
  startUTC: string; // ISO
  zodiac?: string | null;
  description?: string | null;
  type?: string | null;
  tags?: string[] | null;
};

export type RegistryTheme = {
  id: string;
  name: string;
  previewCssUrl?: string | null;
};

export type RegistryFont = {
  id: string;
  name: string;
  css?: string | null;
};

export type RegistryColor = {
  id: string;
  name: string;
  hex?: string | null;
};

// ---------- helpers

function isISODate(s: unknown): s is string {
  return typeof s === "string" && !Number.isNaN(Date.parse(s));
}

function arr(x: any): any[] {
  return Array.isArray(x) ? x : [];
}

function pickArray(obj: AnyRec, keys: string[]): any[] | null {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  const d = obj.default;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    for (const k of keys) {
      const v = d[k];
      if (Array.isArray(v)) return v;
    }
  }
  return null;
}

// ---------- EVENTS

export function getEventsNext14Days(from = new Date()): RegistryEvent[] {
  const anyEvents: AnyRec = eventsLib as any;

  // Wenn vorhanden, bevorzugt die Helper-Funktion nutzen:
  if (typeof anyEvents.eventsInNextDays === "function") {
    const list = arr(anyEvents.eventsInNextDays(14, from)).map((e: any, i: number) => ({
      id: String(e.id ?? e.key ?? e.slug ?? i),
      title: String(e.title ?? "Event"),
      startUTC: String(e.startUTC ?? e.date ?? e.start ?? ""),
      zodiac: e.zodiac ?? null,
      description: e.description ?? null,
      type: e.type ?? null,
      tags: Array.isArray(e.tags) ? e.tags : null,
    }));
    return list.filter((e) => isISODate(e.startUTC)).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
  }

  // sonst direkt Arrays aus der Lib greifen:
  const base =
    pickArray(anyEvents, ["ASTRO_EVENTS_NEXT_2W", "EVENTS", "events"]) ?? [];
  const list = arr(base).map((e: any, i: number) => ({
    id: String(e.id ?? e.key ?? e.slug ?? i),
    title: String(e.title ?? "Event"),
    startUTC: String(e.startUTC ?? e.date ?? e.start ?? ""),
    zodiac: e.zodiac ?? null,
    description: e.description ?? null,
    type: e.type ?? null,
    tags: Array.isArray(e.tags) ? e.tags : null,
  }));
  return list.filter((e) => isISODate(e.startUTC)).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
}

// ---------- THEMES / STILE

export function getThemes(): RegistryTheme[] {
  const anyThemes: AnyRec = themesLib as any;

  // 1) typische Export-Varianten
  const candidates = [
    anyThemes.THEMES,
    anyThemes.THEME_PRESETS,
    anyThemes.PRESETS,
    anyThemes.items,
    anyThemes.default,
  ].filter(Boolean);

  let base: any[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) { base = c; break; }
    if (c && typeof c === "object" && Array.isArray(c.items)) { base = c.items; break; }
  }

  // 2) Fallback: Objekt mit Werten (z. B. {lena:{...}, paul:{...}})
  if (base.length === 0 && anyThemes && typeof anyThemes === "object") {
    const vals = Object.values(anyThemes).filter((v: any) => v && typeof v === "object");
    if (vals.length && !Array.isArray(anyThemes)) {
      base = vals;
    }
  }

  // 3) Wenn immer noch nichts → vorsichtige Defaults
  if (base.length === 0) {
    return [
      { id: "style-1", name: "Stil 1", previewCssUrl: null },
      { id: "style-2", name: "Stil 2", previewCssUrl: null },
    ];
  }

  return arr(base).map((t: any, i: number) => ({
    id: String(t.id ?? t.key ?? t.slug ?? i),
    name: String(t.name ?? t.label ?? t.title ?? `Stil ${i}`),
    previewCssUrl:
      t.cssUrl ??
      t.url ??
      t.preview ??
      (typeof t.previewCss === "string" ? t.previewCss : null),
  }));
}

// ---------- FONTS

export function getFonts(): RegistryFont[] {
  const anyContent: AnyRec = contentLib as any;
  const anyThemes: AnyRec = themesLib as any;

  const fromContent = pickArray(anyContent, ["FONTS", "FONT_PRESETS", "TYPOGRAPHY", "TYPO_PRESETS"]);
  const fromThemes  = pickArray(anyThemes,  ["FONTS", "FONT_PRESETS", "TYPOGRAPHY", "TYPO_PRESETS"]);

  let base = fromContent ?? fromThemes ?? [];

  // Fallback: wenn in default ein Objekt mit .fonts liegt
  if (base.length === 0 && anyContent?.default && Array.isArray(anyContent.default.fonts)) {
    base = anyContent.default.fonts;
  }

  const normalized = arr(base).map((f: any, i: number) => ({
    id: String(f.id ?? f.key ?? f.slug ?? f.value ?? f.name ?? i),
    name: String(f.name ?? f.label ?? f.title ?? `Font ${i}`),
    css: f.css ?? f.cssUrl ?? f.fontFamily ?? null,
  }));

  if (normalized.length === 0) {
    return [
      { id: "font-1", name: "Font 1", css: null },
      { id: "font-2", name: "Font 2", css: null },
      { id: "font-3", name: "Font 3", css: null },
    ];
  }
  return normalized;
}

// ---------- TEXT COLORS

export function getTextColors(): RegistryColor[] {
  const anyContent: AnyRec = contentLib as any;
  const anyThemes: AnyRec = themesLib as any;

  const fromContent = pickArray(anyContent, ["TEXT_COLORS", "TEXTCOLOR_PRESETS", "COLORS_TEXT"]);
  const fromThemes  = pickArray(anyThemes,  ["TEXT_COLORS", "TEXTCOLOR_PRESETS", "COLORS_TEXT"]);

  let base = fromContent ?? fromThemes ?? [];

  // Fallback: wenn in default ein Objekt mit .textColors liegt
  if (base.length === 0 && anyContent?.default && Array.isArray(anyContent.default.textColors)) {
    base = anyContent.default.textColors;
  }

  const normalized = arr(base).map((c: any, i: number) => ({
    id: String(c.id ?? c.key ?? c.slug ?? c.value ?? c.name ?? i),
    name: String(c.name ?? c.label ?? c.title ?? `Textfarbe ${i}`),
    hex: c.hex ?? c.value ?? c.color ?? c.code ?? null,
  }));

  if (normalized.length === 0) {
    return [
      { id: "color-std",  name: "Standard",  hex: null },
      { id: "color-dark", name: "Dunkel",    hex: "#111111" },
      { id: "color-rose", name: "Rose",      hex: "#cc3366" },
    ];
  }
  return normalized;
}

