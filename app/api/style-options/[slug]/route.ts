// app/api/style-options/[slug]/route.ts
import { NextResponse } from "next/server";
const backend = process.env.BACKEND_URL || "http://localhost:8787";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const res = await fetch(`${backend}/style-options/${encodeURIComponent(slug)}`, {
      cache: "no-store" as any,
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": res.headers.get("content-type") || "text/plain" },
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: true, message: err?.message ?? "Upstream unreachable" },
      { status: 502 }
    );
  }
}

