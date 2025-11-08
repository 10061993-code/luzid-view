import { getCreatorStyle, pickWeeklyAtoms } from "../lib/narration/narrator.mjs";
import { getCreatorStyleFromDB } from "../services/creators.mjs";

/** Stub für Transits – später Swiss Ephemeris einspeisen */
function mockTransits(event = "new_moon") {
  if (event === "new_moon") return [{ planet: "Moon", aspect: "conj", target: "Sun" }];
  return [];
}

export async function buildWeeklyContext(input) {
  const event = input.event || "new_moon";
  const creator = (input.creator || "lena").toLowerCase();

  // Stil: DB (Supabase) → Fallback Repo-Default → Merge
  const remote = await getCreatorStyleFromDB(creator).catch(() => null);
  const base   = getCreatorStyle(creator);
  const style  = { ...base, ...(remote || {}) };

  const atoms = pickWeeklyAtoms({ event });

  const cta = style.cta_style === "crisp"
    ? "Notiere heute 1 Mini-Schritt, den du sofort gehen kannst."
    : "Schreibe dir heute einen Mini-Schritt auf, der leicht fällt.";

  const display = creator.charAt(0).toUpperCase() + creator.slice(1);
  const closing = (atoms.closing || "xx – {creator}").replace("{creator}", display);

  return {
    creator,
    style,
    phase: "exploration",
    context: { audience: input.audience || "Gen Z, reflektiv" },
    transits: mockTransits(event),
    cta,
    instructions: atoms.lines.join(" "),
    closing
  };
}
