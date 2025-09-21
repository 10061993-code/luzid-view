import { firstExisting } from '@/lib/storage';
import Link from 'next/link';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Hilfsfunktion, um Supabase-URLs durch den Proxy zu schicken
const px = (u: string) => `/api/proxy?url=${encodeURIComponent(u)}`;

type Props = { params: { user: string; date: string } };

export default async function ViewPage({ params }: Props) {
  const user = params.user.toLowerCase();
  const date = params.date;
  const found = await firstExisting(user, date);

  if (!found) {
    return (
      <main className="min-h-screen px-4 py-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-2">Not found</h1>
        <p className="text-sm opacity-80">
          Keine Vorschau für <span className="font-mono">{user}</span> am{' '}
          <span className="font-mono">{date}</span> gefunden.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="sticky top-0 z-10 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="max-w-screen-md mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-70">Preview</div>
            <div className="text-sm font-medium">
              {found.type} · {user} · {date}
            </div>
          </div>
          <Link
            href={px(found.pdf)}
            prefetch={false}
            className="inline-flex items-center rounded-2xl px-3 py-2 border border-white/20 hover:border-white/40 transition"
          >
            PDF herunterladen
          </Link>
        </div>
      </section>

      {/* iFrame Wrapper */}
      <section className="max-w-screen-md mx-auto w-full px-0 md:px-4 py-4">
        <div className="rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,.08)]">
          <div className="md:hidden px-4 py-2 text-xs bg-white/5 border-b border-white/10">
            Tip: Tippe, halte & scrolle – die Vorschau ist eingebettet.
          </div>
          <iframe
            src={px(found.html)}
            className="w-full"
            style={{ border: '0', height: 'calc(100dvh - 112px)' }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>

        <div className="flex justify-center py-6">
          <Link
            href={px(found.pdf)}
            prefetch={false}
            className="inline-flex items-center rounded-2xl px-4 py-2 border border-white/20 hover:border-white/40 transition"
          >
            PDF herunterladen
          </Link>
        </div>
      </section>
    </main>
  );
}

