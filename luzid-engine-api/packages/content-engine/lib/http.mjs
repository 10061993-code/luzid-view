const DEFAULT_TIMEOUT = Number(process.env.HTTP_TIMEOUT_MS || 15000);

function abortableTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

export async function fetchWithTimeout(url, opts = {}, timeout = DEFAULT_TIMEOUT) {
  const { signal, cancel } = abortableTimeout(timeout);
  try {
    return await fetch(url, { ...opts, signal });
  } finally {
    cancel();
  }
}

/** 1x Retry auf 5xx/Network, kein Retry auf 4xx */
export async function fetchWithRetry(url, opts = {}, timeout = DEFAULT_TIMEOUT) {
  try {
    const r = await fetchWithTimeout(url, opts, timeout);
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
    return r;
  } catch {
    await new Promise(r => setTimeout(r, 350));
    return fetchWithTimeout(url, opts, timeout);
  }
}
