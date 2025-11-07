const buckets = new Map();
export function rateLimit(key, cfg = { capacity: 20, refill: 20, windowMs: 60_000 }) {
  const now = Date.now();
  const b = buckets.get(key) || { tokens: cfg.capacity, reset: now + cfg.windowMs };
  if (now > b.reset) { b.tokens = cfg.refill; b.reset = now + cfg.windowMs; }
  if (b.tokens <= 0) { return { ok: false, retryAfterMs: Math.max(0, b.reset - now) }; }
  b.tokens -= 1; buckets.set(key, b);
  return { ok: true, remaining: b.tokens, resetAt: b.reset };
}
