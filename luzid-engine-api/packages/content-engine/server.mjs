import express from "express";
import { router as generateDrop } from "../routes/generate_drop.mjs";

const app = express();

app.get("/healthz", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// API-Routen
app.use("/api", generateDrop);

// Fallback für unbekannte Routen (optional)
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`server listening on :${PORT}`));
