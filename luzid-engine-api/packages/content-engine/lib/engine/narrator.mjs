// lib/engine/narrator.mjs
import { getCreatorStyleFromDB } from "../../services/creators.mjs";

// Lokale Fallback-Stile pro Creator (minimal)
const FALLBACKS = {
  lena: {
    greeting_style: "casual",          // "none" | "casual" | "formal"
    closing_style: "xx – {creator}",   // {creator} wird ersetzt
    register: "soft-relatable",
    tone: "warm,direkt",
    cta_style: "crisp",                // "crisp" | "neutral" | "gentle"
    emoji: "none"
  },
};

// Hilfsfunktion: {creator} → "Lena" etc.
function prettyName(handle) {
  if (!handle) return "";
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export async function resolveNarrator(creator) {
  const handle = String(creator || "").toLowerCase();

  // Basisstil aus Fallbacks
  const base = FALLBACKS[handle] || {
    greeting_style: "none",
    closing_style: "",
    register: "neutral",
    tone: "klar",
    cta_style: "neutral",
    emoji: "none",
  };

  // Remote-Stil aus Supabase
  const remote = await getCreatorStyleFromDB(handle).catch(() => null);

  // Mergen (remote überschreibt base)
  const styleRaw = { ...base, ...(remote || {}) };

  // Greeting ableiten
  const greeting =
    styleRaw.greeting_style === "casual"
      ? "hey du,"
      : styleRaw.greeting_style === "formal"
      ? "Hallo,"
      : "";

  // Closing-Template ersetzen
  const closing = String(styleRaw.closing_style || "").replace(
    /\{creator\}/g,
    prettyName(handle)
  );

  const style = {
    ...styleRaw,
    greeting,
    closing_style: closing,
  };

  return { style, hasRemote: !!remote };
}

