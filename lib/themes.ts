// lib/themes.ts
import type { ThemeConfig } from "./types";

/**
 * Fonts (visuell – wirkt auf CSS)
 * - Kuratiertes Set, damit Creator nicht „Lost in Options“ sind.
 * - Separate Map mit robusten Fallback-Stacks.
 */
export const FONTS: ThemeConfig["font_family"][] = ["Inter", "Playfair", "FuturaLike"];

export const FONT_STACKS: Record<ThemeConfig["font_family"], string> = {
  Inter:
    'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
  Playfair: '"Playfair Display", Georgia, "Times New Roman", serif',
  FuturaLike: 'Futura, "Futura PT", "Avenir Next", system-ui, Helvetica, Arial, sans-serif',
};

/**
 * Farb-Tokens (visuell – wirkt auf CSS)
 * - Zwei Paletten: dunkel (Text auf hellem BG), hell (Text auf dunklem BG)
 * - AA-konform kuratiert; du kannst später Creator-spezifische Token-Sets laden.
 */
export const COLOR_TOKENS_DARK: string[] = [
  "#111111",
  "#1F2937",
  "#2B2B2B",
  "#374151",
  "#0F172A",
  "#3A3A3A",
];

export const COLOR_TOKENS_LIGHT: string[] = [
  "#FFFFFF",
  "#F8FAFC",
  "#F1F5F9",
  "#E5E7EB",
];

/**
 * Default-Theme – sicher & neutral
 */
export const DEFAULT_THEME: ThemeConfig = {
  font_family: "Inter",
  font_weight_scale: "normal",
  font_color: "#111111",
  bg_color: undefined,
  accent_color: undefined,
  logo_url: undefined,
};

/**
 * Kleiner Helper, um aus ThemeConfig ein inline-Style-Objekt zu machen.
 * (Kein React-Import hier – einfach plain JS Objekt)
 */
export function themeToStyle(theme: ThemeConfig): Record<string, string | number> {
  const stack = FONT_STACKS[theme.font_family] || FONT_STACKS.Inter;
  return {
    color: theme.font_color,
    background: theme.bg_color || "white",
    fontFamily: stack,
    fontWeight: theme.font_weight_scale === "strong" ? 600 : 400,
  };
}

/**
 * Simple Validator – hält ThemeConfig innerhalb deiner erlaubten Token
 * (kannst du bei Bedarf strenger machen oder erweitern)
 */
export function validateTheme(input: ThemeConfig): ThemeConfig {
  const font_family = FONTS.includes(input.font_family) ? input.font_family : DEFAULT_THEME.font_family;
  const font_weight_scale = input.font_weight_scale === "strong" ? "strong" : "normal";
  const font_color = (COLOR_TOKENS_DARK.includes(input.font_color) || COLOR_TOKENS_LIGHT.includes(input.font_color))
    ? input.font_color
    : DEFAULT_THEME.font_color;

  return {
    font_family,
    font_weight_scale,
    font_color,
    bg_color: input.bg_color,
    accent_color: input.accent_color,
    logo_url: input.logo_url,
  };
}

