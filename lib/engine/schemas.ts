import { z } from "zod";

export const PhaseProfileSchema = z.object({
  phase: z.enum(["exploration","consolidation"]),
  confidence: z.number().min(0).max(1).optional(),
  detected_by: z.array(z.string()).optional()
});

export const UserContextSchema = z.object({
  relationship_status: z.enum(["single","in_relationship","its_complicated","prefer_not_to_say"]).optional(),
  focus_theme: z.enum(["career","love","self","balance","family","finance","health"]).optional(),
  current_mood: z.string().optional(),
  interest_tags: z.array(z.string()).max(6).optional(),
  engagement_score: z.number().min(0).max(1).optional(),
  frequency_pref: z.enum(["low","standard","high"]).optional()
});

export const TransitSchema = z.object({
  planet: z.string().optional(),
  aspect: z.string().optional(),
  target: z.string().optional(),
  house: z.number().int().optional(),
  event: z.string().optional(),
  exact: z.string().optional() // ISO
});

export const GenerateBodySchema = z.object({
  type: z.enum(["weekly","micro","birth"]).default("weekly"),
  creator: z.string().default("lena"),
  age: z.coerce.number().min(10).max(110),
  phase_profile: PhaseProfileSchema,
  user_context: UserContextSchema.default({}),
  transits: z.array(TransitSchema).default([]),
  profile: z.any().optional() // falls du Birth-Profile mitgibst
});

