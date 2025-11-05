const MAP = {
  lena: {
    greeting_style: "warm",
    address_mode: "du",
    emoji_policy: "light",
    slang_level: 1,
    register: "informal",
    closing_style: "encouraging",
    tone_offsets: { valence: 0.1, openness: 0.05 }
  },
  paul: {
    greeting_style: "direct",
    address_mode: "du",
    emoji_policy: "none",
    slang_level: 0,
    register: "neutral",
    closing_style: "short",
    tone_offsets: { complexity: 0.1 }
  }
};

export function getCreatorConfig(id) {
  return MAP[id] ?? MAP.lena;
}

export function wordingTokensFor(id) {
  const c = getCreatorConfig(id);
  return {
    greeting: c.greeting_style === "warm" ? "Hey" : "Hi",
    closing: c.closing_style === "encouraging" ? "Du schaffst das." : "Alles Gute.",
    address: c.address_mode,         // "du" | "Sie" | "neutral"
    emojiRule: c.emoji_policy        // "none" | "light" | "rich"
  };
}

export function toneOffsetsFor(id) {
  return getCreatorConfig(id).tone_offsets || {};
}

