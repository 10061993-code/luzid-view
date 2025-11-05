export function detectPhase({ age }) {
  if (typeof age !== "number") return { kind: "exploration", confidence: 0.5 };
  if (age < 28) return { kind: "exploration", confidence: 0.7 };
  if (age < 40) return { kind: "consolidation", confidence: 0.7 };
  return { kind: "consolidation", confidence: 0.8 };
}

