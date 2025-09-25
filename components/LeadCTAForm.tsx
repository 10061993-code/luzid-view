'use client';

import { useMemo, useState } from "react";
import Link from "next/link";

type LeadPayload = {
  name: string;
  email: string;
  instagram?: string;
  company?: string;
  message?: string;
  consent: boolean;
  website?: string; // Honeypot
};

export default function LeadCTAForm({ className = "" }: { className?: string }) {
  const [form, setForm] = useState<LeadPayload>({
    name: "",
    email: "",
    instagram: "",
    company: "",
    message: "",
    consent: false,
    website: "", // Honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);

  // Button erst aktivieren, wenn alles passt
  const isValid = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    return form.name.trim().length > 1 && emailOk && form.consent;
  }, [form.name, form.email, form.consent]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerErr(null);
    if (!isValid) return; // keine Fehltexte, nur Button disabled halten

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        // technische Fehler nur dezent anzeigen
        setServerErr("Das hat leider nicht geklappt. Bitte später erneut versuchen.");
        return;
      }
      setOk(true);
    } catch {
      setServerErr("Das hat leider nicht geklappt. Bitte später erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (ok) {
    return (
      <section className={`mt-8 rounded-2xl border bg-white text-black shadow-sm p-6 ${className}`}>
        <h2 className="text-2xl font-bold">Danke! 🎉</h2>
        <p className="mt-2 text-gray-700">
          Wir melden uns kurz zur Terminierung und stimmen deinen Style ab.
        </p>
      </section>
    );
  }

  return (
    <section className={`mt-8 rounded-2xl border bg-white text-black shadow-sm p-6 ${className}`}>
      <h2 className="text-2xl font-bold">Demo anfragen & eigenen Style sichern</h2>
      <p className="mt-2 text-gray-700">
        Kurzformular ausfüllen – wir zeigen dir deinen Look (Logo, Farben, Typo) direkt im Tool.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3" noValidate>
        {/* Honeypot */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            autoComplete="off"
            value={form.website}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, website: e.target.value })
            }
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Name*</label>
          <input
            className="rounded-lg border px-3 py-2"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, name: e.target.value })
            }
            placeholder="Vor- und Nachname"
            required
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">E-Mail*</label>
          <input
            type="email"
            className="rounded-lg border px-3 py-2"
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, email: e.target.value })
            }
            placeholder="dein@email.de"
            required
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Instagram (optional)</label>
          <input
            className="rounded-lg border px-3 py-2"
            value={form.instagram || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, instagram: e.target.value })
            }
            placeholder="@deinhandle"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Brand / Projekt (optional)</label>
          <input
            className="rounded-lg border px-3 py-2"
            value={form.company || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, company: e.target.value })
            }
            placeholder="z. B. Creator-Name, Label"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Wunsch-Style / Hinweise (optional)</label>
          <textarea
            className="rounded-lg border px-3 py-2 min-h-[96px]"
            value={form.message || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setForm({ ...form, message: e.target.value })
            }
            placeholder="Farben, Typo, Tonalität, Export-Wünsche…"
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, consent: e.target.checked })
            }
          />
          <span>
            Ich bin einverstanden, dass LUZID mich per E-Mail kontaktiert. Ich habe die{" "}
            <Link href="/datenschutz" className="underline" target="_blank">Datenschutzerklärung</Link> gelesen.
          </span>
        </label>

        {/* nur bei echten Serverfehlern kurz anzeigen */}
        {serverErr && <p className="text-sm text-red-600">{serverErr}</p>}

        <div className="flex">
          <button
            type="submit"
            disabled={!isValid || submitting}
            aria-disabled={!isValid || submitting}
            className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Senden…" : "Demo anfragen"}
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500">15–20 Min. • Kostenlos • Dein Branding live im Tool</p>
      </form>
    </section>
  );
}

