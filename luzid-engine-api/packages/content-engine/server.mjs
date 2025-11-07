import express from "express";
import { router as generateDrop } from "./routes/generate_drop.mjs";
import { router as metricsRouter } from "./routes/metrics.mjs";
import { router as previewRouter } from "./routes/preview.mjs";

const app = express();

app.get("/healthz", (req, res) => {
  res.json({ ok: true, env: "backend", port: String(process.env.PORT || 8787) });
});

app.use("/api", generateDrop);
app.use("/api", previewRouter);
app.use("/api", metricsRouter);

app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.path }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`server listening on :${PORT}`));
