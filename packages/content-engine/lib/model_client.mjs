// Engine-Model-Client – robust mit explizitem Remote-Opt-in + Timeout + Stub-Fallback
export async function callModel({ system, user }) {
  // Env nur lesen, wenn globalThis.process verfügbar ist
  const env =
    typeof globalThis !== "undefined" &&
    globalThis.process &&
    globalThis.process.env
      ? globalThis.process.env
      : undefined;

  const url = env?.GEN_API_URL;
  const key = env?.GEN_API_KEY;

  // Remote nur, wenn ENGINE_REMOTE=1 gesetzt ist und URL+KEY vorhanden sind
  const allowRemote = env?.ENGINE_REMOTE === "1" && !!url && !!key;

  if (allowRemote) {
    const f = typeof globalThis.fetch === "function" ? globalThis.fetch : undefined;
    if (!f) {
      // Kein fetch in dieser Runtime -> Stub
      return stub(system, user, { remoteTried: false });
    }

    // Timeout (15s)
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const id = controller ? setTimeout(() => controller.abort(), 15_000) : null;

    try {
      const res = await f(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ system, user }),
        signal: controller?.signal
      });

      if (id) clearTimeout(id);

      if (!res.ok) {
        // Upstream-Fehler -> Stub-Fallback
        const txt = await res.text().catch(() => "");
        return stub(system, user, { remoteTried: true, upstream: `${res.status} ${txt.slice(0,400)}` });
      }

      const data = await res.json().catch(() => ({}));
      const text = typeof data?.text === "string" ? data.text : "";
      return { text, meta: { remote: true, remoteTried: true } };
    } catch (e) {
      if (id) clearTimeout(id);
      // Netzwerk/Timeout -> Stub-Fallback
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

