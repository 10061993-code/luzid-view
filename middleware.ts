import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// einfacher In-Memory Store (pro Prozess)
const buckets = new Map<string, { tokens: number; ts: number }>();
const WINDOW_MS = 60_000;

function take(ip: string, limitPerMin = 60) {
  const now = Date.now();
  const rec = buckets.get(ip) || { tokens: limitPerMin, ts: now };
  const elapsed = now - rec.ts;
  const refill = Math.floor(elapsed / (WINDOW_MS / limitPerMin));
  rec.tokens = Math.min(limitPerMin, rec.tokens + refill);
  rec.ts = rec.ts + refill * (WINDOW_MS / limitPerMin);
  if (rec.tokens > 0) rec.tokens -= 1;
  buckets.set(ip, rec);
  return rec.tokens >= 0;
}

export function middleware(req: NextRequest) {
  // nur auf die generate-API anwenden
  if (req.nextUrl.pathname.startsWith("/api/generate")) {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "anon";
    const ok = take(String(ip), 60);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }
  }
  return NextResponse.next();
}

// optional: nur auf /api/generate matchen
export const config = {
  matcher: ["/api/generate/:path*"],
};

