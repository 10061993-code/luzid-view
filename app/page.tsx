// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-black">
      <div className="text-center space-y-5 px-6">
        <h1 className="text-4xl font-bold">✨ LUZID Preview</h1>
        <p className="text-lg text-gray-700 max-w-xl mx-auto">
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

          {/* Optional: Login nur zeigen, wenn du es willst */}
          {process.env.NEXT_PUBLIC_SHOW_LOGIN === "true" && (
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-gray-100 font-semibold hover:bg-gray-200"
            >
              Creator Login
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

