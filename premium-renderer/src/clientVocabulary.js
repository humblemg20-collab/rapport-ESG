/**
 * Client-facing vocabulary.
 * Internal engine/status codes may exist in the canonical model, but must never
 * leak into a white-label report.
 */

const EXACT_LABELS = Object.freeze({
  AG24_DATA_QUALITY_V1: "Méthode de qualité des données",
  EQUAL_WEIGHT_E_S_G_V2: "Pondération équilibrée des piliers E, S et G",
  EVIDENCE_ENGINE_V1: "Évaluation de la couverture des preuves",
  LEGACY_ENGINE: "Méthode historique",

  CONFIRMED: "Confirmée",
  DECLARED: "Déclarée",
  CALCULATED: "Calculée",
  ESTIMATE: "Estimation",
  NOT_AVAILABLE: "Non disponible",
  NOT_ASSESSED: "Non évaluée",
  NOT_APPLICABLE: "Non applicable",
  PRELIMINARY: "Préliminaire",

  CRITICAL: "Critique",
  HIGH: "Élevé",
  MEDIUM: "Modéré",
  LOW: "Faible",

  CRITIQUE: "Critique",
  ELEVE: "Élevé",
  "ÉLEVÉ": "Élevé",
  MODERE: "Modéré",
  "MODÉRÉ": "Modéré",
  FAIBLE: "Faible"
});

const INTERNAL_CODE_PATTERNS = Object.freeze([
  /\bAG24_[A-Z0-9_]+\b/g,
  /\bEQUAL_WEIGHT_E_S_G_V\d+\b/g,
  /\bEVIDENCE_ENGINE_V\d+\b/g,
  /\bLEGACY_ENGINE\b/g,
  /\bNOT_ASSESSED\b/g,
  /\bNOT_AVAILABLE\b/g,
  /\bNOT_APPLICABLE\b/g
]);

export function clientLabel(value, fallback = "—") {
  const raw = String(value ?? "").trim();

  if (!raw) return fallback;

  const exact = EXACT_LABELS[raw.toUpperCase()];
  if (exact) return exact;

  /*
   * Unknown machine-looking values are humanised rather than exposed verbatim.
   * This is presentation-only and never mutates the canonical source value.
   */
  if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(raw)) {
    const words = raw
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .join(" ");

    return words
      ? words.charAt(0).toUpperCase() + words.slice(1)
      : fallback;
  }

  return raw;
}

export function findInternalClientLeaks(text) {
  const source = String(text || "");
  const leaks = [];

  for (const pattern of INTERNAL_CODE_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of source.matchAll(pattern)) {
      leaks.push(match[0]);
    }
  }

  return [...new Set(leaks)];
}

export const _test = {
  EXACT_LABELS,
  INTERNAL_CODE_PATTERNS
};
