import { buildContext } from "./context_builder.mjs";
import { getTransitsForUser } from "./getTransitsForUser.mjs";
import { buildPrompt } from "./prompt_builder.mjs";
import { callModel } from "./model_client.mjs";
import { lint } from "./guardrails.mjs";
import { score } from "./evaluator.mjs";
import * as cache from "./cache.mjs";

// Minimaler Atoms-Stub
function pickAtomsSubset({ focus }) {
  const atoms = [
    { id: "a1", theme: "core", text: "Klarheit & Ausdruck – du findest Worte für das, was bewegt." },
    { id: "a2", theme: "activation", text: "Heute günstig für neue Impulse, die du aus innerer Ruhe setzt." }
  ];
  return focus ? atoms : atoms;
}

// Öffentliche API der Engine
export async function generateDrop(input) {
  // 1) Kontext
  const { phase_profile, merged_tone, wording_tokens, user_context, creatorCfg } = buildContext({ input });

  // 2) Daten
  const transits = await getTransitsForUser(input);
  const atoms = pickAtomsSubset({ focus: input?.focus });

  // 3) Prompt
  const msgs = buildPrompt({
    merged_tone,
    wording_tokens,
    phase_profile,
    user_context,
    transits,
    atoms,
    creatorCfg,
    input
  });

  // 4) Cache prüfen
  const cKey = cache.keyOf({ creator: input.creator, event: input.event, tone: input.tone, focus: input.focus, msgs });
  const hit = cache.get(cKey);
  if (hit) return { text: hit, cache: { key: cKey, hit: true } };

  // 5) Model
  const res = await callModel(msgs);
  const cleaned = lint(res.text);

  // 6) Evaluieren
  const evalRes = score(cleaned);

  // 7) Cache setzen & zurück
  cache.set(cKey, cleaned);
  return {
    text: cleaned,
    score: evalRes.score,
    criteria: evalRes.criteria,
    cache: { key: cKey, hit: false }
  };
}

