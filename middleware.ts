import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // API bleibt öffentlich
  if (p.startsWith("/api/")) return NextResponse.next();

  // Admin schützen
  if (p.startsWith("/admin")) {
    const token = req.headers.get("x-admin-token") || req.cookies.get("admin-token")?.value;
    if (token === process.env.ADMIN_PROTECTION_TOKEN) return NextResponse.next();
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/admin/:path*"] };

