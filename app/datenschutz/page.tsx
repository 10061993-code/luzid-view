export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-black">
      <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>
      <p className="mt-4 text-gray-700">
        Platzhalter. Bitte durch deine finale, rechtlich geprüfte Fassung ersetzen.
      </p>
      <ul className="mt-4 list-disc pl-6 text-gray-700 space-y-2">
        <li>Zweck: Kontaktaufnahme zur Demo-Terminierung.</li>
        <li>Daten: Name, E-Mail, optional Instagram/Brand/Notizen.</li>
        <li>Speicherort: Supabase.</li>
        <li>Löschung: auf Anfrage oder nach Wegfall des Zwecks.</li>
        <li>Kontakt: <a className="underline" href="/kontakt">Kontakt</a></li>
      </ul>
      <p className="mt-6 text-xs text-gray-500">Kein Rechtsrat.</p>
    </main>
  );
}

