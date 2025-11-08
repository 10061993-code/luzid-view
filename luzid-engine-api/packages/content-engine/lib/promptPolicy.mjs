// packages/content-engine/lib/promptPolicy.mjs
// v3.3 — aggressive inline CTA scrub + single canonical CTA + strict closing

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
 * Wir werten als CTA jeden Imperativ mit typischen Verben – auch inline mitten im Absatz,
 * mit/ohne "heute", mit/ohne Satzende, als Bullet oder als separater Satz.
 */
const CTA_VERBS = "(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)";
const CTA_INLINE = new RegExp(
  // Kante: Satz-/Zeilengrenze oder Anfang → optional Bullet/Whitespace → Imperativverb → bis zum nächsten Satzende oder Zeilenende weg
  String.raw`(^|[\n\.!\?]\s*)(?:-\s*)?${CTA_VERBS}\b[^\.!\?\n]*[\.!\?]?`,
  "gim"
);
const CTA_BULLET_LINE = new RegExp(
  String.raw`(^|\n)\s*-\s*${CTA_VERBS}\b[^\n]*`,
  "gim"
);

/**
 * Entfernt ALLE CTAs (inline + bullets + satzweise) kompromisslos
 * und hängt genau EINE kanonische CTA an.
 */
function dedupeCTA(text, styleCta) {
  const canonical = canonicalCTA(styleCta);

  let body = text;

  // 1) Zuerst Bullet-CTAs hart entfernen (ganze Zeilen)
  body = body.replace(CTA_BULLET_LINE, "$1").replace(/\n{3,}/g, "\n\n");

  // 2) Dann *inline* Imperativ-Sequenzen inklusive folgendem Satzende entfernen
  body = body.replace(CTA_INLINE, "$1").replace(/\n{3,}/g, "\n\n");

  // 3) Rest glätten
  body = body.replace(/\s+$/g, "").replace(/\n{3,}/g, "\n\n").trim();

  // 4) Sicherheitsnetz: falls doch noch Imperativfragmente ohne Punkt stehen
  const CTA_FRAGMENTS = new RegExp(
    String.raw`(^|\n)\s*(?:-\s*)?${CTA_VERBS}\b[^\n]*`,
    "gim"
  );
  body = body.replace(CTA_FRAGMENTS, "$1").replace(/\n{3,}/g, "\n\n").trim();

  // 5) Exakt EINE kanonische CTA anhängen
  body = body.length ? `${body}\n\n${canonical}` : canonical;

  return body.trim();
}

function canonicalCTA() {
  return "Notiere dir heute einen einzigen, leichten Schritt.";
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

