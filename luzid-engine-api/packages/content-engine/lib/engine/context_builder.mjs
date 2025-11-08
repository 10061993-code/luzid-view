// lib/engine/context_builder.mjs — v2 (no closing / single CTA)

export function buildSystem({ phase, tone, style, experiment }) {
  return [
    `Du schreibst einen kurzen, klaren, aktivierenden Astro-Text im Stil des jeweiligen Creators.`,
    `Halte dich an die inhaltlichen Leitplanken und vermeide Floskeln.`,
    `Bevorzuge konkrete, kleine Schritte, die die Leserin sofort umsetzen kann.`,
    `WICHTIG: Füge KEIN Gruß oder Closing am Ende hinzu – das Closing wird systemseitig automatisch angehängt.`,
    `WICHTIG: Verwende nur EINE Call-to-Action (CTA) im Text.`,
    `Der Text soll inspirierend, aber nicht belehrend wirken.`,
  ].join(" ");
}

export function buildUser({ event, phase, tone, style }) {
  const toneDesc = tone?.description || tone || "";
  const phaseDesc = phase?.description || "";
  const creatorTone =
    style?.tone || "warm, empathisch, klar in der Sprache, ohne Klischees";

  return [
    `Kontext: ${phaseDesc}`,
    `Tonfall: ${creatorTone} (${toneDesc})`,
    `Ereignis: ${event}`,
    `Ziel: einen emotional stimmigen, motivierenden Text mit maximal einer CTA erzeugen.`,
  ].join("\n");
}

