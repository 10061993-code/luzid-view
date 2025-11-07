const CREATOR_PROFILES = {
  lena: { tone: "warm, konkret, ermutigend",
    dos:["klare Struktur: Hook → Kern → 1–2 Impulse","freundlich, alltagsnah, kein Jargon","Transite nur wenn sinnvoll"],
    donts:["kein Determinismus","kein moralischer Druck","keine Wiederholung ohne neuen Blick"], maxWordsByLength:{short:120,medium:220,long:380}},
  paul: { tone: "direkt, prägnant, sachlich",
    dos:["präzise Bullets","1 klares Takeaway","kein Metaphern-Overload"],
    donts:["keine langen Einleitungen","keine Phrasen","nicht oberlehrerhaft"], maxWordsByLength:{short:100,medium:180,long:320}}
};
const DEFAULTS={ tone:"freundlich, klar", maxWordsByLength:{short:110,medium:200,long:350}};
const clamp=(l="short")=>["short","medium","long"].includes(l)?l:"short";
export function applyPolicy(input={}){
  const creatorKey=(input.creator||"").trim().toLowerCase();
  const creator=CREATOR_PROFILES[creatorKey]||null;
  const length=clamp(input.length);
  const tone=input.tone?.trim()||creator?.tone||DEFAULTS.tone;
  const maxWords=creator?.maxWordsByLength?.[length]??DEFAULTS.maxWordsByLength[length];
  const system=[
    "Du schreibst kurze, umsetzbare Astro-Impulse.",
    "Formuliere als Möglichkeiten, nicht als Gewissheiten.",
    "Kein Gesundheits-, Rechts- oder Finanzrat.",
    "Respektvoll, inklusiv, ermächtigend.",
    `Ziel-Tonalität: ${tone}.`
  ].join(" ");
  const dos=creator?.dos?.length?`Do:\n- ${creator.dos.join("\n- ")}`:"";
  const donts=creator?.donts?.length?`Don't:\n- ${creator.donts.join("\n- ")}`:"";
  const instructions=[
    input.event?`Kontext-Event: ${input.event}`:null,
    `Schreibe maximal ca. ${maxWords} Wörter.`,
    "Struktur: Hook (1 Satz) → Kern (2–4 Sätze) → 1 Mini-Impuls (Imperativ).",
    "Konkret & alltagsnah; kein Wiederholungs-Content ohne neuen Blick.",
    dos||null, donts||null
  ].filter(Boolean).join("\n\n");
  return { system, instructions, maxWords, meta:{ creator: creatorKey||"default", length } };
}
