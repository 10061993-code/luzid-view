// lib/registry.ts
// Zentrale, fehlertolerante Registry für Events, Stile (Themes), Fonts, Textfarben – ohne `any` und ohne `.default`-Zugriffe.

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

/* ======================= Guards & Utils ======================= */

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
function asArray<T = unknown>(u: unknown): T[] {
  return Array.isArray(u) ? (u as T[]) : [];
}

/** Liefert das erste Array, das unter den Keys gefunden wird (keine `.default`-Prüfung). */
function pickArray(u: unknown, keys: string[]): unknown[] | null {
  if (!isRecord(u)) return null;
  for (const k of keys) {
    const v = u[k];
    if (Array.isArray(v)) return v;
  }
  return null;
}

/** Objekt-Werte (nur objektartige) als Array. */
function objectValuesArray(u: unknown): unknown[] {
  if (!isRecord(u)) return [];
  return Object.values(u).filter((v) => typeof v === "object" && v !== null);
}

/** Prüft, ob Objekt eine Function unter dem Namen besitzt. */
function hasFunction<T extends string>(
  u: unknown,
  name: T
): u is Record<T, (...args: unknown[]) => unknown> {
  return isRecord(u) && typeof u[name] === "function";
}

/* ======================= EVENTS ======================= */

export function getEventsNext14Days(from: Date = new Date()): RegistryEvent[] {
  if (hasFunction(eventsLib, "eventsInNextDays")) {
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

      const title = toStringOr(rec["title"], "") || "Event";
      const zodiac = toNullableString(rec["zodiac"]);
      const description = toNullableString(rec["description"]);
      const type = toNullableString(rec["type"]);
      const tagsRaw = rec["tags"];
      const tags = isStringArray(tagsRaw) ? tagsRaw : null;

      if (!isISODate(start)) return null;

      return { id, title, startUTC: start, zodiac, description, type, tags };
    });

    return list.filter((x): x is RegistryEvent => x !== null).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
  }

  // Fallback: bekannte Array-Keys prüfen
  const base = pickArray(eventsLib, ["ASTRO_EVENTS_NEXT_2W", "EVENTS", "events"]) ?? [];
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

    const title = toStringOr(rec["title"], "") || "Event";
    const zodiac = toNullableString(rec["zodiac"]);
    const description = toNullableString(rec["description"]);
    const type = toNullableString(rec["type"]);
    const tagsRaw = rec["tags"];
    const tags = isStringArray(tagsRaw) ? tagsRaw : null;

    if (!isISODate(start)) return null;

    return { id, title, startUTC: start, zodiac, description, type, tags };
  });

  return list.filter((x): x is RegistryEvent => x !== null).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
}

/* ======================= THEMES / STILE ======================= */

export function getThemes(): RegistryTheme[] {
  // 1) Kandidaten-Keys (ohne `.default`)
  const candidates: unknown[] = [
    (themesLib as Record<string, unknown>)["THEMES"],
    (themesLib as Record<string, unknown>)["THEME_PRESETS"],
    (themesLib as Record<string, unknown>)["PRESETS"],
    (themesLib as Record<string, unknown>)["items"],
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

  // 2) Fallback: Werte aus dem Modul (ohne .default)
  if (base.length === 0) {
    const vals = objectValuesArray(themesLib);
    if (vals.length) base = vals;
  }

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

  // Fallback: Werte aus contentLib (ohne `.default`)
  if (base.length === 0) {
    const vals = objectValuesArray(contentLib);
    // falls ein Objekt mit `fonts` drinsteckt
    const maybeFonts = vals.find((v) => isRecord(v) && Array.isArray(v["fonts"]));
    if (maybeFonts && isRecord(maybeFonts)) {
      base = (maybeFonts["fonts"] as unknown[]) ?? [];
    }
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

  // Fallback: Werte aus contentLib (ohne `.default`)
  if (base.length === 0) {
    const vals = objectValuesArray(contentLib);
    const maybe = vals.find((v) => isRecord(v) && Array.isArray(v["textColors"]));
    if (maybe && isRecord(maybe)) {
      base = (maybe["textColors"] as unknown[]) ?? [];
    }
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

