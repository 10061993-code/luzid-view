import { NextResponse } from "next/server";
import { eventsInNextDays } from "@/lib/events";
export async function GET(){ return NextResponse.json({ events: eventsInNextDays(14) }); }

