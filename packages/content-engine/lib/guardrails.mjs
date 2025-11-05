export function lint(text) {
  return (text || "").toString().trim().replace(/\s+\n/g, "\n");
}

