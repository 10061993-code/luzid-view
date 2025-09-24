// app/view/[user]/[date]/embed/route.ts
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ user: string; date: string }> }
) {
  const { user, date } = await ctx.params;

  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "horoscopesv2";

  const u = user.toLowerCase();
  const htmlUrl = `${base}/storage/v1/object/public/${bucket}/birth/${u}/${date}/index.html`;

  const res = await fetch(htmlUrl, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  let html = await res.text();

  // <base> für Assets
  const dir = `${base}/storage/v1/object/public/${bucket}/birth/${u}/${date}/`;
  const baseTag = `<base href="${dir}">`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => `${m}\n${baseTag}`) : `${baseTag}\n${html}`;

  // Alle PDF-Links → **absolut** auf unsere hübsche PDF-Route + Top-Navigation
  const prettyAbs = new URL(`/view/${u}/${date}/pdf`, req.url).toString();
  html = html
    .replace(/<a([^>]*?)href=(['"])[^"'<>]*\.pdf\2([^>]*)>/gi, `<a$1href="${prettyAbs}" target="_top"$3>`)
    .replace(/<a([^>]*?)href=(['"])(?:\/)?view\/[^"'<>]*?\/pdf\2([^>]*)>/gi, `<a$1href="${prettyAbs}" target="_top"$3>`)
    .replace(/<a([^>]*?)>(\s*(?:View\s*PDF|PDF\s*öffnen)\s*)<\/a>/i, `<a$1 href="${prettyAbs}" target="_top">$2</a>`);

  // Guard, falls doch ein anderer Link klickt
  const guard = `
<script>
(function(){
  var pretty=${JSON.stringify(prettyAbs)};
  document.addEventListener('click',function(e){
    var a=e.target && e.target.closest && e.target.closest('a'); if(!a) return;
    var href=a.getAttribute('href')||'';
    var txt=(a.textContent||'').toLowerCase();
    if(/\\.pdf(\\?|$)/i.test(href) || /\\/view\\/.*\\/pdf/i.test(href) || /view\\s*pdf|pdf\\s*öffnen/i.test(txt)){
      e.preventDefault(); window.top.location.assign(pretty);
    }
  }, true);
})();
</script>`;
  html = /<body[^>]*>/i.test(html) ? html.replace(/<body[^>]*>/i, m => `${m}\n${guard}`) : html + guard;

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

