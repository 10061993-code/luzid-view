// lib/types.ts
export type Tone = "warm" | "direkt" | "poetisch" | "coachy";
export type Length = "short" | "medium" | "long";
export type Focus = "career" | "love" | "self-care";

export type EventId = "new-moon" | "full-moon" | "mercury-rx";

export type EventMeta = {
  id: EventId;
  title: string;
  leitfrage: string;
  zeitlicherKontext: string;
  promptHint: string;
  seo?: { slug?: string; title?: string; description?: string };
  dateLogicNote?: string;
};

export type ContentConfig = {
  event: EventId;
  tone: Tone;
  length: Length;
  focus?: Focus;
};

export type ThemeConfig = {
  font_family: "Inter" | "Playfair" | "FuturaLike";
  font_weight_scale: "normal" | "strong";
  font_color: string;
  bg_color?: string;
  accent_color?: string;
  logo_url?: string;
};

export type BirthInput = {
  name: string;
  city: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  unknown_time: boolean;
};

export type GeneratorPayload = {
  type: "drop";
  event: EventId;
  creator: string;
  tone: Tone;
  length: Length;
  birth?: Partial<BirthInput>;
  focus?: Focus;
};

