// packages/content-engine/pipeline.mjs

import crypto from "node:crypto";

import { applyPolicy } from "./lib/promptPolicy.mjs";
import { generateChat } from "./lib/model_client.mjs";
import { sanitizeText } from "./lib/sanitize.mjs";
import { evaluateOutput } from "./lib/evaluate.mjs";
import { cacheOnce } from "./lib/cache.mjs";
import { metricsIncRequest, metricsIncError, metricsRecord } from "./lib/metrics.mjs";
import { buildWeeklyContext } from "./adapters/weekly_adapter.mjs";
import { buildSystem, buildUser } from "./lib/prompt_builder.mjs";

/** Fallback-Hash für beliebige Objekte (stabil, kurz) */
function sha1(obj) {
  const s = JSON.stringify(obj || {});
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
}

/** einfacher 32-bit Hash (nur falls gebraucht) */
function keyOf(obj) {
  const s = JSON.stringify(obj || {});
  let h = 0 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

export async function runPipeline(input = {}, meta = {}) {
  metricsIncRequest();
  const t0 = (globalThis.performance?.now?.() ?? Date.now());

  const isWeekly = String(input?.type || "").toLowerCase() === "weekly";

  // Policy kann je nach implementierter promptPolicy minimal/erweitert sein.
  // Wir schützen alle Zugriffe defensiv.
  const policy = (() => {
    try {
      const p = applyPolicy(input) || {};
      return {
        system: p.system || "",
        instructions: p.instructions || "",
        maxWords: typeof p.maxWords === "number" ? p.maxWords : 180,
        meta: p.meta || {},
      };
    } catch {
      return { system: "", instructions: "", maxWords: 180, meta: {} };
    }
  })();

  let system, user, provider;

  try {
    if (isWeekly) {
      // Baut Wochenkontext inkl. Creator-Style, Phase, Transits, CTA, etc.
      const ctx = await buildWeeklyContext(input);

      // System-Prompt: Ton / Register ggf. aus Style ableiten, sonst freundlich+klar
      system = buildSystem({
        tone: ctx?.style?.tone || "freundlich, klar",
        register: ctx?.style?.register || "du",
        // Falls die Policy ein eigenes System vorschlägt, mischen wir dieses sanft rein
        policySystem: policy.system,
      });

      // User-Prompt: Kontext + Policy-Instruktionen + kontextspezifische Instruktionen
      const mergedInstructions = [policy.instructions, ctx?.instructions]
        .filter(Boolean)
        .join("\n\n");

      user = buildUser({
        greeting: ctx?.style?.greeting,
        phase: ctx?.phase,
        context: { ...(ctx?.context || {}), persona: input?.persona || "" },
        transits: ctx?.transits,
        cta: ctx?.cta,
        closing: ctx?.closing,
        instructions: mergedInstructions,
      });

      // Providerwahl
      provider =
        (process.env.ENGINE_PROVIDER || "").toLowerCase() ||
        (process.env.AZURE_OPENAI_API_KEY ? "azure" : "openai");

      // Model-Call
      const textRaw = await generateChat({
        system,
        user,
        temperature: 0.65,
        max_tokens: Number(process.env.OPENAI_MAX_TOKENS || 600),
      });

      // Post-Processing
      const cleaned = sanitizeText(textRaw, { maxChars: 1400 });
      const evalRes = evaluateOutput(cleaned, { maxWords: policy.maxWords });

      // Latenz & Metrics
      const t1 = (globalThis.performance?.now?.() ?? Date.now());
      const latency_ms = Math.round(t1 - t0);
      metricsRecord(provider, true, latency_ms);

      // **Robuster Cache-Key**: creator + week + style-Hash + inhaltliche Eckdaten
      const styleHash = sha1(ctx?.style);
      const onceKey = `once:${(ctx?.creator || input?.creator || "unknown")
        .toString()
        .toLowerCase()}:${(ctx?.week || input?.week || "unknown")}:${styleHash}:${sha1({
        type: input?.type || "weekly",
        event: input?.event || "",
        length: input?.length || "medium",
      })}`;
      const once = cacheOnce(onceKey);

      // Meta minimal konsistent halten
      const metaOut = {
        creator: ctx?.creator || input?.creator || policy?.meta?.creator || "",
        length: input?.length || "medium",
        week: ctx?.week || input?.week || "",
      };

      return {
        text: cleaned,
        ...evalRes,
        cache: { hit: once.hit, key: once.key },
        meta: metaOut,
        latency_ms,
      };
    }

    // --- Non-weekly Fallback (z. B. "drop" / allgemeiner Impuls) ---

    system = policy.system
      ? buildSystem({ policySystem: policy.system })
      : buildSystem({ tone: "freundlich, klar", register: "du" });

    // Minimaler User-Prompt
    user =
      "Aufgabe: Erzeuge einen kurzen, umsetzbaren Astro-Impuls.\n\n" +
      (policy.instructions || "");

    provider =
      (process.env.ENGINE_PROVIDER || "").toLowerCase() ||
      (process.env.AZURE_OPENAI_API_KEY ? "azure" : "openai");

    const textRaw = await generateChat({
      system,
      user,
      temperature: 0.65,
      max_tokens: Number(process.env.OPENAI_MAX_TOKENS || 600),
    });

    const cleaned = sanitizeText(textRaw, { maxChars: 1400 });
    const evalRes = evaluateOutput(cleaned, { maxWords: policy.maxWords });

    const t1 = (globalThis.performance?.now?.() ?? Date.now());
    const latency_ms = Math.round(t1 - t0);
    metricsRecord(provider, true, latency_ms);

    const onceKey = `once:${(policy?.meta?.creator || input?.creator || "anon")
      .toString()
      .toLowerCase()}:${sha1({
      type: input?.type || "drop",
      event: input?.event || "",
      length: input?.length || "short",
    })}`;
    const once = cacheOnce(onceKey);

    const metaOut = {
      creator: policy?.meta?.creator || input?.creator || "",
      length: input?.length || "short",
    };

    return {
      text: cleaned,
      ...evalRes,
      cache: { hit: once.hit, key: once.key },
      meta: metaOut,
      latency_ms,
    };
  } catch (err) {
    const t1 = (globalThis.performance?.now?.() ?? Date.now());
    const latency_ms = Math.round(t1 - t0);
    metricsIncError();
    metricsRecord(provider || "unknown", false, latency_ms);
    // Fehler durchreichen, damit Route korrekt 5xx liefern kann
    throw err;
  }
}

