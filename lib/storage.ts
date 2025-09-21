export function publicBase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.NEXT_PUBLIC_BUCKET || 'horoscopesv2';
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing');
  return `${url}/storage/v1/object/public/${bucket}`;
}

export function candidatePaths(user: string, date: string) {
  const order = (process.env.NEXT_PUBLIC_TYPES || 'weekly,birth,partner')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return order.map(t => ({
    type: t,
    html: `${publicBase()}/${t}/${user}/${date}/index.html`,
    pdf:  `${publicBase()}/${t}/${user}/${date}/index.pdf`,
  }));
}

export async function firstExisting(user: string, date: string) {
  const cands = candidatePaths(user, date);
  for (const c of cands) {
    try {
      const head = await fetch(c.html, { method: 'HEAD', cache: 'no-store' });
      if (head.ok) return c;
    } catch {}
  }
  return null;
}

