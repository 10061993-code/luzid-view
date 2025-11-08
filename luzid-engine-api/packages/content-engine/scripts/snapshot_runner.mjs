// packages/content-engine/scripts/snapshot_runner.mjs
// Guard: validates CTA/Closing policy on live endpoint for multiple creators

const ENDPOINT = "https://luzid-astro-backend-production.up.railway.app/api/content/weekly";
const CREATORS = ["lena", "paul", "yasmin"];
const BASE = { week: "2026-W05", event: "full_moon", length: "medium", age: 24 };

const CTA_CANON = "Notiere dir heute einen einzigen, leichten Schritt.";
const IMP_VERBS = /(Schreibe|Notiere|Setze|Formuliere|Definiere|Wähle|Plane|Mache)\b/;
const CLOSINGS = {
  lena: /xx – Lena$/,
  paul: /– Paul$/,
  yasmin: /✨ Yasmin$/,
};

function splitClosing(text) {
  const i = text.lastIndexOf("\n\n");
  if (i === -1) return { body: text.trim(), closing: "" };
  return { body: text.slice(0, i).trim(), closing: text.slice(i + 2).trim() };
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
  return data.text;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  let failed = false;
  for (const c of CREATORS) {
    try {
      const text = await callWeekly(c);
      const { body, closing } = splitClosing(text);

      // Closing korrekt?
      assert(CLOSINGS[c].test(closing), `[${c}] wrong closing: "${closing}"`);

      // Body darf keine Imperativ-Verben enthalten
      assert(!IMP_VERBS.test(body), `[${c}] body contains imperative verb`);

      // Body muss mit der kanonischen CTA enden
      assert(body.endsWith(CTA_CANON), `[${c}] canonical CTA missing or not at end`);

      // keine doppelte kanonische CTA
      const ctaCount = (body.match(new RegExp(CTA_CANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      assert(ctaCount === 1, `[${c}] duplicate canonical CTA: ${ctaCount}`);

      console.log(`[OK] ${c}`);
    } catch (e) {
      console.error(`[FAIL] ${c}: ${e.message}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log("All creators passed ✅");
})();

