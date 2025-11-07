import { callAzure } from "../services/azure.mjs";
import { breakerAllow, breakerReport } from "./circuit_breaker.mjs";

export async function generateChat(opts) {
  let provider = (process.env.ENGINE_PROVIDER || "").toLowerCase();
  if (!provider) provider = (process.env.AZURE_OPENAI_API_KEY ? "azure" : "openai");

  const allow = breakerAllow(provider);
  if (!allow.ok) {
    // naive Fallback
    const alt = provider === "azure" ? "openai" : "azure";
    const allowAlt = breakerAllow(alt);
    if (!allowAlt.ok) throw new Error(`[breaker] provider ${provider} blocked, alt ${alt} blocked`);
    provider = alt;
  }

  const t0 = performance.now();
  try {
    const out = (provider === "azure") ? await callAzure(opts) : await callOpenAI(opts);
    breakerReport(provider, true);
    return out;
  } catch (e) {
    breakerReport(provider, false);
    throw e;
  }
}

async function callOpenAI(opts) {
  const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error('[model_client] OPENAI_API_KEY fehlt – in Railway setzen.');

  const {
    model = process.env.OPENAI_MODEL || 'gpt-4o',
    system, user,
    temperature = Number(process.env.OPENAI_TEMPERATURE || 0.7),
    max_tokens = Number(process.env.OPENAI_MAX_TOKENS || 600)
  } = opts;

  const body = { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature, max_tokens };

  // timeout+retry lokal in fetch
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[model_client] OpenAI HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? '').trim();
}
