// packages/content-engine/lib/promptPolicy.mjs
// v2.1 — robust CTA-Dedupe + striktes Closing

export function applyPolicy(text, { creatorHandle, style }) {
  let t = (text || "").trim();
  t = normalizeWhitespace(t);
  t = stripHallucinatedHeaders(t);
  t = limitEmojis(t, style?.emoji ?? "none");
  t = dedupeCTA(t, style?.cta_style ?? "crisp");
  t = enforceClosing(t, creatorHandle, style);
  return t;
}

function normalizeWhitespace(t) {
  return t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function stripHallucinatedHeaders(t) {
  return t.replace(/^(?:#+\s.*\n+)+/g, "");
}

function limitEmojis(t, mode) {
  if (mode === "none") return t.replace(/\p{Extended_Pictographic}/gu, "");
  return t;
}

// --- CTA-Handling ---
const CTA_KNOWN = [
  /Notiere dir heute einen einzigen, leichten Schritt\.?/i,
  /Setze heute einen kleinen, konkreten Schritt\.?/i,
  /Schreibe.*(dein|ein)e?\s+konkrete\s+Ziel(e)?\b.*?/i,
  /Schreibe heute .*?\./i,
  /Setze dir heute .*?\./i,
  /Formuliere heute .*?\./i,
  /Definiere heute .*?\./i,
  /Wähle heute .*?\./i,
  /Plane heute .*?\./i,
  /Mache heute .*?\./i,
];
const CTA_IMPERATIVE = /^(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*\bheute\b.*\./i;

function isCTA(line) {
  if (!line) return false;
  const l = line.trim();
  return CTA_KNOWN.some((rx) => rx.test(l)) || CTA_IMPERATIVE.test(l);
}

function canonicalCTA() {
  return "Notiere dir heute einen einzigen, leichten Schritt.";
}

function dedupeCTA(text) {
  const lines = text.split("\n").filter((x) => x.trim().length > 0);
  let kept = [];
  let firstKept = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (isCTA(line)) {
      if (!firstKept) {
        kept.push(line);
        firstKept = true;
      }
    } else {
      kept.push(line);
    }
  }
  if (!firstKept) kept.push(canonicalCTA());

  // Falls mehrere CTA-Sätze in einem Absatz sind → harte Satztrennung und nochmal dedupe
  let joined = kept.join("\n").trim();
  joined = joined
    .replace(/([.!?])\s+(?=[A-ZÄÖÜ])/g, "$1\n")
    .split("\n")
    .reduce(
      (acc, line) => {
        if (isCTA(line)) {
          if (acc._cta) return acc;
          acc.push(line.trim());
          acc._cta = true;
        } else {
          acc.push(line);
        }
        return acc;
      },
      { _cta: false, push(...xs) { Array.prototype.push.apply(this, xs); }, toString(){ return Object.values(this).filter(v=>typeof v==='string').join("\n"); } }
    )
    .toString();

  return joined.replace(/\n{3,}/g, "\n\n").trim();
}

// --- Closing erzwingen ---
function enforceClosing(t, creatorHandle, style = {}) {
  const signoffRx =
    /(\n\s*(Alles Liebe|Liebe Grüße|Herzlichst|Herzlich|LG|xx|–)\s*[—–-]?\s*[A-Za-zÄÖÜäöüß✨ ]{0,40},?\s*)$/i;
  let body = t.replace(signoffRx, "").trim();

  const strictByHandle = {
    lena: "xx – Lena",
    paul: "– Paul",
    yasmin: "✨ Yasmin",
  };
  const creatorName = displayNameFromHandle(creatorHandle);
  const desired =
    style?.closing_style && /{creator}/.test(style.closing_style)
      ? style.closing_style.replace("{creator}", creatorName)
      : strictByHandle[creatorHandle] ?? `– ${creatorName}`;

  return `${body}\n\n${desired}`.replace(/\s+$/, "");
}

function displayNameFromHandle(handle = "") {
  return handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : "Creator";
}

