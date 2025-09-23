import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ user: string; date: string }> }) {
  const { user, date } = await ctx.params;
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "horoscopesv2";
  const u = user.toLowerCase();
  const pdf = `${base}/storage/v1/object/public/${bucket}/birth/${u}/${date}/index.pdf`;
  return NextResponse.redirect(new URL(`/api/proxy?u=${encodeURIComponent(pdf)}`, req.url), 307);
}

