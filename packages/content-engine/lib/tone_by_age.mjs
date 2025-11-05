export function toneForPhase(phase) {
  return phase?.kind === "exploration"
    ? { valence: 0.1, openness: 0.8, complexity: 0.45, sentenceLength: "short" }
    : { valence: 0.3, openness: 0.5, complexity: 0.6, sentenceLength: "medium" };
}

export function toneForAge(age) {
  if (typeof age !== "number") return {};
  if (age < 23) return { sentenceLength: "short" };
  if (age > 40) return { complexity: 0.65 };
  return {};
}

export function mergeTone(base, ...overrides) {
  const def = { valence: 0.2, openness: 0.6, complexity: 0.5, sentenceLength: "medium" };
  return Object.assign({}, def, base || {}, ...overrides);
}

