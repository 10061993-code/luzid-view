// app/api/proxy/route.ts
import { NextResponse } from "next/server";

function extFromPath(pathname: string) {
  const m = pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

const ctMap: Record<string, string> = {
  pdf:  "application/pdf",
  css:  "text/css; charset=utf-8",
  html: "text/html; charset=utf-8",
  js:   "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg:  "image/svg+xml",
  png:  "image/png",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get("u");
  const download = url.searchParams.get("download") === "1";

  if (!u) return NextResponse.json({ error: "missing u" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  // ✅ Whitelist – nur eure Supabase-Domain + public-Pfad
  const allowedHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
  if (target.host !== allowedHost)
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  if (!target.pathname.startsWith("/storage/v1/object/public/"))
    return NextResponse.json({ error: "path not allowed" }, { status: 403 });

  const upstream = await fetch(target.toString(), {
    cache: "no-store", // Dev: kein Cache-Flicker
    headers: { "user-agent": "luzid-view-proxy" },
  });

  const headers = new Headers(upstream.headers);
  const ext = extFromPath(target.pathname);
  const forced = ctMap[ext];
  if (forced) headers.set("content-type", forced);

  // ✅ iFrame-kompatibel: restriktive Upstream-Header entfernen
  headers.delete("content-security-policy");
  headers.delete("x-frame-options");

  if (ext === "pdf") {
    const filename = target.pathname.split("/").pop() || "file.pdf";
    headers.set(
      "content-disposition",
      `${download ? "attachment" : "inline"}; filename="${filename}"`
    );
  }

  headers.set(
    "cache-control",
    process.env.NODE_ENV === "production" ? "public, max-age=60" : "no-store"
  );

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function HEAD(req: Request) {
  return GET(req);
}

