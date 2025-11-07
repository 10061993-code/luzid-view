// routes/generate_drop.mjs
import express from "express";
export const router = express.Router();

import { runContentPipeline } from "../pipeline.mjs";
import { callAzure } from "../services/azure.mjs";
import { insertWeekly } from "../services/supabase.mjs"; // ← Supabase-Helper

// -------- Cache + RateLimit (einfach, in-memory) --------
const memCache = new Map();
const cache = {
  async get(k) { return memCache.get(k); },
  async set(k, v, ttlSec = 3600) {
    memCache.set(k, v);
    setTimeout(() => memCache.delete(k), ttlSec * 1000);
  },
};

const rateCounters = new Map();
async function rateLimit(key, max = 120, windowMs = 60_000) {
  const now = Date.now();
  const bucket = rateCounters.get(key) || [];
  while (bucket.length && bucket[0] <= now - windowMs) bucket.shift();
  bucket.push(now);
  rateCounters.set(key, bucket);
  if (bucket.length > max) {
    const e = new Error("rate_limited");
    e.status = 429;
    throw e;
  }
}

// -------- Supabase: Weekly-Archiv (aktiv nur mit ENV) --------
async function putWeeklyArchive(record) {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE) {
      await insertWeekly(record);
      console.log("[weekly_archive] stored", {
        creator: record.creator,
        len: record.text?.length ?? 0,
        score: record.score ?? null,
        phase: record?.meta?.phase ?? null,
      });
    } else {
      console.log("[weekly_archive] skipped (no supabase config)", {
        creator: record.creator,
        len: record.text?.length ?? 0,
      });
    }
  } catch (e) {
    console.warn("[weekly_archive] failed:", e?.message ?? e);
  }
}

// -------- Endpoint: /api/generate/drop --------
router.post("/generate/drop", async (req, res) => {
  const started = Date.now();
  try {
    const payload = req.body ?? {};
    if (!payload.creator) {
      return res.status(400).json({ error: "bad_request", message: "creator fehlt" });
    }

    const services = {
      // Modellaufruf via Azure-Proxy
      callModel: async (messages, options) => {
        const azureRes = await callAzure({ messages, ...options });
        return { text: azureRes.text, usage: azureRes.usage, raw: azureRes.raw };
      },
      cache,
      rateLimit,
      putWeeklyArchive,       // ← hier wird bei type==="weekly" persistiert
      now: Date.now,
    };

    const out = await runContentPipeline(payload, services);
    const latency = Date.now() - started;

    return res.status(200).json({ ...out, latency_ms: latency });
  } catch (err) {
    const status = err?.status ?? 500;
    return res.status(status).json({
      error: "generate_failed",
      message: String(err?.message ?? err),
    });
  }
});

