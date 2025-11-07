import { applyPolicy } from "./lib/promptPolicy.mjs";
import { generateChat } from "./lib/model_client.mjs";

function buildUserPrompt(input, policy) {
  const lines = [];
  lines.push("Aufgabe: Erzeuge einen kurzen, umsetzbaren Astro-Impuls für Social/Newsletter.");
  if (input?.audience) lines.push(`Zielgruppe: ${input.audience}`);
  if (input?.persona) lines.push(`Persona: ${input.persona}`);
  if (input?.event) lines.push(`Event/Anlass: ${input.event}`);
  lines.push("");
  lines.push(policy.instructions);
  return lines.filter(Boolean).join("\n");
}

function evaluate(text, { maxWords }) {
  const wc = (text || '').split(/\s+/).filter(Boolean).length;
  const length_ok = wc <= (maxWords + Math.ceil(maxWords * 0.15)) ? 1 : (maxWords / wc);
  return {
    score: Math.max(0.3, Math.min(1, 0.6 + (length_ok - 0.5) * 0.4)),
    criteria: { tone_fit: 0, length_ok, policy: { maxSentences: 5, emojiLevel: "light", cta: "soft", jargon: "avoid" } }
  };
}

export async function runPipeline(input = {}) {
  const policy = applyPolicy(input);
  const user = buildUserPrompt(input, policy);

  const text = await generateChat({
    system: policy.system,
    user,
    temperature: 0.65,
    max_tokens: 480
  });

  const cleaned = text.replace(/\s+\./g, '.').replace(/\n{3,}/g, '\n\n').trim();
  const evalRes = evaluate(cleaned, { maxWords: policy.maxWords });
  const cacheKey = `once:${policy.meta.creator}:drop:${Buffer.from((input.event || 'generic') + ':' + policy.maxWords).toString('hex').slice(0, 8)}`;

  return { text: cleaned, ...evalRes, cache: { hit: false, key: cacheKey }, meta: policy.meta };
}
