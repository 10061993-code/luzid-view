// packages/content-engine/lib/promptPolicy.mjs
// v3.2 — line-first + sentence-level CTA purge (imperatives), single canonical CTA, strict closing

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

const CTA_VERBS = /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b/i;

/** 1) Entferne jede *Zeile*, die Imperativ enthält (auch Bullets) */
function removeImperativeLines(raw) {
  const lines = raw.split("\n");
  const kept = [];
  for (let line of lines) {
    const l = (line || "").trim();
    if (!l) { kept.push(line); continue; }
    // Bullet mit Imperativ oder Zeile mit Imperativ → verwerfen
    if (/^\s*-\s*/.test(l) && CTA_VERBS.test(l)) continue;
    if (CTA_VERBS.test(l)) continue;
    kept.push(line);
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** 2) Entferne jeden *Satz* (bis . ! ?), der Imperativ enthält */
function removeImperativeSentences(raw) {
  const SENTENCE = /[^.!?]*[.!?]/g; // grob: bis zum Satzzeichen
  let out = "";
  let m;
  while ((m = SENTENCE.exec(raw)) !== null) {
    const sentence = m[0].trim();
    if (!sentence) continue;
    if (CTA_VERBS.test(sentence)) continue; // CTA-Satz verwerfen
    out += (out ? "\n" : "") + sentence;
  }
  // Rest ohne Satzzeichen
  const tail = raw.slice(SENTENCE.lastIndex).trim();
  if (tail && !CTA_VERBS.test(tail)) out += (out ? "\n" : "") + tail;
  return out;
}

function canonicalCTA() {
  return "Notiere dir heute einen einzigen, leichten Schritt.";
}

/**
 * Endgültige Reihenfolge:
 *  - zeilenweise Imperativ-Zeilen entfernen
 *  - satzweise Imperativ-Sätze entfernen
 *  - globales Safety-Net (Fragmente/ohne Punkt)
 *  - genau 1 kanonische CTA anhängen
 */
function dedupeCTA(text, styleCta) {
  // 1) Lines-first purge
  let body = removeImperativeLines(text);

  // 2) Sentence-level purge
  body = removeImperativeSentences(body);

  // 3) Safety-Net: auch Imperativ-Fragmente/Restzeilen restlos entfernen
  const CTA_GLOBAL = new RegExp(
    [
      // Bullets mit Imperativ
      /(^|\n)\s*-\s*(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*($|\n)/.source,
      // generische Imperativ-Zeilen (auch ohne Punkt)
      /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*$/.source,
      // frühere fest verdrahtete Formulierungen
      /Notiere dir heute einen einzigen, leichten Schritt\.?/.source,
      /Setze heute einen kleinen, konkreten Schritt\.?/.source,
    ].join("|"),
    "gim"
  );
  body = body.replace(CTA_GLOBAL, "").replace(/\n{3,}/g, "\n\n").trim();

  // 4) Exakt EINE kanonische CTA anhängen
  body = body.length ? body + "\n\n" + canonicalCTA(styleCta) : canonicalCTA(styleCta);

  // Glätten & zurück
  return body.replace(/\n{3,}/g, "\n\n").trim();
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

