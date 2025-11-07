import express from "express";
import { runPipeline } from "../pipeline.mjs";
import { rateLimit } from "../lib/ratelimit.mjs";

export const router = express.Router();

router.post("/generate/drop", express.json(), async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()
      || req.socket.remoteAddress || "ip:unknown";
    const rl = rateLimit(`drop:${ip}`, { capacity: 30, refill: 30, windowMs: 60_000 });
    if (!rl.ok) return res.status(429).json({ error: "rate_limited", retryAfterMs: rl.retryAfterMs });

    const { event, creator, tone, length, audience, persona, type, user, week } = req.body || {};
    const result = await runPipeline({ event, creator, tone, length, audience, persona, type, user, week }, { ip });
    res.status(200).json(result);
  } catch (err) {
    console.error("[/generate/drop] error:", err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});
