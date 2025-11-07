/**
 * Simpler Circuit Breaker pro Provider-Key (z. B. 'azure', 'openai')
 * - öffnet nach N Fehlern für windowMs
 */
const state = new Map();

export function breakerAllow(key, cfg = { maxErrors: 5, windowMs: 60_000 }) {
  const now = Date.now();
  const s = state.get(key) || { errors: 0, openUntil: 0 };
  if (now < s.openUntil) return { ok: false, retryAfterMs: s.openUntil - now };
  return { ok: true };
}

export function breakerReport(key, ok, cfg = { maxErrors: 5, windowMs: 60_000 }) {
  const now = Date.now();
  const s = state.get(key) || { errors: 0, openUntil: 0 };
  if (ok) {
    s.errors = 0;
    s.openUntil = 0;
  } else {
    s.errors += 1;
    if (s.errors >= cfg.maxErrors) {
      s.openUntil = now + cfg.windowMs;
      s.errors = 0;
    }
  }
  state.set(key, s);
  return s;
}
