export const CONTRACT_VERSION = "ESG_PRESENTATION_CONTRACT_V2";
export const ENGINE_VERSION = "ESG_PREMIUM_HTML_RENDERER_V2";

export const DESIGN_PROFILES = Object.freeze({
  INVESTOR_PREMIUM_V1: Object.freeze({
    id: "INVESTOR_PREMIUM_V1",
    active: true,
    tokens: Object.freeze({
      ink: "#0D1B1E",
      inkSoft: "#405257",
      paper: "#F7F8F6",
      surface: "#FFFFFF",
      accent: "#176B5A",
      accentDeep: "#0D4A3E",
      accentSoft: "#DDEBE7",
      gold: "#B79252",
      line: "#D7DFDC",
      danger: "#9E3F3F",
      warning: "#A56C19",
      success: "#2D7359"
    })
  }),

  INSTITUTIONAL_V1: Object.freeze({
    id: "INSTITUTIONAL_V1",
    active: false
  }),

  IMPACT_V1: Object.freeze({
    id: "IMPACT_V1",
    active: false
  })
});

export const SECTOR_PROFILES = Object.freeze({
  GENERIC: Object.freeze({
    id: "GENERIC",
    eyebrow: "ESG intelligence"
  }),

  ENERGY: Object.freeze({
    id: "ENERGY",
    eyebrow: "Energy transition & ESG"
  }),

  AGRICULTURE: Object.freeze({
    id: "AGRICULTURE",
    eyebrow: "Resilient value chains & ESG"
  }),

  FINTECH: Object.freeze({
    id: "FINTECH",
    eyebrow: "Responsible finance & ESG"
  }),

  MANUFACTURING: Object.freeze({
    id: "MANUFACTURING",
    eyebrow: "Industrial performance & ESG"
  }),

  HEALTH: Object.freeze({
    id: "HEALTH",
    eyebrow: "Health systems & ESG"
  }),

  INFRASTRUCTURE: Object.freeze({
    id: "INFRASTRUCTURE",
    eyebrow: "Infrastructure resilience & ESG"
  }),

  NGO_IMPACT: Object.freeze({
    id: "NGO_IMPACT",
    eyebrow: "Impact, accountability & ESG"
  })
});

export function resolveDesignProfile(requested) {
  const key = String(requested || "INVESTOR_PREMIUM_V1").toUpperCase();
  const profile = DESIGN_PROFILES[key];

  if (!profile || profile.active !== true) {
    return DESIGN_PROFILES.INVESTOR_PREMIUM_V1;
  }

  return profile;
}

export function resolveSectorProfile(requested) {
  const key = String(requested || "GENERIC").toUpperCase();
  return SECTOR_PROFILES[key] || SECTOR_PROFILES.GENERIC;
}

export function isHexColor(value) {
  return /^#[0-9A-F]{6}$/i.test(String(value || ""));
}

export function buildRuntimeTokens(designProfile, brandProfile = {}) {
  const base = designProfile.tokens;
  const primary = isHexColor(brandProfile.primaryColor)
    ? brandProfile.primaryColor.toUpperCase()
    : base.accent;

  const secondary = isHexColor(brandProfile.secondaryColor)
    ? brandProfile.secondaryColor.toUpperCase()
    : base.gold;

  return {
    ...base,
    accent: primary,
    gold: secondary
  };
}
