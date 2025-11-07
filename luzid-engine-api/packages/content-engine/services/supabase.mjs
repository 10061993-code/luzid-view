/**
 * Minimaler Supabase-Insert via REST
 * ENV: SUPABASE_URL, SUPABASE_SERVICE_ROLE
 * Tabelle: weekly_archive (columns: user TEXT, week TEXT, payload JSONB)
 */
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;

export async function putWeeklyArchive({ user, week, payload }) {
  if (!url || !key) throw new Error("[supabase] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE");
  const endpoint = url.replace(/\/$/, "") + "/rest/v1/weekly_archive";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify([{ user, week, payload }])
  });
  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    throw new Error(`[supabase] HTTP ${res.status}: ${t}`);
  }
}
