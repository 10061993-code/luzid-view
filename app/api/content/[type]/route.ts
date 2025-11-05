import { NextRequest, NextResponse } from "next/server";

type ContentPayload = {
  event: string;
  creator: string;
  tone: string;
  length: "short" | "medium" | "long";
  focus?: string;
  birth?: { name?: string; city?: string; date?: string; time?: string; unknown_time?: boolean };
  age?: number;
  quick?: Record<string, unknown>;
};

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  const { type } = await ctx.params; // z.B. "drop"
  if (!type) return badRequest("type fehlt.");

  let payload: ContentPayload;
  try {
    const json = (await req.json()) as unknown;
    if (!json || typeof json !== "object") return badRequest("Ungültiges JSON.");
    payload = json as ContentPayload;
  } catch {
    return badRequest("Ungültiges JSON.");
  }

  const { event, creator, tone, length } = payload;
  if (!event || !creator || !tone || !length) {
    return badRequest("event, creator, tone, length sind Pflichtfelder.");
  }

  return NextResponse.json({ ok: true, type, payload }, { status: 200 });
}

