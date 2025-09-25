import Link from "next/link";

export default function KontaktPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com";
  const booking = process.env.NEXT_PUBLIC_BOOKING_URL || "#";
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-black">
      <h1 className="text-3xl font-bold">Kontakt</h1>
      <p className="mt-4 text-gray-700">Für Demo-Termine nutze gern unseren Kalender oder schreib uns.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {booking !== "#" && (
          <Link href={booking} target="_blank" className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
            Demo-Termin buchen
          </Link>
        )}
        <a href={`mailto:${contact}`} className="px-5 py-3 rounded-xl bg-gray-100 font-semibold hover:bg-gray-200">
          E-Mail schreiben
        </a>
      </div>
    </main>
  );
}

