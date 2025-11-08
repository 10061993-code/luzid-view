// packages/content-engine/routes/content.mjs
// v2 — belt & suspenders: enforce applyPolicy at the HTTP edge

import express from "express";
import { z } from "zod";
import { runPipeline } from "../pipeline.mjs";
import { applyPolicy } from "../lib/promptPolicy.mjs";
import { fetchCreatorStyle } from "../services/creators.mjs";

export const router = express.Router();

const PayloadSchema = z.object({
  creator: z.string().min(1),
  week: z.string().optional(),
  event: z.string().min(1),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  age: z.number().int().min(10).max(100).optional(),
  type: z.enum(["weekly", "micro"]).optional().default("weekly"),
});

router.post("/api/content/:type", async (req, res) => {
  try {
    // 1) Payload + :type
    const type = String(req.params.type || "weekly");
    const base = Object.assign({}, req.body || {}, { type });
    const payload = PayloadSchema.parse(base);

    // 2) Pipeline
    const result = await runPipeline(payload);

    // 3) Extra-hardening (edge): applyPolicy again on the returned text
    //    (covers any forgotten branch upstream)
    let creatorRecord = null;
    try {
      creatorRecord = await fetchCreatorStyle(payload.creator);
    } catch (_) {
      creatorRecord = { handle: payload.creator, style: {} };
    }
    const creatorHandle =
      payload.creator ||
      creatorRecord?.handle ||
      creatorRecord?.style?.creator ||
      "lena";
    const style =
      (creatorRecord && creatorRecord.style) ? creatorRecord.style : (creatorRecord || {});

    const sanitizedText = applyPolicy(String(result.text ?? ""), {
      creatorHandle,
      style,
    });

    // 4) Antwort
    res.json({
      text: sanitizedText,
      score: result.score ?? null,
      criteria: result.criteria ?? [],
      meta: {
        ...(result.meta || {}),
        route_policy_edge: true,
        policy_version: "v3.6",
      },
      latency_ms: result.latency_ms ?? null,
    });
  } catch (err) {
    console.error("[content] error:", err);
    res.status(400).json({
      error: "bad_request",
      detail: err?.message || String(err),
    });
  }
});

