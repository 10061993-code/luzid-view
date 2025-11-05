export async function callModel({ system, user }) {
  const hasProcess = typeof process !== "undefined" && !!process?.env;
  const url = hasProcess ? process.env.GEN_API_URL : undefined;
  const key = hasProcess ? process.env.GEN_API_KEY : undefined;

  // Remote-Mode (falls konfiguriert)
  if (url && key) {
    const res = await globalThis.fetch(url, {
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
  return { text: `(${new Date().toISOString()})\n\n${system}\n\nUSER: ${String(user).slice(0, 220)}…` };
}

