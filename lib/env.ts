import { z } from "zod";

const EnvSchema = z.object({
  GEN_API_URL: z.string().url().optional(),
  GEN_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CREATOR_SLUG: z.string().optional(),
});

type EnvType = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const flat = parsed.error.flatten();
  console.error("Environment validation failed:", flat);
  throw new Error("Invalid environment. Please set required variables.");
}

export const ENV: EnvType = {
  GEN_API_URL: parsed.data.GEN_API_URL,
  GEN_API_KEY: parsed.data.GEN_API_KEY,
  NEXT_PUBLIC_CREATOR_SLUG: parsed.data.NEXT_PUBLIC_CREATOR_SLUG,
};

