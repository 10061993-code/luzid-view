// packages/content-engine/scripts/snapshot_runner.mjs
// v0 — minimalistischer Health-/Smoke-Test
// Prüft nur, ob der Endpoint erreichbar ist und Text zurückgibt.
// Keine CTA-, Closing- oder Policy-Prüfungen.

const ENDPOINT = "https://luzid-astro-backend-production.up.railway.app/api/content/weekly";
const CREATOR = "lena";

(async () => {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creator: CREATOR,
        week: "2026-W05",
        event: "full_moon",
        length: "medium",
        age: 24
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data?.text) {
      console.log("✅ Endpoint reachable — text received:");
      console.log(data.text.slice(0, 200) + "...");
    } else {
      console.log("⚠️  Endpoint reachable, but no text in response.");
    }
  } catch (e) {
    console.error("❌ Request failed:", e.message);
    process.exit(1);
  }
})();

