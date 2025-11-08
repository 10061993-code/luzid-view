// packages/content-engine/lib/promptPolicy.mjs
// v3.0 — Ultra CTA Filter (Imperative Detection) + Strict Closing

/**
 * Hauptfunktion: Säubert und vereinheitlicht generierte Texte.
 * - entfernt doppelte CTA oder imperativische Sätze
 * - hängt genau eine kanonische CTA an
 * - erzwingt striktes Creator-Closing (xx – Lena etc.)
 */

export function applyPolicy(text, { creatorHandle, style }) {
  let t = (text || "").trim();
  t = normalizeWhitespace(t);
  t = stripHallucinatedHeaders(t);
  t = limitEmojis(t, style?.emoji ?? "none");
  t = dedupeCTA(t, style?.cta_style ?? "crisp");
  t = enforceClosing(t, creatorHandle, style);
  return t;
}

/* ---------------------- Normalisierung ---------------------- */

function normalizeWhitespace(t) {
  return t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function stripHallucinatedHeaders(t) {
  // Entfernt evtl. Markdown-Überschriften vom Modell
  return t.replace(/^(?:#+\s.*\n+)+/g, "");
}

function limitEmojis(t, mode) {
  if (mode === "none") {
    return t.replace(/\p{Extended_Pictographic}/gu, "");
  }
  return t;
}

/* ---------------------- CTA-Erkennung ---------------------- */

// Ultra-robust: jede Zeile/Satz mit Imperativ-Verb ist CTA
const CTA_VERBS =
  /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b/i;

function isCTA(line) {
  if (!line) return false;
  const l = line.trim();
  // Bullets wie "- Schreibe ..." → CTA
  if (/^\s*-\s*/.test(l) && CTA_VERBS.test(l)) return true;
  // normale Zeilen mit Imperativ
  if (CTA_VERBS.test(l)) return true;
  return false;
}

function canonicalCTA() {
  return "Notiere dir heute einen einzigen, leichten Schritt.";
}

/**
 * Entfernt alle Imperativ- oder CTA-Sätze restlos
 * und fügt am Ende genau eine kanonische CTA hinzu.
 */
function dedupeCTA(text, styleCta) {
  const canonical = canonicalCTA(styleCta);

  // 1️⃣ Text in einzelne Zeilen/Sätze aufbrechen
  const SENTENCE_BOUNDARY = /([.!?])\s+(?=[A-ZÄÖÜ])/g;
  const parts = text
    .replace(/\s+\n/g, "\n")
    .replace(SENTENCE_BOUNDARY, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  // 2️⃣ Alle CTA-Zeilen (Imperative) entfernen
  const kept = [];
  for (const p of parts) {
    if (isCTA(p)) continue;
    kept.push(p);
  }

  // 3️⃣ Body neu zusammensetzen und glätten
  let body = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // 4️⃣ Safety-Net: Imperativ-Fragmente ohne Punkt restlos entfernen
  const CTA_GLOBAL = new RegExp(
    [
      /(^|\n)\s*-\s*(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*($|\n)/.source,
      /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*$/.source,
      /Notiere dir heute einen einzigen, leichten Schritt\.?/.source,
      /Setze heute einen kleinen, konkreten Schritt\.?/.source,
    ].join("|"),
    "gim"
  );

  body = body.replace(CTA_GLOBAL, "").replace(/\n{3,}/g, "\n\n").trim();

  // 5️⃣ Exakt eine kanonische CTA anhängen
  body = body.length ? body + "\n\n" + canonical : canonical;

  return body.trim();
}

/* ---------------------- Closing-Logik ---------------------- */

function enforceClosing(t, creatorHandle, style = {}) {
  // Entferne evtl. modellgenerierte Grußformeln
  const signoffRx =
    /(\n\s*(Alles Liebe|Liebe Grüße|Herzlichst|Herzlich|LG|xx|–)\s*[—–-]?\s*[A-Za-zÄÖÜäöüß✨ ]{0,40},?\s*)$/i;
  let body = t.replace(signoffRx, "").trim();

  // Definiere exakte Closings pro Creator
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

