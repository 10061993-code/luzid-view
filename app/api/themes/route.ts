// app/api/themes/route.ts
import { NextResponse } from "next/server";
import * as themeLib from "@/lib/themes";

type RawTheme =
  | { id?: string; key?: string; slug?: string; name?: string; label?: string; title?: string; cssUrl?: string; url?: string }
  | Record<string, any>;

function toOption(t: RawTheme, idx: number) {
  const id = t.id ?? t.key ?? t.slug ?? String(idx);
  const name = t.name ?? t.label ?? t.title ?? `Theme ${id}`;
  const preview =
    t.cssUrl ??
    t.url ??
    t.preview ??
    (typeof t.previewCss === "string" ? t.previewCss : undefined);
  return { id: String(id), name: String(name), previewCssUrl: preview ?? null };
}

export async function GET() {
  const anyLib: any = themeLib as any;

  // Versuche typische Export-Namen abzudecken
  const candidates = [
    anyLib.THEMES,
    anyLib.THEME_PRESETS,
    anyLib.PRESETS,
    anyLib.presets,
    anyLib.default,
  ].filter(Boolean);

  let list: any[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) { list = c; break; }
    if (c && typeof c === "object" && Array.isArray(c.items)) { list = c.items; break; }
  }

  if (!Array.isArray(list) || list.length === 0) {
    // Fallback klar kommunizieren
    return NextResponse.json(
      {
        error: "No themes found in lib/themes.ts",
        expectedExports: ["THEMES", "THEME_PRESETS", "PRESETS", "default (array)"],
      },
      { status: 404 },
    );
  }

  const options = list.map(toOption);
  return NextResponse.json({ themes: options });
}

