import { applyPolicy } from "./lib/promptPolicy.mjs";
import { generateChat } from "./lib/model_client.mjs";
import { sanitizeText } from "./lib/sanitize.mjs";
import { evaluateOutput } from "./lib/evaluate.mjs";
import { cacheOnce } from "./lib/cache.mjs";
import { putWeeklyArchive } from "./services/supabase.mjs";
import { metricsIncRequest, metricsIncError, metricsRecord } from "./lib/metrics.mjs";

function keyOf(obj) {
  const s = JSON.stringify(obj);
  let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function buildUserPrompt(input, policy) {
  const parts = [];
  parts.push("Aufgabe: Erzeuge einen kurzen, umsetzbaren Astro-Impuls für Social/Newsletter.");
  if (input?.audience) parts.push(`Zielgruppe: ${input.audience}`);
  if (input?.persona) parts.push(`Persona: ${input.persona}`);
  if (input?.event) parts.push(`Event/Anlass: ${input.event}`);
  parts.push(""); parts.push(policy.instructions);
  return parts.filter(Boolean).join("\n");
}

export async function runPipeline(input = {}, meta = {}) {
  metricsIncRequest();
  const t0 = performance.now();
  const policy = applyPolicy(input);
  const onceKey = `once:${policy.meta.creator}:${keyOf({ event: input.event, length: policy.meta.length, tone: input.tone, type: input.type })}`;
  const once = cacheOnce(onceKey);

  const user = buildUserPrompt(input, policy);
  let provider = process.env.ENGINE_PROVIDER?.toLowerCase() || (process.env.AZURE_OPENAI_API_KEY ? "azure":"openai");

  let textRaw, cleaned, evalRes, latency_ms;
  try {
    textRaw = await generateChat({
      system: policy.system, user,
      temperature: 0.65, max_tokens: 550
    });
    cleaned = sanitizeText(textRaw, { maxChars: 1400 });
    evalRes = evaluateOutput(cleaned, { maxWords: policy.maxWords });
    latency_ms = Math.round(performance.now() - t0);
    metricsRecord(provider, true, latency_ms);
  } catch (err) {
    latency_ms = Math.round(performance.now() - t0);
    metricsIncError();
    metricsRecord(provider, false, latency_ms);
    throw err;
  }

  // Weekly-Archiv optional
  if (String(input?.type).toLowerCase() === "weekly") {
    const userKey = String(input?.user || input?.creator || "unknown");
    const weekKey = String(input?.week || new Date().toISOString().slice(0,10));
    try { await putWeeklyArchive({ user: userKey, week: weekKey, payload: { input, policy, cleaned, evalRes } }); }
    catch(e){ /* nicht kritisch fürs MVP */ }
  }

  return {
    text: cleaned,
    ...evalRes,
    cache: { hit: once.hit, key: once.key },
    meta: policy.meta,
    latency_ms
  };
}
