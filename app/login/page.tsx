'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!token.trim()) {
      setErr('Bitte Token eingeben.');
      return;
    }

    // Cookie setzen (gleicher Name, den die Middleware akzeptiert)
    document.cookie = `admin-token=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Lax; Max-Age=86400`;

    // Kleiner Test-Call (optional): prüfe, ob /admin jetzt zugänglich ist
    try {
      // Wenn du magst, könntest du hier gegen /admin pingen und bei 401 eine Fehlermeldung zeigen.
      router.push('/konfigurator');
    } catch {
      router.push('/konfigurator');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-white text-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold">Creator Login</h1>
        <p className="text-sm text-gray-600">
          Bitte gib deinen Zugangs-Token ein, um den Konfigurator zu öffnen.
        </p>

        <label className="block text-sm font-medium">Token</label>
        <div className="flex gap-2">
          <input
            type={show ? 'text' : 'password'}
            className="flex-1 rounded-lg border px-3 py-2"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ADMIN_PROTECTION_TOKEN"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="px-3 py-2 rounded-lg border"
          >
            {show ? 'verbergen' : 'anzeigen'}
          </button>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
        >
          Weiter
        </button>

        <p className="text-xs text-gray-500">
          Tipp: Token ist in Vercel als <code>ADMIN_PROTECTION_TOKEN</code> gesetzt.
        </p>
      </form>
    </main>
  );
}

