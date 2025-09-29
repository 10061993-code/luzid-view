// lib/contentPresets.ts
import type { Tone, Length, Focus } from "./types";

/**
 * Text-Ton (wirkt auf GPT)
 * - Array für UI-Auswahl (Chips)
 * - Meta: Label + Prompt-Hinweise für konsistente Struktur
 */
export const TONES: Tone[] = ["warm", "direkt", "poetisch", "coachy"];

export const TONE_LABEL: Record<Tone, string> = {
  warm: "warm",
  direkt: "direkt",
  poetisch: "poetisch",
  coachy: "coachy",
};

export const TONE_HINTS: Record<Tone, string> = {
  warm: "Empathisch, nahbar, leichte Metaphern; klare, sanfte Handlungsimpulse.",
  direkt: "Klar, präzise, ohne Floskeln; 1–2 konkrete To-dos.",
  poetisch: "Bildhaft, rhythmisch, aber verständlich; kurze Sätze, keine Kitschflut.",
  coachy: "Lösungsorientiert, Fragen + Mini-Übungen; motivierender Abschluss-CTA.",
};

/**
 * Länge (wirkt auf GPT)
 * - Wort-Zielbereich für Qualität
 * - maxTokens als Kosten-/Latenz-Grenze fürs Backend
 */
export const LENGTH_PRESETS: Record<
  Length,
  { words: [number, number]; maxTokens: number; label: string }
> = {
  short: { words: [90, 120], maxTokens: 380, label: "Kurz (~110 W)" },
  medium: { words: [140, 180], maxTokens: 520, label: "Mittel (~160 W)" },
  long: { words: [220, 260], maxTokens: 700, label: "Lang (~240 W)" },
};

export function getLengthBudget(length: Length) {
  return LENGTH_PRESETS[length];
}

/**
 * Focus (optional; wirkt auf GPT)
 * - Klein gehalten; kann später zu „Libraries“ wachsen
 */
export const FOCUSES: Focus[] = ["career", "love", "self-care"];

export const FOCUS_LABEL: Record<Focus, string> = {
  career: "Career",
  love: "Love",
  "self-care": "Self-Care",
};

