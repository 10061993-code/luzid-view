// packages/content-engine/lib/promptPolicy.mjs
// v3.1 — Sentence-level CTA purge (imperatives), single canonical CTA, strict closing

export function applyPolicy(text, { creatorHandle, style }) {
  let t = (text || "").trim();
  t = normalizeWhitespace(t);
  t = stripHallucinatedHeaders(t);
  t = limitEmojis(t, style?.emoji ?? "none");
  t = dedupeCTA(t, style?.cta_style ?? "crisp");   // → exakt 1 CTA, immer kanonisch
  t = enforceClosing(t, creatorHandle, style);     // → striktes Closing je Creator
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

/* ---------------------- CTA-Entfernung (Satz-basiert) ---------------------- */
// Imperativ-Verben, die wir als CTA werten:
const CTA_VERBS = /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b/i;

// 1) Entfernt jeden *Satz* (bis . ! ?), der ein Imperativ-Verb enthält
function removeImperativeSentences(raw) {
  const SENTENCE = /[^.!?]*[.!?]/g; // grobe Satzgrenzen
  let out = "";
  let m;
  while ((m = SENTENCE.exec(raw)) !== null) {
    const sentence = m[0].trim();
    if (!sentence) continue;
    if (CTA_VERBS.test(sentence)) continue; // CTA-Satz verwerfen
    out += (out ? "\n" : "") + sentence;
  }
  // Rest ohne abschließendes Satzzeichen (falls vorhanden)
  const tail = raw.slice(SENTENCE.lastIndex).trim();
  if (tail && !CTA_VERBS.test(tail)) out += (out ? "\n" : "") + tail;
  return out;
}

// 2) Entfernt Zeilen mit Bullets + Imperativ
function removeBulletImperatives(raw) {
  const BULLET_IMP = /(^|\n)\s*-\s*(?:Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b[^\n]*/gim;
  return raw.replace(BULLET_IMP, "").replace(/\n{3,}/g, "\n\n");
}

function canonicalCTA() {
  return "Notiere dir heute einen einzigen, leichten Schritt.";
}

/**
 * Endgültige CTA-Strategie:
 *  - zuerst satzbasiert ALLE Imperativ-Sätze löschen
 *  - dann bullet-basierte Imperative löschen
 *  - Body glätten
 *  - am Ende genau EINE kanonische CTA anhängen
 */
function dedupeCTA(text, styleCta) {
  let body = text;

  // global satzweise alle Imperativ-Sätze raus (inkl. Kommas, Nebensätze)
  body = removeImperativeSentences(body);

  // danach Bullet-Imperative restlos entfernen
  body = removeBulletImperatives(body);

  // Absätze glätten
  body = body.replace(/\n{3,}/g, "\n\n").trim();

  // Fallback: falls irgendwo Imperativ-Fragmente ohne Satzende verbleiben, hart weg
  const CTA_GLOBAL = new RegExp(
    [
      // generische Imperativ-Zeile
      /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b[^\n.!?]*$/ .source,
      // bekannte früherer Zeilen
      /Notiere dir heute einen einzigen, leichten Schritt\.?/.source,
      /Setze heute einen kleinen, konkreten Schritt\.?/.source,
    ].join("|"),
    "gim"
  );
  body = body.replace(CTA_GLOBAL, "").replace(/\n{3,}/g, "\n\n").trim();

  // exakt EINE kanonische CTA anhängen
  body = body.length ? body + "\n\n" + canonicalCTA(styleCta) : canonicalCTA(styleCta);
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

