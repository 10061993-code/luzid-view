// packages/content-engine/server.mjs
// v3 — mounts health & content routes, enforces policy at HTTP edge

import express from "express";
import cors from "cors";
import { router as contentRouter } from "./routes/content.mjs";
import { router as healthRouter } from "./routes/health.mjs";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- Routes ---
app.use(healthRouter);   // /healthz  +  /whoami
app.use(contentRouter);  // /api/content/:type  (weekly|micro)

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error("unhandled error:", err);
  res.status(500).json({ error: "internal_error", detail: String(err?.message || err) });
});

// --- Start server ---
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[content-engine] listening on :${port}`);
});

