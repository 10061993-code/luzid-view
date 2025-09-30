export type AstroEventType =
  | "lunation"
  | "ingress"
  | "station"
  | "eclipse"
  | "aspect";

export interface AstroEvent {
  id: string;
  type: AstroEventType;
  title: string;
  description?: string;
  startUTC: string;   // ISO in UTC
  zodiac?: string;
  source?: string;
  tags?: string[];
}

export function formatLocal(isoUTC: string, locale = "de-DE"): string {
  const d = new Date(isoUTC);
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

// 30.09.–14.10.2025 (Beispiel-Einträge; manuell erweiterbar)
export const ASTRO_EVENTS_NEXT_2W: AstroEvent[] = [
  {
    id: "2025-10-07-full-moon-aries",
    type: "lunation",
    title: "Vollmond in Widder",
    description:
      "Kulmination, Handlungsimpuls vs. Balance-Thema (Waage–Widder-Achse).",
    startUTC: "2025-10-07T03:47:00Z",
    zodiac: "Widder 14°09′",
    source: "manuell",
    tags: ["Lunation", "Mondzyklen"],
  },
  {
    id: "2025-10-13-last-quarter-cancer",
    type: "lunation",
    title: "Letztes Viertel (Krebs)",
    description:
      "Bilanz & Neujustierung im Zyklus – emotionale Klärung, Rückbau, Fokus.",
    startUTC: "2025-10-13T18:12:00Z",
    zodiac: "Krebs 20°40′",
    source: "manuell",
    tags: ["Lunation", "Mondzyklen"],
  },
  {
    id: "2025-10-13-venus-enters-libra",
    type: "ingress",
    title: "Venus tritt in Waage ein",
    description:
      "Ästhetik, Diplomatie & Beziehungen im Fokus; Stil & Harmonie betont.",
    startUTC: "2025-10-13T21:19:00Z",
    zodiac: "Venus 0° Waage 00′ (Ingress)",
    source: "manuell",
    tags: ["Venus", "Beziehung", "Stil"],
  },
  {
    id: "2025-10-14-pluto-stations-direct",
    type: "station",
    title: "Pluto stationär direkt (Wassermann)",
    description:
      "Intensität verschiebt sich nach außen: Verdichtung → Umsetzung.",
    startUTC: "2025-10-14T02:52:00Z",
    zodiac: "Wassermann 1°22′ (stationär D)",
    source: "manuell",
    tags: ["Pluto", "Station", "Langsamläufer"],
  },
];

export function eventsInNextDays(days = 14, from = new Date()): AstroEvent[] {
  const end = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  return ASTRO_EVENTS_NEXT_2W.filter((e) => {
    const t = new Date(e.startUTC).getTime();
    return t >= from.getTime() && t <= end.getTime();
  }).sort((a, b) => a.startUTC.localeCompare(b.startUTC));
}

