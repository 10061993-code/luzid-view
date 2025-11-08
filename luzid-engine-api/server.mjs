// luzid-engine-api/server.mjs
// Root backend server (port 8787). Hotfix: erzwinge promptPolicy am HTTP-Rand
// für ALLE Antworten unter /api/content/* — unabhängig davon, welcher Legacy-Handler läuft.

import express from "express";
import cors from "cors";

// Policy + Creator-Style Loader aus content-engine
import { applyPolicy } from "./packages/content-engine/lib/promptPolicy.mjs";
import { fetchCreatorStyle } from "./packages/content-engine/services/creators.mjs";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/**
 * EDGE-POLICY-MIDDLEWARE
 * - Gilt für alle Routen unter /api/content/*
 * - Wrappt res.json und sanitized {text} mit applyPolicy, bevor die Antwort rausgeht.
 * - Greift auch dann, wenn ein alter Handler direkt res.json(body) aufruft.
 */
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/content/")) return next();

  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      const rawText =
        (body && typeof body === "object" && "text" in body && body.text) ||
        (typeof body === "string" ? body : "");

      if (typeof rawText === "string" && rawText.trim().length > 0) {
        // Creator ermitteln (Payload bevorzugt; sonst meta; Fallback lena)
        const creatorHandle =
          (req.body && req.body.creator) ||
          (body && typeof body === "object" && body.meta && (body.meta.creator || body.meta?.style?.creator)) ||
          "lena";

        // Style best effort laden
        let style = {};
        try {
          const rec = await fetchCreatorStyle(creatorHandle);
          style = (rec && rec.style) || {};
        } catch { /* ignore */ }

        const sanitizedText = applyPolicy(String(rawText), { creatorHandle, style });

        const enriched =
          body && typeof body === "object"
            ? {
                ...body,
                text: sanitizedText,
                meta: {
                  ...(body.meta || {}),
                  route_policy_edge: true,
                  policy_version: "v3.6",
                },
              }
            : {
                text: sanitizedText,
                meta: { route_policy_edge: true, policy_version: "v3.6" },
              };

        return originalJson(enriched);
      }
    } catch (e) {
      // Fallback: falls Sanitizing fehlschlägt, unverändertes body zurückgeben
    }
    return originalJson(body);
  };

  next();
});

// Bestehender Health-Endpunkt (nicht anfassen – Monitoring)
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, env: "backend", port: process.env.PORT ?? "8787" });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[root-backend] listening on :${port} (edge policy active for /api/content/*)`);
});

