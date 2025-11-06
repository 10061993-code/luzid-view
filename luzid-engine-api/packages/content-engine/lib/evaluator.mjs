// lib/evaluator.mjs
const CREATOR_TONES = { lena: { warm: 1.0, direct: 0.6 }, paul: { warm: 0.6, direct: 1.0 } };

export function evaluateOutput({ text, creator, baseScore = 0.8 }) {
  const tones = CREATOR_TONES[creator?.toLowerCase?.()] ?? { warm: 0.8, direct: 0.8 };
  const warmSignals   = /(?:behutsam|sanft|beruhigend|sanfte|ermutigend|zugewandt)/i.test(text) ? 1 : 0;
  const directSignals = /(?:klar|präzise|direkt|knapp|konkret)/i.test(text) ? 1 : 0;

  const toneFit = Math.min(1, 0.5 * (tones.warm * warmSignals + tones.direct * directSignals));
  const lengthOk = text.split(/(?<=[.!?])\s+/).length <= 3 ? 1 : 0.7;

  const score = Math.max(0, Math.min(1, 0.5 * baseScore + 0.3 * toneFit + 0.2 * lengthOk));
  return { score, criteria: { tone_fit: toneFit, length_ok: lengthOk } };
}

// Kompatibilität für alte Importe:
export { evaluateOutput as evaluate };
export default evaluateOutput;

