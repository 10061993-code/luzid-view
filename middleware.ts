import { NextRequest, NextResponse } from "next/server";

/**
 * Robust IP extraction for edge/server:
 * checks common proxy/CDN headers, falls back to "unknown".
 */
function getClientIp(req: NextRequest): string {
  const h = req.headers;
  const candidates = [
    "x-forwarded-for",          // comma-separated
    "x-real-ip",
    "cf-connecting-ip",
    "x-vercel-ip-client-ip",
  ];
  for (const k of candidates) {
    const v = h.get(k);
    if (v) return v.split(",")[0].trim();
  }
  return "unknown";
}

/**
 * Tiny token-bucket per minute (in-memory).
 * Note: In serverless edge contexts this resets across isolates/instances.
 * Good enough as a basic guard; use Redis for production-grade limits.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const buckets = new Map<string, { count: number; slot: number }>();

function take(ip: string, max: number = MAX_PER_WINDOW): boolean {
  const now = Date.now();
  const slot = Math.floor(now / WINDOW_MS);
  const key = `${ip}:${slot}`;

  const cur = buckets.get(key);
  if (!cur) {
    // clear previous window entries occasionally
    // (simple hygiene; avoids unbounded growth)
    for (const [k, v] of buckets) {
      if (v.slot !== slot) buckets.delete(k);
    }
    buckets.set(key, { count: 1, slot });
    return true;
  }
  if (cur.count >= max) return false;
  cur.count += 1;
  return true;
}

export default function middleware(req: NextRequest) {
  // nur die Generate-API begrenzen
  if (req.nextUrl.pathname.startsWith("/api/generate")) {
    const ip = getClientIp(req);
    const ok = take(ip, MAX_PER_WINDOW);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }
  }
  return NextResponse.next();
}

/**
 * Apply middleware to all /api/* routes; we gate inside by path prefix.
 * (So bleibt es flexibel, falls du später weitere APIs limitieren willst.)
 */
export const config = {
  matcher: ["/api/:path*"],
};

