import express from "express";
import { router as generateDrop } from "./routes/generate_drop.mjs";
import { router as metricsRouter } from "./routes/metrics.mjs";

const app = express();

app.get("/healthz", (req, res) => {
  res.json({ ok: true, env: "backend", port: String(process.env.PORT || 8787) });
});

// DEBUG: Log nach Mounts
app.use("/api", (req, _res, next) => { console.log("[mount] /api pre"); next(); });
app.use("/api", generateDrop);
app.use("/api", metricsRouter);
app.use("/api", (req, _res, next) => { console.log("[mount] /api post ->", req.method, req.path); next(); });

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.path }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`server listening on :${PORT}`));
