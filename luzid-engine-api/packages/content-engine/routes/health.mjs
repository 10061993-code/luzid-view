// packages/content-engine/routes/health.mjs
import express from "express";
import { applyPolicy } from "../lib/promptPolicy.mjs";

export const router = express.Router();

// simple health
router.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, service: "content-engine", ts: Date.now() });
});

// whoami — zeigt, ob Policy greift (Edge-Test)
router.get("/whoami", (_req, res) => {
  const sample = "Beispieltext. Schreibe heute etwas auf.";
  const sanitized = applyPolicy(sample, { creatorHandle: "lena", style: {} });
  res.json({
    service: "content-engine",
    policy_version_probe: "v3.6",
    sanitized_contains_canonical_cta: /Notiere dir heute einen einzigen, leichten Schritt\./.test(
      sanitized
    ),
    sanitized,
  });
});

