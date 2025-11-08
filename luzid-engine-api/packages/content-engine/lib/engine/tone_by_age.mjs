export function toneBandsByAge(age) {
  const base = { valence: "realistic+", openness: "mid+", complexity: "mid" };
  if (typeof age !== "number") return base;
  if (age >= 16 && age <= 25)  return { valence: "positive", openness: "high", complexity: "short" };
  if (age <= 35)               return { valence: "realistic+", openness: "mid+", complexity: "mid" };
  if (age <= 45)               return { valence: "balanced", openness: "mid", complexity: "mid+" };
  return { valence: "grounded", openness: "mid-", complexity: "mid+" };
}

