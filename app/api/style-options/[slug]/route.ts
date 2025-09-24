// app/api/style-options/[slug]/route.ts
import { NextResponse } from "next/server";

const backend = process.env.BACKEND_URL || "http://localhost:8787";

export async function GET(
  _req: Request,
  { params }: { params: Record<string, string> } // <- kompatibel mit Next 15
) {
  const slug = params.slug;
  try {
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

