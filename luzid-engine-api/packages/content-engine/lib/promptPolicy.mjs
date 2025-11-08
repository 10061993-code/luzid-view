// Entfernt ALLE CTA-Sätze global und hängt exakt EINE kanonische CTA an
function dedupeCTA(text, styleCta) {
  const canonical = canonicalCTA(styleCta);

  // 1) Satzweise CTA-Erkennung (bekannte Muster + Imperativ + „heute“)
  //    Wir schneiden ganze Sätze raus (inkl. Punkt/!/?), auch wenn mehrere im Absatz sind.
  const SENTENCE_BOUNDARY = /([.!?])\s+(?=[A-ZÄÖÜ])/g;
  const sentences = text
    .replace(/\s+\n/g, "\n")
    .replace(SENTENCE_BOUNDARY, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const kept = [];
  for (const s of sentences) {
    // wenn Satz CTA ist → komplett verwerfen
    if (isCTA(s)) continue;
    kept.push(s);
  }

  // 2) Text wieder zusammenbauen, Absätze glätten
  let body = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // 3) Sicherheit: Falls irgendwo doch “Notiere dir …” stehen blieb, jetzt nochmal rauswerfen
  const CTA_GLOBAL = new RegExp(
    [
      /Notiere dir heute einen einzigen, leichten Schritt\.?/.source,
      /Setze heute einen kleinen, konkreten Schritt\.?/.source,
      /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*\bheute\b.*\./.source,
    ].join("|"),
    "gi"
  );
  body = body.replace(CTA_GLOBAL, "").replace(/\n{3,}/g, "\n\n").trim();

  // 4) Exakt EINE kanonische CTA am Ende hinzufügen
  if (body.length > 0) body += "\n\n" + canonical;
  else body = canonical;

  return body.trim();
}

