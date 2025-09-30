import { NextResponse } from "next/server";
import { getFonts, getTextColors } from "@/lib/registry";

export async function GET() {
  return NextResponse.json({
    fonts: getFonts(),
    textColors: getTextColors(),
  });
}

