import { detectPhase } from "./age_profiles.mjs";
import { toneForPhase, toneForAge, mergeTone } from "./tone_by_age.mjs";
import { wordingTokensFor, toneOffsetsFor, getCreatorConfig } from "./narrator.mjs";

export function buildContext({ input }) {
  const age = typeof input?.age === "number" ? input.age : undefined;
  const phase_profile = detectPhase({ age });
  const baseTone = mergeTone(toneForPhase(phase_profile), toneForAge(age));
  const creatorOffsets = toneOffsetsFor(input.creator);
  const merged_tone = mergeTone(baseTone, creatorOffsets);
  const wording_tokens = wordingTokensFor(input.creator);
  const user_context = input.quick ?? {};
  const creatorCfg = getCreatorConfig(input.creator);
  return { phase_profile, merged_tone, wording_tokens, user_context, creatorCfg };
}

