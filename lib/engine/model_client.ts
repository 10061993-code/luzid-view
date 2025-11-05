type ModelRequest = {
  system: string;
  user: string;
};

type RemoteResponse = {
  text?: string;
  [k: string]: unknown;
};

export async function callRemoteModel(
  url: string,
  apiKey: string,
  body: ModelRequest,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Generator HTTP ${res.status}: ${txt.slice(0, 400)}`);
  }

  const data: unknown = await res.json().catch(() => ({}));
  if (data && typeof data === "object" && "text" in data) {
    const t = (data as RemoteResponse).text;
    return typeof t === "string" ? t : "";
  }
  return "";
}

export async function callStubModel(body: ModelRequest): Promise<string> {
  const stamp = new Date().toISOString();
  return `(${stamp})\n\n${body.system}\n\nUSER: ${body.user.slice(0, 220)}…`;
}

