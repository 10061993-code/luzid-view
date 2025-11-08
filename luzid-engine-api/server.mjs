// luzid-engine-api/server.mjs
// Hotfix: mount content-engine routes (with policy) into the existing backend server

import express from "express";
import cors from "cors";

// ⬇️ Content-Engine Router (mit Edge-Policy & /whoami)
import { router as contentRouter } from "./packages/content-engine/routes/content.mjs";
import { router as healthRouter } from "./packages/content-engine/routes/health.mjs";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Bestehender Health-Endpunkt (beibehalten, falls andere Tools darauf prüfen)
app.get("/healthz", (_req, res) => {
  // Lass die alte Signatur stehen, damit Monitoring nicht bricht:
  res.json({ ok: true, env: "backend", port: process.env.PORT ?? "8787" });
});

// Diagnose-Endpunkte der Content-Engine
app.use(healthRouter); // /whoami + alternative /healthz (liefert service:"content-engine")

// Content-Engine API (Weekly/Micro) mit Policy am HTTP-Rand
app.use(contentRouter);

// Fallback/Fehler
app.use((err, _req, res, _next) => {
  console.error("unhandled:", err);
  res.status(500).json({ error: "internal_error", detail: String(err?.message || err) });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[root-backend] listening on :${port} (mounts content-engine routes)`);
});

