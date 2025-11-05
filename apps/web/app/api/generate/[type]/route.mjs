import { NextResponse } from "next/server";
import { generateDrop } from "@luzid/content-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message, details) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export async function POST(req, { params }) {
  const { type } = await params;
  if (type !== "drop") return badRequest("Nur /generate/drop wird aktuell unterstützt.");

  let payload;
  try { payload = await req.json(); } catch { return badRequest("Ungültiges JSON."); }

  const { event, creator, tone, length, focus, birth, age, quick } = payload ?? {};
  if (!event || !creator || !tone || !length) return badRequest("event, creator, tone, length sind Pflicht.");

  const out = await generateDrop({ type: "drop", event, creator, tone, length, focus, birth, age, quick });
  return NextResponse.json({ text: out.text, score: out.score ?? null, cache: out.cache ?? null }, { status: 200 });
}

