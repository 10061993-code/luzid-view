// Engine-Model-Client – robust: explizites Remote-Opt-in, Timeout ohne AbortController, Stub-Fallback

// kleines Timeout-Helferlein ohne Globals
async function withTimeout(promise, ms) {
  let timer;
  try {
    const timeout = new Promise((_, rej) => {
      // setTimeout über globalThis sichern (falls nicht vorhanden, sehr hoher Timeout ⇒ praktisch nie)
      const setTO = typeof globalThis !== "undefined" && globalThis.setTimeout
        ? globalThis.setTimeout.bind(globalThis)
        : null;
      if (setTO) {
        timer = setTO(() => rej(new Error("timeout")), ms);
      }
    });
    // Rennen: fetch vs. Timeout
    return await Promise.race([promise, timeout]);
  } finally {
    const clearTO = typeof globalThis !== "undefined" && globalThis.clearTimeout
      ? globalThis.clearTimeout.bind(globalThis)
      : null;
    if (timer && clearTO) clearTO(timer);
  }
}

function readEnv() {
  const env =
    typeof globalThis !== "undefined" &&
    globalThis.process &&
    globalThis.process.env
      ? globalThis.process.env
      : undefined;

  return {
    url: env?.GEN_API_URL,
    key: env?.GEN_API_KEY,
    allowRemote: env?.ENGINE_REMOTE === "1"
  };
}

export async function callModel({ system, user }) {
  const { url, key, allowRemote } = readEnv();

  // Nur wenn ENGINE_REMOTE=1 und URL+KEY vorhanden sind, remote versuchen
  if (allowRemote && url && key) {
    const f = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
    if (!f) return stub(system, user, { remoteTried: false, reason: "no fetch in runtime" });

    try {
      const res = await withTimeout(
        f(url, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify({ system, user })
        }),
        15000 // 15s
      );

      if (!res || !res.ok) {
        const txt = res && typeof res.text === "function" ? await res.text().catch(() => "") : "";
        return stub(system, user, { remoteTried: true, upstream: res ? String(res.status) : "no response", body: txt.slice(0, 400) });
      }

      const data = await res.json().catch(() => ({}));
      const text = typeof data?.text === "string" ? data.text : "";
      return { text, meta: { remote: true, remoteTried: true } };
    } catch (e) {
      return stub(system, user, { remoteTried: true, error: String(e?.message ?? e) });
    }
  }

  // Standard: Stub-Ausgabe (lokal)
  return stub(system, user, { remoteTried: false });
}

function stub(system, user, meta = {}) {
  const stamp = new Date().toISOString();
  return {
    text: `(${stamp})\n\n${system}\n\nUSER: ${String(user).slice(0, 220)}…`,
    meta: { remote: false, ...meta }
  };
}

