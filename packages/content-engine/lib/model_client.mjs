// Engine-Model-Client – globalThis-sicher (kein direkter process/fetch Zugriff)
export async function callModel({ system, user }) {
  // Env nur lesen, wenn globalThis.process existiert
  const env =
    typeof globalThis !== "undefined" &&
    globalThis.process &&
    globalThis.process.env
      ? globalThis.process.env
      : undefined;

  const url = env?.GEN_API_URL;
  const key = env?.GEN_API_KEY;

  // Remote-Mode (falls konfiguriert)
  if (url && key) {
    const f = typeof globalThis.fetch === "function" ? globalThis.fetch : undefined;
    if (!f) throw new Error("fetch() ist in dieser Runtime nicht verfügbar.");

    const res = await f(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ system, user })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Upstream ${res.status}: ${txt.slice(0, 400)}`);
    }
    const data = await res.json().catch(() => ({}));
    return { text: typeof data?.text === "string" ? data.text : "" };
  }

  // Stub (lokal)
  const stamp = new Date().toISOString();
  return { text: `(${stamp})\n\n${system}\n\nUSER: ${String(user).slice(0, 220)}…` };
}

