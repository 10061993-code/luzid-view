// luzid-engine-api/server.mjs
// Root backend server (port 8787). Hotfix: enforce promptPolicy at the HTTP edge
// for ANY response under /api/content/*, without touching legacy handlers.

import express from "express";
import cors from "cors";

// ⬇️ Policy + Creator-Style Loader aus content-engine
import { applyPolicy } from "./packages/content-engine/lib/promptPolicy.mjs";
import { fetchCreatorStyle } from "./packages/content-engine/services/creators.mjs";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/**
 * Edge-Policy-Middleware:
 * - Gilt für ALLE Routen unter /api/content/*
 * - Wrappt res.json, sanitizt { text } mit applyPolicy (Creator aus req.body/meta)
 * - Funktioniert auch, wenn alte Handler direkt res.json(...) aufrufen
 */
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/content/")) return next();

  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      // Body kann Objekt, String, etc. sein
      const payload = req?.body || {};
      const rawText =
        (body && typeof body === "object" && "text" in body && body.text) ||
        (typeof body === "string" ? body : "");

      if (typeof rawText === "string" && rawText.trim().length > 0) {
        // Creator-Handle bestimmen (aus Payload oder meta)
        const creatorHandle =
          payload?.creator ||
          (body?.meta && (body.meta.creator || body.meta?.style?.creator)) ||
          "lena";

        // Style laden (best effort; fällt auf leeres Objekt zurück)
        let style = {};
        try {
          const rec = await fetchCreatorStyle(creatorHandle);
          style = (rec && rec.style) || {};
        } catch {
          style = {};
        }

        const sanitizedText = applyPolicy(String(rawText), {
          creatorHandle,
          style,
        });

        // Meta anreichern
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
            : { text: sanitizedText, meta: { route_policy_edge: true, policy_version: "v3.6" } };

        return originalJson(enriched);
      }
    } catch (e) {
      // Bei Problemen unverändert weiterreichen, damit nix blockiert
      // (Optional: console.error("[edge-policy]", e))
    }
    return originalJson(body);
  };

  next();
});

// Bestehender Health-Endpunkt beibehalten (Monitoring verlässt sich darauf)
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, env: "backend", port: process.env.PORT ?? "8787" });
});

// Optional: einfache Diagnose, ob Policy greift
app.get("/whoami", (_req, res) => {
  const sample = "Dummy. Schreibe heute etwas auf.";
  const sanitized = applyPolicy(sample, { creatorHandle: "lena", style: {} });
  res.json({
    service: "backend-root",
    policy_version_probe: "v3.6",
    sanitized_contains_canonical_cta: /Notiere dir heute einen einzigen, leichten Schritt\./.test(
      sanitized
    ),
    sanitized,
  });
});

// (Bestehende Legacy-/Feature-Routen bleiben unverändert gemountet,
// da wir nur am Response-Edge für /api/content/* intercepten.)

// Globaler Fehler-Handler
app.use((err, _req, res, _next) => {
  console.error("unhandled:", err);
  res.status(500).json({ error: "internal_error", detail: String(err?.message || err) });
});

// Start
const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[root-backend] listening on :${port} (edge policy active for /api/content/*)`);
});

