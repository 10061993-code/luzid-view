// lib/events.ts
import type { EventId, EventMeta } from "./types";

export const EVENT_CATALOG: Record<EventId, EventMeta> = {
  "new-moon": {
    id: "new-moon",
    title: "Neumond",
    leitfrage: "Was beginnt in dir? Wofür setzt du eine klare Intention?",
    zeitlicherKontext: "Neustart, Samen säen, Fokus & Klarheit",
    promptHint:
      "Intention, Neuanfang, innere Ausrichtung, klare Handlungsaufforderung, leiser Ton mit Fokus.",
    seo: { slug: "new-moon", title: "Neumond-Drop" },
    dateLogicNote: "48h Fenster um den exakten Neumond.",
  },
  "full-moon": {
    id: "full-moon",
    title: "Vollmond",
    leitfrage: "Was kulminiert, was darfst du loslassen?",
    zeitlicherKontext: "Höhepunkt, Sichtbarkeit, Loslassen",
    promptHint:
      "Ernte, Balance, Reflexion, sanfter Release-Impuls; konkrete Mini-Routinen anbieten.",
    seo: { slug: "full-moon", title: "Vollmond-Drop" },
    dateLogicNote: "48h Fenster um den exakten Vollmond.",
  },
  "mercury-rx": {
    id: "mercury-rx",
    title: "Merkur rückläufig",
    leitfrage: "Was braucht Revision, wo hilft dir Langsamkeit?",
    zeitlicherKontext: "Review, Reframe, Reconnect",
    promptHint:
      "Kommunikation, Verträge, Technik – pragmatische Tipps, humorvolle Entschleunigung.",
    seo: { slug: "mercury-rx", title: "Merkur rückläufig Drop" },
    dateLogicNote: "RX-Phasen + Schattenzonen später berücksichtigen.",
  },
};

export function listEvents(): EventMeta[] {
  return Object.values(EVENT_CATALOG);
}

export function getEvent(id: EventId): EventMeta {
  const meta = EVENT_CATALOG[id];
  if (!meta) throw new Error(`Unknown event id: ${id}`);
  return meta;
}

