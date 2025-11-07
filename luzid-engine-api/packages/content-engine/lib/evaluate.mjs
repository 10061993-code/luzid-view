export function evaluateOutput(text = "", { maxWords = 200 } = {}) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  const wc = words.length;

  const lenOK = wc <= (maxWords + Math.ceil(maxWords * 0.15));
  const length_ok = lenOK ? 1 : Math.max(0.2, maxWords / Math.max(1, wc));

  const hasCTA = /(probier|versuche|schreibe|atme|nimm dir|reflektier|achte|notiere|setze|wähle)/i.test(text);
  const ctaScore = hasCTA ? 0.1 : 0;

  const jargon = /(manifestier|schwingung|kosmische kräfte)/i.test(text);
  const jargonPenalty = jargon ? 0.1 : 0;

  let score = 0.55 * length_ok + ctaScore;
  score = Math.min(1, Math.max(0.3, score - jargonPenalty));

  return { score, criteria: { length_ok, cta: hasCTA ? 1 : 0, jargon: jargon ? 1 : 0 } };
}
