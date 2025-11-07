export function buildSystem({ tone="freundlich, klar", register="soft-relatable" }={}) {
  return [
    "Schreibe einen kurzen, umsetzbaren Astro-Impuls.",
    "Kein Determinismus; formuliere als Möglichkeiten.",
    "Sprache konkret, alltagsnah; 12–18 Wörter pro Satz.",
    `Tonalität: ${tone}; Register: ${register}.`
  ].join(" ");
}

export function buildUser({ greeting="", phase="exploration", context={}, transits=[], cta="", closing="", instructions="" }) {
  const blocks = [];
  if (greeting) blocks.push("[GREETING]\n" + greeting);
  if (phase) blocks.push("[PHASE]\n" + phase);
  if (context && Object.keys(context).length) blocks.push("[CONTEXT]\n" + JSON.stringify(context));
  if (transits?.length) blocks.push("[TRANSITS]\n" + JSON.stringify(transits));
  if (instructions) blocks.push("[GUIDE]\n" + instructions);
  if (cta) blocks.push("[CTA]\n" + cta);
  if (closing) blocks.push("[CLOSING]\n" + closing);
  return blocks.join("\n");
}
