// Entfernt ALLE CTA-Sätze/Zeilen (auch Bullet-CTAs) und hängt exakt EINE kanonische CTA ans Ende
function dedupeCTA(text, styleCta) {
  const canonical = canonicalCTA(styleCta);

  // Satz-/Zeilenweise trennen (robust gegen Absätze + Aufzählungen)
  const SENTENCE_BOUNDARY = /([.!?])\s+(?=[A-ZÄÖÜ])/g;
  const chunks = text
    .replace(/\s+\n/g, "\n")          // Whitespace vor Zeilenumbrüchen normalisieren
    .replace(SENTENCE_BOUNDARY, "$1\n") // Sätze auf neue Zeile
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const kept = [];
  for (const c of chunks) {
    // Zeilen/Sätze, die CTA sind → komplett verwerfen
    if (isCTA(c)) continue;
    kept.push(c);
  }

  // Zusammenbauen und überzählige Leerzeilen glätten
  let body = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // Safety-Net: Falls irgendwo noch CTA-Muster durchgerutscht sind (z. B. ohne Punkt),
  // entferne sie global.
  const CTA_GLOBAL = new RegExp(
    [
      /(^|\n)\s*-+\s*(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*($|\n)/.source,
      /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b.*auf\b.*$/.source,
      /Notiere dir heute einen einzigen, leichten Schritt\.?/.source,
      /Setze heute einen kleinen, konkreten Schritt\.?/.source,
    ].join("|"),
    "gim"
  );
  body = body.replace(CTA_GLOBAL, "").replace(/\n{3,}/g, "\n\n").trim();

  // Exakt EINE kanonische CTA ans Ende
  if (body.length > 0) body += "\n\n" + canonical;
  else body = canonical;

  return body.trim();
}

