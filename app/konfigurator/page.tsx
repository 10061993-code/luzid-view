'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type StyleOption = { id: string; label: string };
type Horoscope = 'weekly' | 'birth' | 'partner' | 'quiz';
type Length = 'short' | 'medium' | 'long';

// Fonts (Google Fonts + Fallbacks)
const FONTS: Record<string, string> = {
  inter: 'var(--font-inter)',
  playfair: 'var(--font-playfair)',
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  system: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  serif: 'Georgia, Cambria, "Times New Roman", serif',
};

const DEVICES = {
  phone: { label: 'Phone (390×844)', w: 390, h: 844 },
  tablet: { label: 'Tablet (768×1024)', w: 768, h: 1024 },
  desktop: { label: 'Desktop (1024×700)', w: 1024, h: 700 },
} as const;

export default function KonfiguratorPage() {
  const [slug, setSlug] = useState('lena');
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [styleId, setStyleId] = useState<string>('');
  const [horoscope, setHoroscope] = useState<Horoscope>('weekly');
  const [length, setLength] = useState<Length>('medium');
  const [fontKey, setFontKey] = useState<keyof typeof FONTS>('inter');

  const [device, setDevice] = useState<keyof typeof DEVICES>('phone');
  const [realSize, setRealSize] = useState(true);
  const [zoom, setZoom] = useState(100);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  // Stiloptionen laden
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/style-options/${slug}`, { cache: 'no-store' });
        const js = await res.json();
        if (!alive) return;
        const opts: StyleOption[] = js?.styles ?? [];
        setStyles(opts);
        if (!styleId && opts[0]) setStyleId(opts[0].id);
      } catch {
        setErrorMsg('Konnte Stil-Optionen nicht laden.');
      }
    })();
    return () => { alive = false; };
  }, [slug, styleId]);

  async function handleGenerate() {
    setLoading(true);
    setErrorMsg(null);
    setResult('');
    try {
      const res = await fetch(`/api/style/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ style_id: styleId, horoscope, length }),
      });
      const text = await res.text();
      try {
        const js = JSON.parse(text);
        setResult(js?.styled ?? String(text));
      } catch {
        setResult(text);
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Fehler beim Generieren');
    } finally {
      setLoading(false);
    }
  }

  // Vorschau immer: Weißer Hintergrund, schwarze Typo
  const previewStyle = useMemo<React.CSSProperties>(() => ({
    fontFamily: FONTS[fontKey],
    color: '#000000',
    backgroundColor: '#FFFFFF',
    lineHeight: 1.7,
    padding: '20px',
    borderRadius: '16px',
    whiteSpace: 'pre-line',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  }), [fontKey]);

  const frameMetrics = DEVICES[device];
  const scaled = realSize ? 1 : zoom / 100;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">🎛️ LUZID – Konfigurator</h1>
          <Link href="/" className="text-sm text-indigo-600 hover:underline">Zur Startseite</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[320px,1fr] gap-6">
          {/* Sidebar */}
          <aside className="bg-white rounded-2xl shadow p-5 md:sticky md:top-4 h-fit">
            <h2 className="text-lg font-semibold mb-4">Einstellungen</h2>

            <div className="space-y-4">
              {/* Creator */}
              <div>
                <label className="block text-sm font-medium mb-1">Creator</label>
                <select className="w-full rounded-lg border px-3 py-2"
                        value={slug} onChange={(e) => { setSlug(e.target.value); setStyleId(''); }}>
                  <option value="lena">Lena</option>
                  <option value="paul">Paul</option>
                </select>
              </div>

              {/* Stil */}
              <div>
                <label className="block text-sm font-medium mb-1">Stil</label>
                <select className="w-full rounded-lg border px-3 py-2"
                        value={styleId} onChange={(e) => setStyleId(e.target.value)}>
                  {styles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {/* Horoskop-Art */}
              <div>
                <label className="block text-sm font-medium mb-1">Horoskop-Art</label>
                <select className="w-full rounded-lg border px-3 py-2"
                        value={horoscope} onChange={(e) => setHoroscope(e.target.value as Horoscope)}>
                  <option value="weekly">Weekly</option>
                  <option value="birth">Birth</option>
                  <option value="partner">Partner</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>

              {/* Textlänge */}
              <div>
                <label className="block text-sm font-medium mb-1">Textlänge</label>
                <select className="w-full rounded-lg border px-3 py-2"
                        value={length} onChange={(e) => setLength(e.target.value as Length)}>
                  <option value="short">Kurz</option>
                  <option value="medium">Mittel</option>
                  <option value="long">Lang</option>
                </select>
              </div>

              {/* Typografie */}
              <div>
                <label className="block text-sm font-medium mb-1">Typografie</label>
                <select className="w-full rounded-lg border px-3 py-2"
                        value={fontKey} onChange={(e) => setFontKey(e.target.value as keyof typeof FONTS)}>
                  {Object.keys(FONTS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button onClick={handleGenerate} disabled={loading || !styleId}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Generiere…' : 'Text generieren'}
                </button>
                <button onClick={() => setResult('')}
                        className="px-4 py-2 rounded-xl border">Zurücksetzen</button>
              </div>

              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            </div>
          </aside>

          {/* Preview */}
          <section className="bg-white rounded-2xl shadow p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Device</label>
                <select className="rounded-lg border px-3 py-1.5"
                        value={device} onChange={(e) => setDevice(e.target.value as keyof typeof DEVICES)}>
                  {Object.entries(DEVICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={realSize} onChange={(e) => setRealSize(e.target.checked)} />
                Realgröße
              </label>

              {!realSize && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Zoom</span>
                  <input type="range" min={50} max={150} step={5}
                         value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                  <span className="text-sm w-10 text-right">{zoom}%</span>
                </div>
              )}
            </div>

            <div className="w-full overflow-auto grid place-items-center py-6">
              <div style={{
                width: frameMetrics.w,
                height: frameMetrics.h,
                transform: `scale(${scaled})`,
                transformOrigin: 'top center',
                borderRadius: 24,
                boxShadow: '0 12px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                background: '#f8fafc',
                padding: 16,
              }}>
                <div style={previewStyle}>
                  {result || '⟵ Wähle Optionen und klicke „Text generieren“…'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

