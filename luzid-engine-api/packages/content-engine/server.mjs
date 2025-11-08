// packages/content-engine/server.mjs
import express from "express";
import cors from "cors";
import { router as contentRouter } from "./routes/content.mjs";
import { router as healthRouter } from "./routes/health.mjs";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health + WhoAmI
app.use(healthRouter);

// Content routes: /api/content/:type (weekly|micro)
app.use(contentRouter);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("unhandled:", err);
  res.status(500).json({ error: "internal_error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[content-engine] listening on :${port}`);
});

