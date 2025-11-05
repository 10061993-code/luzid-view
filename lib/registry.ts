// lib/registry.ts
// Zentrale, fehlertolerante Registry für Events, Stile (Themes), Fonts, Textfarben.
// Ziel: robust gegen unterschiedliche Export-Formen in den Libs – ohne `any`.

import * as eventsLib from "@/lib/events";
import * as themesLib from "@/lib/themes";
import * as contentLib from "@/lib/contentPresets";

/* ======================= Types ======================= */

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

/* ======================= Type Guards & Utils ======================= */

function isRecord(u: unknown): u is Record<string, unknown> {
  return typeof u === "object" && u !== null;
}

function isString(u: unknown): u is string {
  return typeof u === "string";
}

function isStringArray(u: unknown): u is string[] {
  return Array.isArray(u) && u.every((x) => typeof x === "string");
}

function isISODate(s: unknown): s is string {
  return isString(s) && !Number.isNaN(Date.parse(s));
}

function toStringOr(u: unknown, fallback: string): string {
  return isString(u) ? u : fallback;
}

function toNullableString(u: unknown): string | null {
  return isString(u) ? u : null;
}

/** Safe array extractor – liefert immer ein Array (sonst leeres). */
function asArray<T = unknown>(u: unknown): T[] {
  return Array.isArray(u) ? (u as T[]) : [];
}

/** Liefert das erste Array, das unter den Keys (oder in default[keys]) gefunden wird. */
function pickArray(u: unknown, keys: string[]): unknown[] | null {
  if (!isRecord(u)) return null;

  for (const k of keys) {
    const v = u[k];
    if (Array.isArray(v)) return v;
  }

  const d = u["default"];
  if (Array.isArray(d)) return d as unknown[];

  if (isRecord(d)) {
    for (const k of keys) {
      const v = d[k];
      if (Array.isArray(v)) return v;
    }
  }

  return null;
}

/** Prüft, ob Objekt eine Function unter dem gegebenen Namen besitzt. */
function hasFunction<T extends string>(
  u: unknown,
  name: T
): u is Record<T, (...args: unknown[]) => unknown> {
  return isRecord(u) && typeof u[name] === "function";
}

/** Werte eines Objekts (nur objektartige) als Array zurückgeben. */
function objectValuesArray(u: unknown): unknown[] {
  if (!isRecord(u)) return [];
  return Object.values(u).filter((v) => typeof v === "object" && v !== null);
}

/* ======================= EVENTS ======================= */

export function getEventsNext14Days(from: Date = new Date()): RegistryEvent[] {
  // Bevorzugt Helper-Funktion aus eventsLib nutzen, wenn vorhanden
  if (hasFunction(eventsLib, "eventsInNextDays")) {
    // versuchen: eventsInNextDays(days, from?)
    const maybe = eventsLib.eventsInNextDays(14 as unknown as number, from) as unknown;
    const list = asArray(maybe).map((e, i): RegistryEvent | null => {
      const rec = isRecord(e) ? e : {};
      const id =
        toStringOr(rec["id"], "") ||
        toStringOr(rec["key"], "") ||
        toStringOr(rec["slug"], "") ||
        String(i);

      const start =
        toNullableString(rec["startUTC"]) ??
        toNullableString(rec["date"]) ??
        toNullableString(rec["start"]) ??
        "";

      const title =
        toStringOr(rec["title"], "") || "Event";

      const zodiac = toNullableString(rec["zodiac"]);
      const description = toNullableString(rec["description"]);
      const type = toNullableString(rec["type"]);
      const tagsRaw = rec["tags"];
      const tags = isStringArray(tagsRaw) ? tagsRaw : null;

      if (!isISODate(start)) return null;

      return {
        id,
        title,
        startUTC: start,
        zodiac,
        description,
        type,
        tags,
      };
    });

    return list.filter((x): x is RegistryEvent => x !== null).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
  }

  // Fallback: Arrays direkt aus der Lib greifen
  const base =
    pickArray(eventsLib, ["ASTRO_EVENTS_NEXT_2W", "EVENTS", "events"]) ?? [];

  const list = asArray(base).map((e, i): RegistryEvent | null => {
    const rec = isRecord(e) ? e : {};
    const id =
      toStringOr(rec["id"], "") ||
      toStringOr(rec["key"], "") ||
      toStringOr(rec["slug"], "") ||
      String(i);

    const start =
      toNullableString(rec["startUTC"]) ??
      toNullableString(rec["date"]) ??
      toNullableString(rec["start"]) ??
      "";

    const title =
      toStringOr(rec["title"], "") || "Event";

    const zodiac = toNullableString(rec["zodiac"]);
    const description = toNullableString(rec["description"]);
    const type = toNullableString(rec["type"]);
    const tagsRaw = rec["tags"];
    const tags = isStringArray(tagsRaw) ? tagsRaw : null;

    if (!isISODate(start)) return null;

    return {
      id,
      title,
      startUTC: start,
      zodiac,
      description,
      type,
      tags,
    };
  });

  return list.filter((x): x is RegistryEvent => x !== null).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
}

/* ======================= THEMES / STILE ======================= */

export function getThemes(): RegistryTheme[] {
  // 1) typische Export-Varianten
  const candidates: unknown[] = [
    (themesLib as unknown as Record<string, unknown>)["THEMES"],
    (themesLib as unknown as Record<string, unknown>)["THEME_PRESETS"],
    (themesLib as unknown as Record<string, unknown>)["PRESETS"],
    (themesLib as unknown as Record<string, unknown>)["items"],
    (themesLib as unknown as Record<string, unknown>)["default"],
  ].filter(Boolean);

  let base: unknown[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      base = c;
      break;
    }
    if (isRecord(c) && Array.isArray(c["items"])) {
      base = c["items"] as unknown[];
      break;
    }
  }

  // 2) Fallback: Objekt mit Werten (z. B. {lena:{...}, paul:{...}})
  if (base.length === 0 && isRecord(themesLib)) {
    const vals = objectValuesArray(themesLib);
    if (vals.length && !Array.isArray(themesLib)) {
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

  return asArray(base).map((t, i): RegistryTheme => {
    const rec = isRecord(t) ? t : {};
    const id =
      toStringOr(rec["id"], "") ||
      toStringOr(rec["key"], "") ||
      toStringOr(rec["slug"], "") ||
      String(i);

    const name =
      toStringOr(rec["name"], "") ||
      toStringOr(rec["label"], "") ||
      toStringOr(rec["title"], "") ||
      `Stil ${i}`;

    const previewCssUrl =
      toNullableString(rec["cssUrl"]) ??
      toNullableString(rec["url"]) ??
      toNullableString(rec["preview"]) ??
      (isString(rec["previewCss"]) ? (rec["previewCss"] as string) : null);

    return { id, name, previewCssUrl };
  });
}

/* ======================= FONTS ======================= */

export function getFonts(): RegistryFont[] {
  const fromContent = pickArray(contentLib, ["FONTS", "FONT_PRESETS", "TYPOGRAPHY", "TYPO_PRESETS"]);
  const fromThemes = pickArray(themesLib, ["FONTS", "FONT_PRESETS", "TYPOGRAPHY", "TYPO_PRESETS"]);

  let base: unknown[] = fromContent ?? fromThemes ?? [];

  // Fallback: wenn in default ein Objekt mit .fonts liegt
  const defaultObj = (contentLib as unknown as Record<string, unknown>)["default"];
  if (base.length === 0 && isRecord(defaultObj) && Array.isArray(defaultObj["fonts"])) {
    base = defaultObj["fonts"] as unknown[];
  }

  const normalized = asArray(base).map((f, i): RegistryFont => {
    const rec = isRecord(f) ? f : {};
    const id =
      toStringOr(rec["id"], "") ||
      toStringOr(rec["key"], "") ||
      toStringOr(rec["slug"], "") ||
      toStringOr(rec["value"], "") ||
      toStringOr(rec["name"], "") ||
      String(i);

    const name =
      toStringOr(rec["name"], "") ||
      toStringOr(rec["label"], "") ||
      toStringOr(rec["title"], "") ||
      `Font ${i}`;

    const css =
      toNullableString(rec["css"]) ??
      toNullableString(rec["cssUrl"]) ??
      toNullableString(rec["fontFamily"]) ??
      null;

    return { id, name, css };
  });

  if (normalized.length === 0) {
    return [
      { id: "font-1", name: "Font 1", css: null },
      { id: "font-2", name: "Font 2", css: null },
      { id: "font-3", name: "Font 3", css: null },
    ];
  }
  return normalized;
}

/* ======================= TEXT COLORS ======================= */

export function getTextColors(): RegistryColor[] {
  const fromContent = pickArray(contentLib, ["TEXT_COLORS", "TEXTCOLOR_PRESETS", "COLORS_TEXT"]);
  const fromThemes = pickArray(themesLib, ["TEXT_COLORS", "TEXTCOLOR_PRESETS", "COLORS_TEXT"]);

  let base: unknown[] = fromContent ?? fromThemes ?? [];

  // Fallback: wenn in default ein Objekt mit .textColors liegt
  const defaultObj = (contentLib as unknown as Record<string, unknown>)["default"];
  if (base.length === 0 && isRecord(defaultObj) && Array.isArray(defaultObj["textColors"])) {
    base = defaultObj["textColors"] as unknown[];
  }

  const normalized = asArray(base).map((c, i): RegistryColor => {
    const rec = isRecord(c) ? c : {};
    const id =
      toStringOr(rec["id"], "") ||
      toStringOr(rec["key"], "") ||
      toStringOr(rec["slug"], "") ||
      toStringOr(rec["value"], "") ||
      toStringOr(rec["name"], "") ||
      String(i);

    const name =
      toStringOr(rec["name"], "") ||
      toStringOr(rec["label"], "") ||
      toStringOr(rec["title"], "") ||
      `Textfarbe ${i}`;

    const hex =
      toNullableString(rec["hex"]) ??
      toNullableString(rec["value"]) ??
      toNullableString(rec["color"]) ??
      toNullableString(rec["code"]) ??
      null;

    return { id, name, hex };
  });

  if (normalized.length === 0) {
    return [
      { id: "color-std", name: "Standard", hex: null },
      { id: "color-dark", name: "Dunkel", hex: "#111111" },
      { id: "color-rose", name: "Rose", hex: "#cc3366" },
    ];
  }
  return normalized;
}

