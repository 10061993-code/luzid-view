// app/api/style/[slug]/route.ts
import { NextResponse } from "next/server";
const backend = process.env.BACKEND_URL || "http://localhost:8787";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const payload = await req.json().catch(() => ({}));
    const res = await fetch(`${backend}/style/${encodeURIComponent(slug)}`, {
      method: "POST",
      cache: "no-store" as any,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
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

export async function GET() {
  return NextResponse.json(
    { ok: true, hint: "Use POST with JSON body to /api/style/:slug" },
    { status: 200 }
  );
}

