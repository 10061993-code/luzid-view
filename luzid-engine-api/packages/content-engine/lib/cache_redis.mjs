const RURL = process.env.UPSTASH_REDIS_REST_URL;
const RTOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisFetch(path, body) {
  const res = await fetch(`${RURL}${path}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${RTOKEN}`, "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`[redis] HTTP ${res.status}`);
  return res.json();
}

export async function redisSetEx(key, ttlSec, value) {
  if (!RURL || !RTOKEN) return false;
  await redisFetch("/setex", { key, value, ttl: ttlSec });
  return true;
}
export async function redisExists(key) {
  if (!RURL || !RTOKEN) return false;
  const j = await redisFetch("/exists", { key });
  return !!(j && j.result === 1);
}
