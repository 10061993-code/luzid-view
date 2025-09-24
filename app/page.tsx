import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-100 via-white to-pink-50 text-gray-900">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">✨ LUZID Preview</h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Dein persönliches astrologisches Briefing – automatisch generiert und
          im Stil deines Lieblings-Creators.
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <Link
            href="/beispiel"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700"
          >
            Beispiel ansehen
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-xl bg-gray-100 font-semibold hover:bg-gray-200"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}

