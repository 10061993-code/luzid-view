// lib/registry.ts
// Registry für Events, Themes, Fonts, Textfarben – strikt typisiert & ESM-Proxy-sicher.

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

/** Nur sichere Keys lesen: erst exportierte Keys listen, dann zugreifen. */
function getIfExported(mod: unknown, key: string): unknown | undefined {
  if (!isRecord(mod)) return undefined;
  const keys = Object.keys(mod as object);
  if (!keys.includes(key)) return undefined;
  // jetzt ist der Key tatsächlich exportiert → Zugriff ist safe
  return (mod as Record<string, unknown>)[key];
}

/** Erst alle exportierten Keys listen, dann den ersten passenden Array-Wert holen. */
function pickExportedArray(mod: unknown, preferredKeys: string[]): unknown[] | null {
  if (!isRecord(mod)) return null;
  const exported = new Set(Object.keys(mod as object));
  for (const k of preferredKeys) {
    if (exported.has(k)) {
      const v = (mod as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
      if (isRecord(v) && Array.isArray(v["items"])) return v["items"] as unknown[];
    }
  }
  return null;
}

/** Objekt-Werte (nur objektartige) der tatsächlich exportierten Keys. */
function exportedObjectValues(mod: unknown): unknown[] {
  if (!isRecord(mod)) return [];
  const vals: unknown[] = [];
  for (const k of Object.keys(mod as object)) {
    const v = (mod as Record<string, unknown>)[k];
    if (isRecord(v)) vals.push(v);
  }
  return vals;
}

/* ======================= EVENTS ======================= */

export function getEventsNext14Days(from: Date = new Date()): RegistryEvent[] {
  // 1) Bevorzugt: Helper-Funktion, aber nur wenn tatsächlich exportiert
  const maybeFn = getIfExported(eventsLib, "eventsInNextDays");
  if (typeof maybeFn === "function") {
    const maybeList = (maybeFn as (d: number, f?: Date) => unknown)(14, from) as unknown;
    const list = asArray(maybeList).map((e, i): RegistryEvent | null => {
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
      const tags = isStringArray(rec["tags"]) ? (rec["tags"] as string[]) : null;

      if (!isISODate(start)) return null;
      return { id, title, startUTC: start, zodiac, description, type, tags };
    });
    return list.filter((x): x is RegistryEvent => x !== null).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
  }

  // 2) Fallback: Arrays aus bekannten Keys, aber nur wenn wirklich exportiert
  const base =
    pickExportedArray(eventsLib, ["ASTRO_EVENTS_NEXT_2W", "EVENTS", "events"]) ?? [];

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
    const tags = isStringArray(rec["tags"]) ? (rec["tags"] as string[]) : null;

    if (!isISODate(start)) return null;
    return { id, title, startUTC: start, zodiac, description, type, tags };
  });

  return list.filter((x): x is RegistryEvent => x !== null).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
}

/* ======================= THEMES / STILE ======================= */

export function getThemes(): RegistryTheme[] {
  // 1) Exportierte Kandidaten-Keys (keine .default-Probes)
  const base =
    pickExportedArray(themesLib, ["THEMES", "THEME_PRESETS", "PRESETS", "items"]) ??
    (() => {
      // 2) Fallback: alle exportierten Werte einsammeln
      const vals = exportedObjectValues(themesLib);
      return vals.length ? vals : [];
    })();

  if ((base as unknown[]).length === 0) {
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
  const base =
    pickExportedArray(contentLib, ["FONTS", "FONT_PRESETS", "TYPOGRAPHY", "TYPO_PRESETS"]) ??
    pickExportedArray(themesLib, ["FONTS", "FONT_PRESETS", "TYPOGRAPHY", "TYPO_PRESETS"]) ??
    (() => {
      const vals = exportedObjectValues(contentLib);
      const hit = vals.find((v) => isRecord(v) && Array.isArray(v["fonts"]));
      return hit && isRecord(hit) ? ((hit["fonts"] as unknown[]) ?? []) : [];
    })();

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
  const base =
    pickExportedArray(contentLib, ["TEXT_COLORS", "TEXTCOLOR_PRESETS", "COLORS_TEXT"]) ??
    pickExportedArray(themesLib, ["TEXT_COLORS", "TEXTCOLOR_PRESETS", "COLORS_TEXT"]) ??
    (() => {
      const vals = exportedObjectValues(contentLib);
      const hit = vals.find((v) => isRecord(v) && Array.isArray(v["textColors"]));
      return hit && isRecord(hit) ? ((hit["textColors"] as unknown[]) ?? []) : [];
    })();

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

