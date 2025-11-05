import { systemPolicy } from "./prompt_policy.mjs";

export function buildPrompt({
  merged_tone,
  wording_tokens,
  phase_profile,
  user_context,
  transits,
  atoms,
  creatorCfg,
  input
}) {
  const system = systemPolicy({ tone: merged_tone, wording: wording_tokens, creatorCfg });
  const user = JSON.stringify({
    type: input?.type,
    event: input?.event,
    focus: input?.focus,
    phase_profile,
    user_context,
    transits,
    atoms
  });
  return { system, user };
}

