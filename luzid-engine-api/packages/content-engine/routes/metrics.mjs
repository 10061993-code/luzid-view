import express from "express";
import { getMetrics } from "../lib/metrics.mjs";
export const router = express.Router();

router.get("/metrics", (_req, res) => {
  res.status(200).json(getMetrics());
});
