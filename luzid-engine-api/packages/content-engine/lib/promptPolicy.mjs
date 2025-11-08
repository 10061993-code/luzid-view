// packages/content-engine/lib/promptPolicy.mjs
// v3.4 — global inline imperative purge (any position) + single canonical CTA + strict closing

export function applyPolicy(text, { creatorHandle, style }) {
  let t = (text || "").trim();
  t = normalizeWhitespace(t);
  t = stripHallucinatedHeaders(t);
  t = limitEmojis(t, style?.emoji ?? "none");
  t = dedupeCTA(t, style?.cta_style ?? "crisp");   // exakt 1 CTA, immer kanonisch
  t = enforceClosing(t, creatorHandle, style);     // striktes Closing je Creator
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
 * Wir entfernen jede Imperativ-Sequenz mit typischen Verben (Schreibe/Notiere/Setze/…)
 * — unabhängig von Position (Satzanfang, Mitte, Bullet, ohne Punkt, etc.).
 * Strategie:
 *  1) Bullet-Zeilen mit Imperativ komplett weg
 *  2) Inline-Imperativ von Verb bis Satzende (bis ., !, ?, Zeilenende) global entfernen
 *  3) Restfragmente (ohne Endzeichen) global entfernen
 *  4) Am Ende genau EINE kanonische CTA anhängen
 */

const CTA_VERBS_GROUP = "(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)";

// Bullet-Zeilen mit Imperativ (ganze Zeile)
const RX_BULLET = new RegExp(String.raw`(^|\n)\s*-\s*${CTA_VERBS_GROUP}\b[^\n]*`, "gim");

// Inline-Imperativ: Verb irgendwo im Satz → bis zum nächsten Satzende/Zeilenende
const RX_INLINE_TO_END = new RegExp(
  String.raw`${CTA_VERBS_GROUP}\b[^\.!\?\n]*[\.!\?]?`,
  "gim"
);

// Restfragmente ohne Punkt/Zeichen (zur Sicherheit)
const RX_FRAGMENT = new RegExp(
  String.raw`(^|\n)\s*(?:-\s*)?${CTA_VERBS_GROUP}\b[^\n]*`,
  "gim"
);

function canonicalCTA() {
  return "Notiere dir heute einen einzigen, leichten Schritt.";
}

function dedupeCTA(text, styleCta) {
  let body = text;

  // 1) Bullets hart entfernen
  body = body.replace(RX_BULLET, "$1").replace(/\n{3,}/g, "\n\n");

  // 2) Inline-Imperative überall entfernen (auch mitten im Satz)
  body = body.replace(RX_INLINE_TO_END, "").replace(/\n{3,}/g, "\n\n");

  // 3) Restfragmente ohne Endzeichen weg
  body = body.replace(RX_FRAGMENT, "$1").replace(/\n{3,}/g, "\n\n");

  // Aufräumen: doppelte Leerzeichen + Lücken vor Satzzeichen säubern
  body = body
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 4) Exakt EINE kanonische CTA anhängen
  body = body.length ? `${body}\n\n${canonicalCTA(styleCta)}` : canonicalCTA(styleCta);
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

