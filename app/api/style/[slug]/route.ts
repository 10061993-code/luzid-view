// app/api/style/[slug]/route.ts
import { NextResponse } from "next/server";
import { getFonts, getTextColors } from "@/lib/registry";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json({
    ok: true,
    slug: params.slug,
    fonts: getFonts(),
    textColors: getTextColors(),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    ok: true,
    slug: params.slug,
    received: body,
    hint: "Persistenz später hier implementieren.",
  });
}

