// luzid-engine-api/server.mjs
import express from "express";
import cors from "cors";
import { applyPolicy } from "./packages/content-engine/lib/promptPolicy.mjs";
import { fetchCreatorStyle } from "./packages/content-engine/services/creators.mjs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

async function sanitizeOutgoing(body, req) {
  const rawText =
    (body && typeof body === "object" && "text" in body && body.text) ||
    (typeof body === "string" ? body : "");
  if (typeof rawText !== "string" || rawText.trim().length === 0) return body;

  const creatorHandle =
    (req.body && req.body.creator) ||
    (body?.meta && (body.meta.creator || body.meta?.style?.creator)) ||
    "lena";

  let style = {};
  try { const rec = await fetchCreatorStyle(creatorHandle); style = rec?.style || {}; } catch {}
  const sanitizedText = applyPolicy(String(rawText), { creatorHandle, style });
  const metaPatch = { route_policy_edge: true, policy_version: "v3.6" };

  if (body && typeof body === "object") {
    return { ...body, text: sanitizedText, meta: { ...(body.meta || {}), ...metaPatch } };
  }
  return JSON.stringify({ text: sanitizedText, meta: metaPatch });
}

// Edge-Policy für ALLE /api/content/* Antworten (res.json + res.send)
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/content/")) return next();
  const j = res.json.bind(res), s = res.send.bind(res);
  res.json = async (b) => { try { return j(await sanitizeOutgoing(b, req)); } catch { return j(b); } };
  res.send = async (b) => {
    try {
      const maybeObj = typeof b === "string" ? (()=>{try{return JSON.parse(b);}catch{return b;}})() : b;
      const out = await sanitizeOutgoing(maybeObj, req);
      return s(typeof out === "string" ? out : JSON.stringify(out));
    } catch { return s(b); }
  };
  next();
});

// Health (bestehend)
app.get("/healthz", (_req, res) => res.json({ ok: true, env: "backend", port: process.env.PORT ?? "8787" }));

// Optional Diagnose
app.get("/whoami", (_req, res) => {
  const sanitized = applyPolicy("Dummy. Schreibe heute etwas auf.", { creatorHandle: "lena", style: {} });
  res.json({ service: "backend-root", policy_version_probe: "v3.6",
    sanitized_contains_canonical_cta: /Notiere dir heute einen einzigen, leichten Schritt\./.test(sanitized),
    sanitized });
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`[root-backend] :${port} edge policy active`));

