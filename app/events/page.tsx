import { eventsInNextDays, formatLocal } from "@/lib/events";

export const dynamic = "force-static";

export default function EventsPage() {
  const list = eventsInNextDays(14);

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Astro-Kalender (nächste 14 Tage)
      </h1>
      <p style={{ marginBottom: 24, opacity: 0.8 }}>
        Zeiten in deiner lokalen Anzeige (Europe/Berlin).
      </p>
      <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0 }}>
        {list.map((e) => (
          <li key={e.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{e.title}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              {formatLocal(e.startUTC)} {e.zodiac ? <>· <em>{e.zodiac}</em></> : null}
            </div>
            {e.description ? <p style={{ marginTop: 8 }}>{e.description}</p> : null}
            {e.tags?.length ? (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {e.tags.map((t) => (
                  <span key={t} style={{ fontSize: 12, border: "1px solid #e5e7eb", padding: "2px 8px", borderRadius: 999 }}>
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

