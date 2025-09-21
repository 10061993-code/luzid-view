// app/api/proxy/route.ts
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Optional: Edge ist super schnell; bei Bedarf kannst du auf 'nodejs' wechseln
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) return new Response('Missing url', { status: 400 });

  // Range weiterreichen (wichtig für PDFs/Streaming)
  const range = req.headers.get('range') ?? undefined;

  const upstream = await fetch(target, {
    headers: range ? { Range: range } : {},
    // bei Bedarf: cache: 'no-store'
  });

  // Content-Type erzwingen basierend auf Dateiendung
  const ext = new URL(target).pathname.split('.').pop()?.toLowerCase();
  const forced =
    ext === 'html'
      ? 'text/html; charset=utf-8'
      : ext === 'pdf'
      ? 'application/pdf'
      : upstream.headers.get('content-type') ?? 'application/octet-stream';

  const headers = new Headers(upstream.headers);
  headers.set('content-type', forced);
  // sinnvolle Defaults
  headers.set('cache-control', 'no-store');
  headers.delete('content-encoding'); // beugt Doppelkodierung vor, falls vorhanden

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

