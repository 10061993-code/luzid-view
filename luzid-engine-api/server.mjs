// luzid-engine-api/server.mjs
// Root backend (port 8787). Edge-Hotfix:
//  - Erzwinge promptPolicy für ALLE Antworten unter /api/content/*
//    (wrappt res.json UND res.send, damit Legacy-Handler egal sind)
//  - /whoami als Diagnoseroute

import express from "express";
import cors from "cors";
import { applyPolicy } from "./packages/content-engine/lib/promptPolicy.mjs";
import { fetchCreatorStyle } from "./packages/content-engine/services/creators.mjs";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/** Helper: Text sanitisieren + Meta anreichern */
async function sanitizeOutgoing(body, req) {
  // Text extrahieren
  const rawText =
    (body && typeof body === "object" && "text" in body && body.text) ||
    (typeof body === "string" ? body : "");

  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    return body; // nichts zu tun
  }

  // Creator ermitteln
  const creatorHandle =
    (req.body && req.body.creator) ||
    (body?.meta && (body.meta.creator || body.meta?.style?.creator)) ||
    "lena";

  // Style laden (best effort)
  let style = {};
  try {
    const rec = await fetchCreatorStyle(creatorHandle);
    style = (rec && rec.style) || {};
  } catch {
    style = {};
  }

  // Policy anwenden
  const sanitizedText = applyPolicy(String(rawText), { creatorHandle, style });

  // Meta setzen
  const metaPatch = { route_policy_edge: true, policy_version: "v3.6" };

  if (body && typeof body === "object") {
    return {
      ...body,
      text: sanitizedText,
      meta: { ...(body.meta || {}), ...metaPatch },
    };
  }
  // falls Handler reinen String sendet
  return JSON.stringify({ text: sanitizedText, meta: metaPatch });
}

/** EDGE-POLICY-MIDDLEWARE für /api/content/* */
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/content/")) return next();

  // Wrap res.json
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      const enriched = await sanitizeOutgoing(body, req);
      return originalJson(enriched);
    } catch {
      return originalJson(body);
    }
  };

  // Wrap res.send (falls Legacy-Handler send() nutzt)
  const originalSend = res.send.bind(res);
  res.send = async (body) => {
    try {
      const maybeObj =
        typeof body === "string"
          ? (() => {
              try { return JSON.parse(body); } catch { return body; }
            })()
          : body;
      const enriched = await sanitizeOutgoing(maybeObj, req);
      return originalSend(
        typeof enriched === "string" ? enriched : JSON.stringify(enriched)
      );
    } catch {
      return originalSend(body);
    }
  };

  next();
});

/** Bestehender Health (nicht verändern) */
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, env: "backend", port: process.env.PORT ?? "8787" });
});

/** Diagnose: zeigt, dass Policy greift */
app.get("/whoami", (_req, res) => {
  const sanitized = applyPolicy("Dummy. Schreibe heute etwas auf.", {
    creatorHandle: "lena",
    style: {},
  });
  res.json({
    service: "backend-root",
    policy_version_probe: "v3.6",
    sanitized_contains_canonical_cta: /Notiere dir heute einen einzigen, leichten Schritt\./.test(
      sanitized
    ),
    sanitized,
  });
});

/** Globaler Fehler-Handler */
app.use((err, _req, res, _next) => {
  console.error("unhandled:", err);
  res.status(500).json({ error: "internal_error", detail: String(err?.message || err) });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[root-backend] listening on :${port} (edge policy active for /api/content/*)`);
});

