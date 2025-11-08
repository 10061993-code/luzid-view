import { applyPolicy } from "./lib/promptPolicy.mjs";
import { generateChat } from "./lib/model_client.mjs";
import { sanitizeText } from "./lib/sanitize.mjs";
import { evaluateOutput } from "./lib/evaluate.mjs";
import { cacheOnce } from "./lib/cache.mjs";
import { metricsIncRequest, metricsIncError, metricsRecord } from "./lib/metrics.mjs";
import { buildWeeklyContext } from "./adapters/weekly_adapter.mjs";
import { buildSystem, buildUser } from "./lib/prompt_builder.mjs";

function keyOf(obj){const s=JSON.stringify(obj);let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h.toString(16);}

export async function runPipeline(input={}, meta={}) {
  metricsIncRequest();
  const t0 = performance.now();

  const isWeekly = String(input?.type||"").toLowerCase()==="weekly";
  let system, user, policy, provider;

  if (isWeekly) {
    policy = applyPolicy({ ...input, length: input.length||"medium" });
    const ctx = await buildWeeklyContext(input);         // creator style + atoms + transits
    system = buildSystem({ tone: policy.system.includes("Tonalität:") ? "" : "freundlich, klar", register: ctx.style.register });
    user   = buildUser({
      greeting: ctx.style.greeting,
      phase: ctx.phase,
      context: { ...ctx.context, persona: input.persona||"" },
      transits: ctx.transits,
      cta: ctx.cta,
      closing: ctx.closing,
      instructions: policy.instructions + "\n\n" + ctx.instructions
    });
  } else {
    policy = applyPolicy(input);
    system = policy.system;
    user   = "Aufgabe: Erzeuge einen kurzen, umsetzbaren Astro-Impuls.\n\n" + policy.instructions;
  }

  provider = (process.env.ENGINE_PROVIDER||"").toLowerCase() || (process.env.AZURE_OPENAI_API_KEY ? "azure":"openai");

  try {
    const textRaw = await generateChat({
      system, user,
      temperature: 0.65,
      max_tokens: Number(process.env.OPENAI_MAX_TOKENS||600)
    });

    const cleaned = sanitizeText(textRaw, { maxChars: 1400 });
    const evalRes = evaluateOutput(cleaned, { maxWords: policy.maxWords });
    const latency_ms = Math.round(performance.now()-t0);
    metricsRecord(provider, true, latency_ms);

    const onceKey = `once:${policy.meta.creator}:${keyOf({ type: input.type||"drop", event: input.event, length: policy.meta.length })}`;
    const once = cacheOnce(onceKey);

    return { text: cleaned, ...evalRes, cache:{ hit: once.hit, key: once.key }, meta: policy.meta, latency_ms };
  } catch (err) {
    const latency_ms = Math.round(performance.now()-t0);
    metricsIncError(); metricsRecord(provider, false, latency_ms);
    throw err;
  }
}
