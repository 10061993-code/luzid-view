import { NextRequest, NextResponse } from "next/server";
// TODO: ersetze diese Typen durch eure echten, falls vorhanden
type RegistryFont = { name: string; url?: string };
type RegistryColor = { name: string; value: string };

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  // TODO: hier eure bestehende Logic wieder einfügen (fonts/textColors laden)
  const fonts: RegistryFont[] = [];
  const textColors: RegistryColor[] = [];
  return NextResponse.json({ ok: true, slug, fonts, textColors });
}
