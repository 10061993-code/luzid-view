export function inferPhase({ age } = {}) {
  if (typeof age !== "number") return { phase: "unknown", confidence: 0.4 };
  if (age <= 25) return { phase: "exploration", confidence: 0.7 };
  if (age <= 35) return { phase: "formation", confidence: 0.65 };
  if (age <= 45) return { phase: "consolidation", confidence: 0.65 };
  return { phase: "reorientation", confidence: 0.6 };
}

