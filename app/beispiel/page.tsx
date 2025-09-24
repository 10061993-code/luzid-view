export const dynamic = "force-dynamic";

async function getData() {
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const res = await fetch(`${base}/api/style-options/lena`, { cache: "no-store" });
  const text = await res.text();

  try {
    return { ok: res.ok, json: JSON.parse(text) as unknown };
  } catch {
    return { ok: res.ok, json: { error: true, raw: text } as unknown };
  }
}

export default async function BeispielPage() {
  const data = await getData();
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">Beispiel: Style-Options (Lena)</h1>
        <pre className="text-sm overflow-auto whitespace-pre-wrap">
{JSON.stringify(data.json, null, 2)}
        </pre>
      </div>
    </main>
  );
}

