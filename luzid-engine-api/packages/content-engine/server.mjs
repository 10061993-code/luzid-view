import express from "express";
import { router as generateDrop } from "./routes/generate_drop.mjs";
import { router as metricsRouter } from "./routes/metrics.mjs";

const app = express();

app.get("/healthz", (req, res) => {
  res.json({ ok: true, ts: Date.now(), server: "content-engine" });
});

app.use("/api", generateDrop);
app.use("/api", metricsRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`server listening on :${PORT}`));
