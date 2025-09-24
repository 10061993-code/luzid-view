// app/api/style-options/[slug]/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const backend = process.env.BACKEND_URL || "http://localhost:8787";

export async function GET(req: Request) {
  try {
    const slug = decodeURIComponent(new URL(req.url).pathname.split("/").pop() || "");
    if (!slug) return NextResponse.json({ error: true, message: "Missing slug" }, { status: 400 });

    const res = await fetch(`${backend}/style-options/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const text = await res.text();
    try {
      const data: unknown = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": res.headers.get("content-type") || "text/plain" },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upstream unreachable";
    return NextResponse.json({ error: true, message }, { status: 502 });
  }
}

