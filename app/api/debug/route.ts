// app/api/debug/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const backend = process.env.BACKEND_URL || null;
  const url = new URL(req.url);

  let upstreamStatus: number | null = null;
  let upstreamBody: string | null = null;

  if (backend) {
    try {
      const r = await fetch(`${backend}/style-options/lena`, { cache: "no-store" });
      upstreamStatus = r.status;
      const txt = await r.text();
      upstreamBody = txt.slice(0, 200); // nur ein Snippet zurückgeben
    } catch (e: any) {
      upstreamBody = `fetch error: ${e?.message ?? String(e)}`;
    }
  }

  return NextResponse.json({
    pathname: url.pathname,
    backend,
    upstreamStatus,
    upstreamBody,
  });
}

