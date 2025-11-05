export function score(text, { tone_fit = 0.85, context_fit = 0.8, wording_fit = 0.8, fact_anchor = 0.85 } = {}) {
  const avg = (tone_fit + context_fit + wording_fit + fact_anchor) / 4;
  return { score: avg, criteria: { tone_fit, context_fit, wording_fit, fact_anchor } };
}

