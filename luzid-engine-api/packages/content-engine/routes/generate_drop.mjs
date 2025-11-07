------------------------------------------------------------
import express from "express";
import { runPipeline } from "../pipeline.mjs";

export const router = express.Router();

router.post("/generate/drop", express.json(), async (req, res) => {
  try {
    const { event, creator, tone, length, audience, persona } = req.body || {};
    const result = await runPipeline({ event, creator, tone, length, audience, persona });
    res.status(200).json(result);
  } catch (err) {
    console.error("[/generate/drop] error:", err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});
------------------------------------------------------------

