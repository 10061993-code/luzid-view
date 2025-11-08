// v3.5 — line + sentence + paragraph purge; enforce exact canonical CTA
function dedupeCTA(text, styleCta) {
  const canonical = canonicalCTA(styleCta);

  // Regex-Bausteine aus v3.4
  const CTA_VERBS_GROUP = "(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)";
  const RX_BULLET = new RegExp(String.raw`(^|\n)\s*-\s*${CTA_VERBS_GROUP}\b[^\n]*`, "gim");
  const RX_INLINE_TO_END = new RegExp(String.raw`${CTA_VERBS_GROUP}\b[^\.!\?\n]*[\.!\?]?`, "gim");
  const RX_FRAGMENT = new RegExp(String.raw`(^|\n)\s*(?:-\s*)?${CTA_VERBS_GROUP}\b[^\n]*`, "gim");

  // 0) Arbeitskopie
  let body = String(text ?? "");

  // 1) Bullet-CTAs raus
  body = body.replace(RX_BULLET, "$1");

  // 2) Inline-Imperative bis Satzende raus
  body = body.replace(RX_INLINE_TO_END, "");

  // 3) Rest-Fragmente (ohne Endzeichen) raus
  body = body.replace(RX_FRAGMENT, "$1");

  // 4) Satzweise säubern (Fallback)
  body = body
    .replace(/([.!?])\s+(?=[A-ZÄÖÜ])/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => !new RegExp(CTA_VERBS_GROUP, "i").test(s))
    .join("\n");

  // 5) **NEU**: Absatz-Purge — jeden Paragraphen mit Imperativ vollständig entfernen
  body = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((p) => !new RegExp(CTA_VERBS_GROUP, "i").test(p))
    .join("\n\n");

  // 6) Safety: evtl. verbliebene „Notiere/Schreibe/Setze …“-Fragmente ohne Punkt komplett killen
  const RX_ANY_RESIDUAL = new RegExp(
    String.raw`(^|\n)\s*(?:-\s*)?${CTA_VERBS_GROUP}\b[^\n]*`,
    "gim"
  );
  body = body.replace(RX_ANY_RESIDUAL, "$1");

  // 7) Glätten
  body = body
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 8) **Exakt** eine kanonische CTA anhängen
  //    (vorher ALLE Varianten der kanonischen Zeile inkl. Anhängsel entfernen)
  const RX_CANONICAL_VARIANTS = /Notiere dir heute einen einzigen, leichten Schritt[^.\n!?]*[.!?]?/gi;
  body = body.replace(RX_CANONICAL_VARIANTS, "").replace(/\n{3,}/g, "\n\n").trim();

  body = body.length ? `${body}\n\n${canonical}` : canonical;

  return body.trim();
}

