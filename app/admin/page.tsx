import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">🔒 Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mb-6">
          Diese Seite ist durch <code>ADMIN_PROTECTION_TOKEN</code> geschützt.
        </p>
        <div className="space-y-2">
          <Link
            href="/api/debug"
            className="block px-4 py-2 text-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Debug-Endpoint ansehen
          </Link>
          <Link
            href="/api/style-options/lena"
            className="block px-4 py-2 text-center rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Style-Options (Beispiel)
          </Link>
        </div>
      </div>
    </main>
  );
}

