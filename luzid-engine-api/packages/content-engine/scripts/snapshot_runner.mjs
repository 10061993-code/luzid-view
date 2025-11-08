// packages/content-engine/scripts/snapshot_runner.mjs
// Guard v4 — with rich debug: shows meta, closing, tail, and imperative hits

const ENDPOINT = "https://luzid-astro-backend-production.up.railway.app/api/content/weekly";
const CREATORS = ["lena", "paul", "yasmin"];
const BASE = { week: "2026-W05", event: "full_moon", length: "medium", age: 24 };

const CTA_CANON = "Notiere dir heute einen einzigen, leichten Schritt.";
const CTA_CANON_RX_END = /Notiere dir heute einen einzigen, leichten Schritt\.\s*$/i;
const IMP_VERBS_RX = /\b(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b/gi;
const CLOSINGS = {
  lena: /xx – Lena\s*$/i,
  paul: /– Paul\s*$/i,
  yasmin: /✨\s*Yasmin\s*$/i,
};

function norm(s = "") {
  return String(s).replace(/[ \t]+\n/g, "\n").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function detachClosing(full, creator) {
  const rx = CLOSINGS[creator];
  const m = rx ? String(full).match(rx) : null;
  if (!m) return { body: norm(full), closing: "", foundClosing: false };
  const closing = m[0].trim();
  const body = norm(full.slice(0, full.length - m[0].length));
  return { body: body.replace(/\s+$/, ""), closing, foundClosing: true };
}

async function callWeekly(creator) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...BASE, creator }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data; // return full JSON: {text, meta, ...}
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function debugImperatives(s) {
  const hits = [];
  let m;
  while ((m = IMP_VERBS_RX.exec(s)) !== null) {
    hits.push({ verb: m[1], index: m.index, context: s.slice(Math.max(0, m.index - 30), m.index + 60) });
  }
  return hits;
}

(async () => {
  let failed = false;

  for (const c of CREATORS) {
    try {
      const res = await callWeekly(c);
      const fullText = String(res?.text ?? "");
      const meta = res?.meta || {};

      const { body, closing, foundClosing } = detachClosing(fullText, c);

      const hasCanonAnywhere = body.includes(CTA_CANON);
      const endsWithCanon = CTA_CANON_RX_END.test(body);
      const bodyWithoutCTA = body.replace(CTA_CANON_RX_END, "").trim();

      // 1) Closing korrekt?
      assert(foundClosing && CLOSINGS[c].test(closing), `[${c}] wrong closing: "${closing || "(none)"}"`);

      // 2) Body endet exakt mit kanonischer CTA?
      assert(endsWithCanon, `[${c}] canonical CTA missing or not at end`);

      // 3) Imperative im Body ohne CTA?
      const impHits = debugImperatives(bodyWithoutCTA);
      assert(impHits.length === 0, `[${c}] body contains imperative verb outside canonical CTA: ${impHits.map(h=>h.verb).join(", ") || "?"}`);

      // 4) doppelte kanonische CTA?
      const ctaCount = (body.match(new RegExp(CTA_CANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      assert(ctaCount === 1, `[${c}] duplicate canonical CTA (${ctaCount})`);

      console.log(`[OK] ${c} :: pv=${meta?.policy_version ?? "n/a"} edge=${meta?.route_policy_edge ? "1" : "0"}`);
    } catch (e) {
      failed = true;

      // --- rich debug ---
      console.error(`\n[FAIL] ${c}: ${e.message}`);
      try {
        const res = await callWeekly(c);
        const text = String(res?.text ?? "");
        const meta = res?.meta || {};
        const { body, closing, foundClosing } = detachClosing(text, c);
        const tail = body.slice(Math.max(0, body.length - 200));

        const hasCanonAnywhere = body.includes(CTA_CANON);
        const endsWithCanon = CTA_CANON_RX_END.test(body);
        const bodyWithoutCTA = body.replace(CTA_CANON_RX_END, "").trim();
        const impHits = debugImperatives(bodyWithoutCTA);

        console.error(`[DEBUG] meta.policy_version=${meta?.policy_version ?? "n/a"} meta.edge=${meta?.route_policy_edge ? "1" : "0"}`);
        console.error(`[DEBUG] closing_found=${foundClosing} closing="${closing || "(none)"}"`);
        console.error(`[DEBUG] body_tail(200)="${tail}"`);
        console.error(`[DEBUG] hasCanonAnywhere=${hasCanonAnywhere} endsWithCanon=${endsWithCanon}`);
        if (impHits.length) {
          console.error(`[DEBUG] imperative_hits=${impHits.length}`);
          for (const h of impHits) {
            console.error(`  - verb="${h.verb}" at ${h.index} ... "${h.context.replace(/\n/g, " ")}"`);
          }
        }
      } catch (ee) {
        console.error(`[DEBUG] could not re-fetch for debug: ${ee.message}`);
      }
    }
  }

  if (failed) process.exit(1);
  console.log("\nAll creators passed ✅");
})();

