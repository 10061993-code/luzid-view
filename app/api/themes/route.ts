import { NextResponse } from "next/server";
import { getThemes } from "@/lib/registry";

export async function GET() {
  return NextResponse.json({ themes: getThemes() });
}

