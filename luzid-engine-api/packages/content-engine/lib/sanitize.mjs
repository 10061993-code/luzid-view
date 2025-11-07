export function sanitizeText(text = "", opts = {}) {
  const { maxChars = 1200 } = opts;
  let out = String(text ?? "");

  out = out.replace(/\r/g, "")
           .replace(/[ \t]+\n/g, "\n")
           .replace(/[ \t]{2,}/g, " ");

  out = out.replace(/\s+([.,!?;:])/g, "$1");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/\.{3,}/g, "…").replace(/!{3,}/g, "!!");

  out = out.trim();
  if (out.length > maxChars) out = out.slice(0, maxChars - 1).trimEnd() + "…";
  return out;
}
