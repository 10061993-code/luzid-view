// packages/content-engine/pipeline.mjs
// v2 — centralized post-processing (promptPolicy) applied to ALL model outputs

import { applyPolicy } from "./lib/promptPolicy.mjs";
import { getModelClient } from "./lib/model_client.mjs";           // erwartet: getModelClient().chat(messages, opts)
import { buildSystem, buildUser } from "./lib/engine/context_builder.mjs";
import { z } from "zod";
import { resolveFlags } from "./lib/ab.mjs";
import { fetchCreatorStyle } from "./services/creators.mjs";        // erwartet: fetchCreatorStyle(handle) -> { handle, display_name, style }
import { performance } from "node:perf_hooks";

// -------------------- Schemas --------------------
const PayloadSchema = z.object({
  creator: z.string().min(1),
  week: z.string().optional(),
  event: z.string().min(1),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  age: z.number().int().min(10).max(100).optional(),
  type: z.enum(["weekly", "micro"]).optional().default("weekly"),
});

// -------------------- Helpers --------------------
function finalizeText(rawText, payload, creatorRecord) {
  const creatorHandle =
    payload?.creator ||
    creatorRecord?.handle ||
    creatorRecord?.style?.creator ||
    "lena";

  const style =
    (creatorRecord && creatorRecord.style) ? creatorRecord.style : (creatorRecord || {});

  return applyPolicy(String(rawText ?? ""), { creatorHandle, style });
}

function msSince(t0) {
  return Math.round(performance.now() - t0);
}

// -------------------- Core Pipeline --------------------
export async function runPipeline(inputPayload) {
  const t0 = performance.now();

  // 1) Validate payload
  const payload = PayloadSchema.parse(inputPayload);

  // 2) Resolve A/B flags (if any)
  const flags = await resolveFlags({
    key: "tone_and_greeting_v1",
    context: { creator: payload.creator, type: payload.type },
  });

  // 3) Creator style (Supabase)
  const creatorRecord = await fetchCreatorStyle(payload.creator); // { handle, display_name, style }

  // 4) Build prompts
  const sys = buildSystem({
    phase: { description: `Age: ${payload.age ?? "n/a"}` },
    tone: { description: flags?.tone ?? "" },
    style: creatorRecord?.style ?? {},
    experiment: flags ?? {},
  });
  const usr = buildUser({
    event: payload.event,
    phase: { description: `Week: ${payload.week ?? "n/a"}` },
    tone: { description: flags?.tone ?? "" },
    style: creatorRecord?.style ?? {},
  });

  const messages = [
    { role: "system", content: sys },
    { role: "user", content: usr },
  ];

  // 5) Call model
  const client = getModelClient(); // wraps Azure/OpenAI with retry/timeout
  const { text: rawText, meta } = await client.chat(messages, {
    providerHint: process.env.ENGINE_PROVIDER || "azure",
    timeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 30000),
  });

  // 6) ALWAYS post-process
  const text = finalizeText(rawText, payload, creatorRecord);

  // 7) Evaluate (placeholder lightweight scoring)
  const score = 0.9;
  const criteria = ["clarity", "actionability"];
  const latency_ms = msSince(t0);

  return {
    text,
    score,
    criteria,
    meta: {
      ...(meta || {}),
      ab: flags ?? null,
      creator: creatorRecord?.handle ?? payload.creator,
      policy_version: "v3.6",
    },
    latency_ms,
  };
}

// Optional: default export for legacy imports
export default { runPipeline };

