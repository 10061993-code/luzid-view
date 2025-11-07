/**
 * callAzure – spricht Azure OpenAI Chat Completions
 */
export async function callAzure({ system, user, model = process.env.AZURE_OPENAI_DEPLOYMENT, temperature = 0.7, max_tokens = 600 }) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  if (!endpoint || !apiKey) throw new Error("[azure] Missing AZURE_OPENAI_* env vars");

  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;
  const body = {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature,
    max_tokens
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[azure] HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() || "";
}
