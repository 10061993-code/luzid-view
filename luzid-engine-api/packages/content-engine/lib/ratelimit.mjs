const buckets = new Map();

/**
 * token-bucket: limit per key over window
 * @param {string} key
 * @param {{capacity:number, refill:number, windowMs:number}} cfg
 */
export function rateLimit(key, cfg = { capacity: 20, refill: 20, windowMs: 60_000 }) {
  const now = Date.now();
  const b = buckets.get(key) || { tokens: cfg.capacity, reset: now + cfg.windowMs };
  if (now > b.reset) {
    b.tokens = cfg.refill;
    b.reset = now + cfg.windowMs;
  }
  if (b.tokens <= 0) {
    const retryAfterMs = Math.max(0, b.reset - now);
    return { ok: false, retryAfterMs };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, remaining: b.tokens, resetAt: b.reset };
}
