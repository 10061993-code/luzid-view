import express from "express";
import { router as generateDrop } from "./packages/content-engine/routes/generate_drop.mjs";

const app = express();

// Healthcheck
app.get("/healthz", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// API-Routen
app.use("/api", generateDrop);

// 404-Fallback
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`server listening on :${PORT}`));
