// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { getLengthBudget } from "../../../lib/contentPresets";
import type { GeneratorPayload } from "../../../lib/types";

export const runtime = "nodejs";       // für sicheren Zugriff auf env
export const dynamic = "force-dynamic"; // keine Build-Time-Caches

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export async function POST(req: Request) {
  // --- 1) ENV prüfen
  const GEN_API_URL = process.env.GEN_API_URL;
  const GEN_API_KEY = process.env.GEN_API_KEY;
  if (!GEN_API_URL || !GEN_API_KEY) {
    return NextResponse.json(
      {
        error: "Generator nicht konfiguriert",
        hint: "Setze GEN_API_URL und GEN_API_KEY (z. B. in .env.local oder Vercel Env).",
      },
      { status: 503 }
    );
  }

  // --- 2) Payload lesen & minimal validieren
  let payload: GeneratorPayload;
  try {
    payload = (await req.json()) as GeneratorPayload;
  } catch {
    return badRequest("Ungültiges JSON im Request-Body.");
  }

  if (payload?.type !== "drop") return badRequest("type muss 'drop' sein.");
  if (!payload.event) return badRequest("event fehlt.");
  if (!payload.creator) return badRequest("creator fehlt.");
  if (!payload.tone) return badRequest("tone fehlt.");
  if (!payload.length) return badRequest("length fehlt.");

  // --- 3) Länge → Budget ableiten
  const budget = getLengthBudget(payload.length); // { words: [min,max], maxTokens, label }

  // --- 4) Clean Body für den Generator bauen (Theme bleibt Frontend-only)
  const generatorBody = {
    type: "drop",
    event: payload.event,
    creator: payload.creator,
    tone: payload.tone,
    target_words: budget.words,
    max_tokens: budget.maxTokens,
    focus: payload.focus,
    birth: payload.birth,
  };

  // --- 5) Upstream-Call (mit Timeout & sauberem Error-Handling)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 25_000); // 25s Timeout

  try {
    const res = await fetch(GEN_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${GEN_API_KEY}`,
      },
      body: JSON.stringify(generatorBody),
      signal: controller.signal,
      // keepalive: true  // optional
    });

    clearTimeout(id);

    // Upstream-Fehler → durchreichen
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Generator-Fehler", status: res.status, upstream: text?.slice(0, 600) },
        { status: 502 }
      );
    }

    // Erfolgsfall
    const data = (await res.json().catch(() => ({}))) as { text?: string; [k: string]: unknown };
    return NextResponse.json({ text: data?.text ?? "" }, { status: 200 });
  } catch (err: any) {
    clearTimeout(id);
    const aborted = err?.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "Generator-Timeout" : "Generator nicht erreichbar", details: String(err?.message || err) },
      { status: aborted ? 504 : 502 }
    );
  }
}

