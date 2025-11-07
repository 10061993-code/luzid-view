import atoms from "./interpretation_data.json" with { type: "json" };

const CREATOR_STYLES = {
  lena: {
    greeting: "hey du,",
    register: "soft-relatable",
    emoji: "light",
    cta_style: "soft"
  },
  paul: {
    greeting: "",
    register: "direct",
    emoji: "none",
    cta_style: "crisp"
  }
};

export function getCreatorStyle(name="lena") {
  return CREATOR_STYLES[name] || CREATOR_STYLES.lena;
}

export function pickWeeklyAtoms({ event="new_moon" }) {
  const pool = atoms.weekly.themes[event] || [];
  const closings = atoms.weekly.closings;
  return {
    lines: pool.slice(0,2),
    closing: closings[(Math.random()*closings.length)|0]
  };
}
