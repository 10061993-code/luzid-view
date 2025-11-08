import { getCreatorStyle, pickWeeklyAtoms } from "../lib/narration/narrator.mjs";
import { getCreatorStyleFromDB } from "../services/creators.mjs";

function mockTransits(event="new_moon") {
  if (event === "new_moon") return [{ planet:"Moon", aspect:"conj", target:"Sun" }];
  return [];
}

export async function buildWeeklyContext(input) {
  const event = input.event || "new_moon";
  const creator = (input.creator||"lena").toLowerCase();

  const remote = await getCreatorStyleFromDB(creator).catch(()=>null);
  const base   = getCreatorStyle(creator);
  const style  = { ...base, ...(remote||{}) };

  const atoms = pickWeeklyAtoms({ event });

  const cta = style.cta_style === "crisp"
    ? "Notiere heute 1 Mini-Schritt, den du sofort gehen kannst."
    : "Schreibe dir heute einen Mini-Schritt auf, der leicht fällt.";

  const closing = (atoms.closing || "xx – {creator}").replace("{creator}", creator);

  return {
    creator, style,
    phase: "exploration",
    context: { audience: input.audience || "Gen Z, reflektiv" },
    transits: mockTransits(event),
    cta,
    instructions: atoms.lines.join(" "),
    closing
  };
}
