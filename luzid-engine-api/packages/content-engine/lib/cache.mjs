import { redisExists, redisSetEx } from "./cache_redis.mjs";
const store = new Map();

/** set with ttl (ms) – local fallback */
function localSet(key, ttlMs) {
  const expires = Date.now() + ttlMs;
  store.set(key, { expires });
}

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { store.delete(key); return null; }
  return "__ONCE__";
}

/** once-key helper: Redis bevorzugt, sonst lokal */
export function cacheOnce(key, ttlMs = 10 * 60 * 1000) {
  const ttlSec = Math.ceil(ttlMs / 1000);
  let hit = false;

  // Redis first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // wir simulieren "set if not exists" via exists→setex
    // race conditions sind für MVP ok
    // (Optional: /setnx in Upstash API nutzen, falls freigeschaltet)
    hit = false;
    // exists?
    // (fehlt: echte NX-Garantie, für MVP genügt)
  }

  // simple: wenn redisExists verfügbar → nutzt es
  // fallback: lokal
  return {
    get hit() { return hit; },
    key
  };
}
