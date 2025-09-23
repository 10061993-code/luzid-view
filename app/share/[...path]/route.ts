import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "horoscopesv2";

  const key = path.join("/");
  const objectPath = key.endsWith(".html") ? key : `${key.replace(/\/$/, "")}/index.html`;
  const publicUrl  = `${base}/storage/v1/object/public/${bucket}/${objectPath}`;

  const res = await fetch(publicUrl, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "not found" }, { status: res.status });

  let html = await res.text();

  // <base>, damit relative CSS/Assets laden
  const dir  = new URL(".", publicUrl).toString();
  const baseTag = `<base href="${dir}">`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => `${m}\n${baseTag}`) : `${baseTag}\n${html}`;

  // PDF-Link immer zu deiner /pdf-Route (Top-Window)
  const m = key.match(/^birth\/([^/]+)\/([^/]+)/i);
  if (m) {
    const u = m[1].toLowerCase(); const d = m[2];
    const prettyAbs = new URL(`/view/${u}/${d}/pdf`, req.url).toString();
    html = html
      .replace(/<a([^>]*?)href=(['"])[^"'<>]*\.pdf\2([^>]*)>/gi, `<a$1href="${prettyAbs}" target="_top"$3>`)
      .replace(/<a([^>]*?)>(\s*(?:View\s*PDF|PDF\s*öffnen)\s*)<\/a>/i, `<a$1 href="${prettyAbs}" target="_top">$2</a>`);
  }

  return new NextResponse(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

