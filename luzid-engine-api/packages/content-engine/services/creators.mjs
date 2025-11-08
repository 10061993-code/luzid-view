const MEM = new Map(); // 5-Minuten-Cache

export async function getCreatorStyleFromDB(handle) {
  const key = `creator:${handle}`;
  const hit = MEM.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const token = process.env.SUPABASE_SERVICE_ROLE;
  if (!base || !token) return null;

  const url = `${base}/rest/v1/creators?select=style&handle=eq.${encodeURIComponent(handle)}`;
  const res = await fetch(url, { headers: { apikey: token, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;

  const rows = await res.json().catch(() => []);
  const style = rows?.[0]?.style || null;

  if (style) MEM.set(key, { value: style, expires: Date.now() + 5 * 60 * 1000 });
  return style;
}
