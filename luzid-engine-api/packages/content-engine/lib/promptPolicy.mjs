k// packages/content-engine/lib/promptPolicy.mjs
// v3.6 — kill ALL imperative fragments (any position), append single canonical CTA, strict closing

export function applyPolicy(text, { creatorHandle, style }) {
  let t = (text || "").trim();
  t = normalizeWhitespace(t);
  t = stripHallucinatedHeaders(t);
  t = limitEmojis(t, style?.emoji ?? "none");
  t = dedupeCTA(t);                 // exakt 1 CTA, immer kanonisch
  t = enforceClosing(t, creatorHandle, style); // striktes Closing je Creator
  return t;
}

/* ---------------------- Normalisierung ---------------------- */

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

/* ---------------------- CTA-Entfernung ---------------------- */
/**
 * Strategie v3.6 (brute force, aber sicher):
 *  1) Paragraphweise prüfen: enthält der Absatz ein Imperativ-Verb? → kompletten Absatz löschen.
 *  2) Danach global ALLE Imperativ-Fragmente (Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache ...)
 *     samt folgendem Text bis zum Satzende ODER Zeilenende entfernen – egal wo sie stehen.
 *  3) Reste ohne Punkt/Endzeichen ebenfalls entfernen.
 *  4) Kanonische CTA anhängen. Vorher alle evtl. vorhandenen Varianten dieser Zeile entfernen.
 */

const VERBS = "(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)";

// 1) Absatz mit Imperativ komplett verwerfen
function purgeImperativeParagraphs(raw) {
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((p) => !new RegExp(VERBS, "i").test(p))
    .join("\n\n");
}

// 2) Inline-Imperativ (vom Verb bis Satzende ODER Zeilenende) überall löschen
const RX_INLINE_TO_SENT_END = new RegExp(
  String.raw`${VERBS}\b[^\.!\?\n]*[\.!\?]?`, // bis zum nächsten Satzzeichen, optional
  "gim"
);

// 3) Restfragmente ohne Endzeichen löschen (bis zum Zeilenende)
const RX_INLINE_TO_EOL = new RegExp(
  String.raw`${VERBS}\b[^\n]*`,
  "gim"
);

// 4) Bullets wie "- Schreibe ..." entfernen
const RX_BULLET = new RegExp(
  String.raw`(^|\n)\s*-\s*${VERBS}\b[^\n]*`,
  "gim"
);

function canonicalCTA() {
  return "Notiere dir heute einen einzigen, leichten Schritt.";
}

function dedupeCTA(text) {
  let body = String(text || "");

  // Absatzweise hart löschen
  body = purgeImperativeParagraphs(body);

  // Bullets raus
  body = body.replace(RX_BULLET, "$1");

  // Inline-Imperativ bis Satzende
  body = body.replace(RX_INLINE_TO_SENT_END, "");

  // Inline-Imperativ bis Zeilenende (Reste ohne Punkt)
  body = body.replace(RX_INLINE_TO_EOL, "");

  // Aufräumen: Mehrfach-Leerzeilen / Spacing
  body = body
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Alle evtl. vorhandenen Varianten der kanonischen CTA vorher entfernen
  const RX_CANON = /Notiere dir heute einen einzigen, leichten Schritt[^.\n!?]*[.!?]?/gi;
  body = body.replace(RX_CANON, "").replace(/\n{3,}/g, "\n\n").trim();

  // Exakt EINE kanonische CTA ans Ende
  body = body.length ? `${body}\n\n${canonicalCTA()}` : canonicalCTA();
  return body.trim();
}

/* ---------------------- Closing-Logik ---------------------- */

function enforceClosing(t, creatorHandle, style = {}) {
  // modellgenerierte Grußformeln am Ende entfernen
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

  body = body.replace(/\s+$/, "");
  return `${body}\n\n${desired}`;
}

function displayNameFromHandle(handle = "") {
  return handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : "Creator";
}

