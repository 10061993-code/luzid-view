import express from "express";
import { runPipeline } from "../pipeline.mjs";
export const router = express.Router();

router.get("/preview", async (req, res) => {
  try {
    const { type="weekly", creator="lena", event="new_moon", week, audience, persona, length="medium" } = req.query;
    const result = await runPipeline({
      type, creator, event, week,
      audience, persona, length
    }, { preview:true });
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: String(e?.message||e) });
  }
});
