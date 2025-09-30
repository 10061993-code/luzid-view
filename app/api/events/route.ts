import { NextResponse } from "next/server";
import { eventsInNextDays } from "@/lib/events";

export async function GET() {
  const list = eventsInNextDays(14);
  return NextResponse.json({ events: list });
}

