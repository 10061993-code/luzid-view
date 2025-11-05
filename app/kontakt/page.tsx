import Link from "next/link";
import type { Route } from "next";

export default function KontaktPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com";
  const booking = process.env.NEXT_PUBLIC_BOOKING_URL || "#";

  // Helper: prüft, ob ein Pfad intern ist (z. B. "/demo")
  function isInternalPath(p: string): p is `/${string}` {
    return typeof p === "string" && p.startsWith("/");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-black">
      <h1 className="text-3xl font-bold">Kontakt</h1>
      <p className="mt-4 text-gray-700">
        Für Demo-Termine nutze gern unseren Kalender oder schreib uns.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {booking !== "#" && (
          isInternalPath(booking) ? (
            <Link
              href={booking as Route}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Demo-Termin buchen
            </Link>
          ) : (
            <a
              href={booking}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Demo-Termin buchen
            </a>
          )
        )}

        <a
          href={`mailto:${contact}`}
          className="px-5 py-3 rounded-xl bg-gray-100 font-semibold hover:bg-gray-200"
        >
          E-Mail schreiben
        </a>
      </div>
    </main>
  );
}

