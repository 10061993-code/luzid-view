// app/api/tenants/route.ts
import { NextResponse } from "next/server";

const backend = process.env.BACKEND_URL || "http://localhost:8787";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantHint = url.searchParams.get("tenant") || ""; // slug ODER display_id
  const roleParam = (url.searchParams.get("role") || "").toLowerCase();
  const role = roleParam === "admin" ? "admin" : "creator";

  try {
    const r = await fetch(`${backend}/tenants`, {
      cache: "no-store",
      headers: {
        "X-User-Role": role,
        ...(tenantHint ? { "X-Tenant": tenantHint } : {}),
      },
    });

    const data = (await r.json().catch(() => ({
      tenants: [] as Array<{ slug: string; display_id?: string; public_name?: string }>,
    }))) as {
      tenants: Array<{ slug: string; display_id?: string; public_name?: string }>;
    };

    return NextResponse.json(data, { status: r.status || 200 });
  } catch {
    return NextResponse.json(
      { tenants: [], error: "upstream_unreachable" },
      { status: 502 }
    );
  }
}

