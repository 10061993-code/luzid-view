import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <div className="text-center space-y-5">
        <h1 className="text-4xl font-bold">✨ LUZID Preview</h1>
        <p className="text-lg text-gray-700 max-w-md mx-auto">
          Dein persönliches astrologisches Briefing – automatisch generiert und
          im Stil deines Lieblings-Creators.
        </p>

        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <Link
            href="/konfigurator"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700"
          >
            Konfigurator öffnen
          </Link>

          <Link
            href="/generieren"
            className="px-6 py-3 rounded-xl bg-pink-600 text-white font-semibold shadow hover:bg-pink-700"
          >
            Horoskop generieren
          </Link>

          <Link
            href="/beispiel"
            className="px-6 py-3 rounded-xl bg-gray-100 font-semibold hover:bg-gray-200"
          >
            Style-Options (JSON)
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

