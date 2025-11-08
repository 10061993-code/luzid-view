// packages/content-engine/scripts/snapshot_runner.mjs
// Guard v5 — schlank & professionell:
// Prüft NUR noch (a) korrektes Closing und (b) kanonische CTA am Ende des Bodys.
// Keine Imperativ-Verb-Logik mehr.

const ENDPOINT = "https://luzid-astro-backend-production.up.railway.app/api/content/weekly";
const CREATORS = ["lena", "paul", "yasmin"];
const BASE = { week: "2026-W05", event: "full_moon", length: "medium", age: 24 };

const CTA_CANON = "Notiere dir heute einen einzigen, leichten Schritt.";
const CTA_CANON_RX_END = /Notiere dir heute einen einzigen, leichten Schritt\.\s*$/i;

const CLOSINGS = {
  lena: /xx – Lena\s*$/i,
  paul: /– Paul\s*$/i,
  yasmin: /✨\s*Yasmin\s*$/i,
};

// Normalisierung (Trim, CR raus, überzählige Leerzeilen)
function norm(s = "") {
  return String(s)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Closing am Textende abtrennen (per Regex) und Body/Closing zurückgeben
function detachClosing(full, creator) {
  const rx = CLOSINGS[creator];
  const m = rx ? String(full).match(rx) : null;
  if (!m) return { body: norm(full), closing: "", foundClosing: false };
  const closing = m[0].trim();
  const body = norm(full.slice(0, full.length - m[0].length)).replace(/\s+$/, "");
  return { body, closing, foundClosing: true };
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
  return data; // { text, meta, … }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  let failed = false;

  for (const c of CREATORS) {
    try {
      const res = await callWeekly(c);
      const fullText = String(res.text);
      const meta = res?.meta || {};

      const { body, closing, foundClosing } = detachClosing(fullText, c);

      // 1) Closing korrekt?
      assert(foundClosing && CLOSINGS[c].test(closing), `[${c}] wrong closing: "${closing || "(none)"}"`);

      // 2) Body endet mit der kanonischen CTA (tolerant bzgl. Whitespace)
      assert(CTA_CANON_RX_END.test(body), `[${c}] canonical CTA missing or not at end`);

      // 3) (Optional) Duplikat-Check der kanonischen CTA – genau 1x im Body
      const ctaCount = (body.match(new RegExp(CTA_CANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length;
      assert(ctaCount === 1, `[${c}] duplicate canonical CTA (${ctaCount})`);

      console.log(`[OK] ${c} :: pv=${meta?.policy_version ?? "n/a"} edge=${meta?.route_policy_edge ? "1" : "0"}`);
    } catch (e) {
      failed = true;

      // kompakte Debug-Ausgabe
      try {
        const res = await callWeekly(c);
        const fullText = String(res?.text ?? "");
        const meta = res?.meta || {};
        const { body, closing, foundClosing } = detachClosing(fullText, c);
        const tail = body.slice(Math.max(0, body.length - 200));

        console.error(`\n[FAIL] ${c}: ${e.message}`);
        console.error(`[DEBUG] meta.policy_version=${meta?.policy_version ?? "n/a"} meta.edge=${meta?.route_policy_edge ? "1" : "0"}`);
        console.error(`[DEBUG] closing_found=${foundClosing} closing="${closing || "(none)"}"`);
        console.error(`[DEBUG] body_tail(200)="${tail}"`);
        console.error(`[DEBUG] endsWithCanon=${CTA_CANON_RX_END.test(body)}`);
      } catch (ee) {
        console.error(`[DEBUG] re-fetch failed: ${ee.message}`);
      }
    }
  }

  if (failed) process.exit(1);
  console.log("\nAll creators passed ✅");
})();

