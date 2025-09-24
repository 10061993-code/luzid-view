export const dynamic = "force-dynamic";

type StyledResponse = { styled: string };
type ErrorResponse = { error: true; raw: string };

function parseStyled(text: string): StyledResponse | ErrorResponse {
  try {
    const j: unknown = JSON.parse(text);
    if (typeof j === "object" && j !== null) {
      const rec = j as Record<string, unknown>;
      if (typeof rec.styled === "string") {
        return { styled: rec.styled };
      }
    }
    return { error: true, raw: text };
  } catch {
    return { error: true, raw: text };
  }
}

async function getData(): Promise<{ ok: boolean; data: StyledResponse | ErrorResponse }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const res = await fetch(`${base}/api/style/lena`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ style_id: "lena_warm", horoscope: "weekly", length: "medium" }),
    cache: "no-store",
  });

  const text = await res.text();
  return { ok: res.ok, data: parseStyled(text) };
}

export default async function GenerierenPage() {
  const { ok, data } = await getData();

  return (
    <main className="flex items-center justify-center min-h-screen bg-white text-gray-800">
      <div className="w-full max-w-2xl bg-gray-50 shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">✨ Horoskop-Text (Lena – warm)</h1>

        {"styled" in data ? (
          <p className="text-lg leading-relaxed whitespace-pre-line">{data.styled}</p>
        ) : (
          <div>
            {!ok && <p className="mb-2 text-red-600 font-semibold">Upstream antwortete nicht mit 200.</p>}
            <pre className="text-sm text-red-700 whitespace-pre-wrap break-words">
{JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}

