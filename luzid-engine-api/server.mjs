// luzid-engine-api/server.mjs
// Root backend (port 8787) — definitive /api/content/:type Implementierung.
// Garantiert: Pipeline + promptPolicy vor jeder Response. Kein Legacy-Fallthrough.

import express from "express";
import cors from "cors";
import { z } from "zod";

import { runPipeline } from "./packages/content-engine/pipeline.mjs";
import { applyPolicy } from "./packages/content-engine/lib/promptPolicy.mjs";
import { fetchCreatorStyle } from "./packages/content-engine/services/creators.mjs";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health (bestehend lassen für Monitoring)
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, env: "backend", port: process.env.PORT ?? "8787" });
});

// ===== Definitive Weekly/Micro-Route (überschreibt jegliche Legacy-Handler) =====
const PayloadSchema = z.object({
  creator: z.string().min(1),
  week: z.string().optional(),
  event: z.string().min(1),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  age: z.number().int().min(10).max(100).optional(),
  type: z.enum(["weekly", "micro"]).optional().default("weekly")
});

app.post("/api/content/:type", async (req, res) => {
  try {
    const type = String(req.params.type || "weekly");
    const base = { ...(req.body || {}), type };
    const payload = PayloadSchema.parse(base);

    // 1) Pipeline (LLM-Aufruf, Prompts, Flags, etc.)
    const result = await runPipeline(payload); // { text, score, criteria, meta, latency_ms }

    // 2) Creator-Style für Policy laden (Best Effort)
    let rec = null;
    try { rec = await fetchCreatorStyle(payload.creator); }
    catch { rec = { handle: payload.creator, style: {} }; }

    const creatorHandle =
      payload.creator || rec?.handle || rec?.style?.creator || "lena";
    const style = (rec && rec.style) ? rec.style : (rec || {});

    // 3) Policy anwenden (CTA dedupe + striktes Closing)
    const sanitizedText = applyPolicy(String(result.text || ""), { creatorHandle, style });

    // 4) Antwort mit Policy-Meta
    res.json({
      text: sanitizedText,
      score: result?.score ?? null,
      criteria: result?.criteria ?? [],
      cache: result?.cache ?? undefined,
      meta: {
        ...(result?.meta || {}),
        type: payload.type,
        creator: creatorHandle,
        policy_version: "v3.6",
        route_policy_edge: true
      },
      latency_ms: result?.latency_ms ?? null
    });
  } catch (err) {
    console.error("[/api/content/:type] error:", err);
    res.status(400).json({ error: "bad_request", detail: err?.message || String(err) });
  }
});

// Globaler Fehler-Handler
app.use((err, _req, res, _next) => {
  console.error("unhandled:", err);
  res.status(500).json({ error: "internal_error", detail: String(err?.message || err) });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[root-backend] listening on :${port} (own /api/content/:type handler active)`);
});

