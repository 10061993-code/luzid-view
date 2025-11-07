// server.mjs
// Express-Server (ESM) – Railway-kompatibel, mit /healthz und robustem ENV-Load

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dotenv optional laden (lokal). In Railway kommen ENVs aus Service-Settings.
try {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  dotenv.config({ path: path.resolve(__dirname, ".env") });
} catch {
  console.log("ℹ️  dotenv nicht gefunden – ENV kommt von Railway.");
}

import express from "express";
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// morgan optional dynamisch laden
try {
  const { default: morgan } = await import("morgan");
  app.use(morgan("tiny"));
} catch { /* optional */ }

// --- Router importieren ---
import { router as proxyRouter } from "./routes/model_proxy.mjs";
import { router as metricsRouter } from "./routes/metrics.mjs";
import { router as healthApiRouter } from "./routes/health.mjs";
import { router as generateDropRouter } from "./routes/generate_drop.mjs";

// --- API-Routen registrieren (vor 404!) ---
app.use("/api", proxyRouter);
app.use("/api", metricsRouter);
app.use("/api", healthApiRouter);
app.use("/api", generateDropRouter);

// zusätzlicher Health-Endpunkt für Railway (/healthz)
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, checks: [{ name: "app", ok: true }], via: "healthz" });
});

// 404-Fallback NACH den Routern
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found", path: _req.path });
});

// Root-Check
app.get("/", (_req, res) => {
  res.type("text/plain").send("LUZID Engine up");
});

// Fehlerbehandlung
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "internal_error" });
});

// Start
const server = app.listen(PORT, () => {
  console.log(`✅ LUZID Engine (content-engine) listening on ${PORT}`);
  console.log("ENV check:", {
    endpoint: Boolean(process.env.AZURE_OPENAI_ENDPOINT),
    apiKeySet: Boolean(process.env.AZURE_OPENAI_API_KEY),
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "<missing>",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || "<missing>",
    genApiKeySet: Boolean(process.env.GEN_API_KEY),
  });
});

// Graceful shutdown
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT",  () => server.close(() => process.exit(0)));

