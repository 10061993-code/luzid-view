import { NextRequest, NextResponse } from "next/server";
const backend = process.env.BACKEND_URL || "http://localhost:8787";
const adminKey = process.env.ADMIN_KEY || "";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const r = await fetch(`${backend}/style-config/${slug}`, { cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const body = await req.text();

  const r = await fetch(`${backend}/style-config/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body,
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}



