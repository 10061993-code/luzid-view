// packages/content-engine/scripts/snapshot_runner.mjs
// Guard v3: robust closing-detection & CTA check (whitespace/linebreak tolerant)

const ENDPOINT = "https://luzid-astro-backend-production.up.railway.app/api/content/weekly";
const CREATORS = ["lena", "paul", "yasmin"];
const BASE = { week: "2026-W05", event: "full_moon", length: "medium", age: 24 };

const CTA_CANON = "Notiere dir heute einen einzigen, leichten Schritt.";
const CTA_CANON_RX = /Notiere dir heute einen einzigen, leichten Schritt\.\s*$/i;
const IMP_VERBS = /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b/i;
const CLOSINGS = {
  lena: /xx – Lena\s*$/i,
  paul: /– Paul\s*$/i,
  yasmin: /✨\s*Yasmin\s*$/i,
};

// trim helpers
function norm(s = "") {
  return String(s).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// find closing by regex-at-end, not by \n\n split
function detachClosing(full, creator) {
  const rx = CLOSINGS[creator];
  const m = rx ? String(full).match(rx) : null;
  if (!m) return { body: norm(full), closing: "" };
  const closing = m[0].trim();
  const body = norm(full.slice(0, full.length - m[0].length));
  // falls ein leerer Zeilenumbruch vor dem Closing steht, den Body trimmen
  return { body: body.replace(/\s+$/,""), closing };
}

async function callWeekly(creator) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...BASE, creator }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.text) throw new Error("No text");
  return String(data.text);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  let failed = false;

  for (const c of CREATORS) {
    try {
      const full = await callWeekly(c);
      const { body, closing } = detachClosing(full, c);

      // 1) Closing korrekt am Ende?
      assert(CLOSINGS[c].test(closing), `[${c}] wrong closing: "${closing || "(none)"}"`);

      // 2) Body muss mit der kanonischen CTA enden (tolerant ggü. Whitespace)
      assert(CTA_CANON_RX.test(body), `[${c}] canonical CTA missing or not at end`);

      // 3) Imperativ-Check auf Body OHNE die CTA
      const bodyWithoutCTA = body.replace(CTA_CANON_RX, "").trim();
      assert(!IMP_VERBS.test(bodyWithoutCTA), `[${c}] body contains imperative verb (outside canonical CTA)`);

      // 4) Keine doppelte kanonische CTA
      const ctaCount =
        (body.match(new RegExp(CTA_CANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || [])
          .length;
      assert(ctaCount === 1, `[${c}] duplicate canonical CTA (${ctaCount})`);

      console.log(`[OK] ${c}`);
    } catch (e) {
      console.error(`[FAIL] ${c}: ${e.message}`);
      failed = true;
    }
  }

  if (failed) process.exit(1);
  console.log("All creators passed ✅");
})();

