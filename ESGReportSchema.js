/**
 * ============================================================
 * AFRIGREEN24 — ESG REPORT SCHEMA V1
 * ============================================================
 *
 * Modèle documentaire canonique.
 * Le Document Engine doit consommer ce modèle et ne jamais
 * recalculer le diagnostic ESG.
 */

var ESG_REPORT_SCHEMA_VERSION = "ESG_REPORT_SCHEMA_V1";

var ESG_REPORT_PROFILE_V1 = {
  SNAPSHOT: "SNAPSHOT",
  DIAGNOSTIC: "DIAGNOSTIC",
  PREMIUM: "PREMIUM"
};

var ESG_ROADMAP_HORIZON_V1 = {
  MONTHS_0_3: "0_3_MONTHS",
  MONTHS_3_12: "3_12_MONTHS",
  MONTHS_12_24: "12_24_MONTHS"
};


function creerESGReportSchemaV1Vide_() {
  return {
    schemaVersion: ESG_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),

    organization: {
      organizationId: "",
      name: "",
      legalType: "",
      sector: "",
      countries: [],
      mainCountry: "",
      employeeCount: null,
      annualRevenueOrBudget: null,
      creationYear: null,
      interventionZone: "",
      activities: [],
      beneficiaries: null,
      valueChainSummary: null,
      sourceRefs: []
    },

    assessment: {
      assessmentId: "",
      schemaVersion: ESG_REPORT_SCHEMA_VERSION,
      scoringVersion: "",
      questionnaireVersion: "",
      startedAt: null,
      completedAt: null,
      period: null,
      responses: [],
      sourceRefs: []
    },

    scores: {
      environmentScore: null,
      socialScore: null,
      governanceScore: null,
      esgOverallScoreV2: null,
      readinessScore: null,
      dataConfidenceScore: null,
      evidenceCoverageScore: null,
      fundingReadinessScore: null,
      legacyGlobalScoreV1: null,
      methodology: {
        esgOverallScoreV2: "EQUAL_WEIGHT_E_S_G_V2",
        legacyGlobalScoreV1: "LEGACY_ENGINE"
      }
    },

    dataQualityProfile: {
      totalExpected: 0,
      confirmedCount: 0,
      declaredCount: 0,
      calculatedCount: 0,
      estimateCount: 0,
      notAvailableCount: 0,
      notAssessedCount: 0,
      notApplicableCount: 0,
      evidenceCoverageScore: null,
      dataConfidenceScore: null,
      warnings: [],
      limitations: []
    },

    kpis: [],
    targets: [],
    materiality: {
      status: ESG_DATA_STATUS_V1.NOT_ASSESSED,
      level: "NOT_ASSESSED",
      topics: []
    },
    risks: [],
    mitigations: [],
    recommendations: [],
    roadmapActions: [],
    claims: [],
    evidence: [],
    media: [],
    frameworks: [],
    frameworkMappings: [],

    report: {
      reportId: "",
      profile: ESG_REPORT_PROFILE_V1.DIAGNOSTIC,
      language: "fr",
      period: null,
      status: "MODEL_READY",
      sections: [],
      outputRefs: {}
    },

    legacy: {
      source: "AfriGreen24 ESG legacy engine",
      sourceVersion: "",
      adaptedAt: new Date().toISOString()
    }
  };
}


function calculerESGOverallScoreV2DepuisPiliers_(
  environmentScore,
  socialScore,
  governanceScore
) {
  var values = [
    environmentScore,
    socialScore,
    governanceScore
  ].map(function(value) {
    return Number(value);
  });

  var valid = values.every(function(value) {
    return isFinite(value);
  });

  if (!valid) {
    return null;
  }

  var score =
    (
      values[0] +
      values[1] +
      values[2]
    ) / 3;

  return Math.round(score * 100) / 100;
}


function normaliserProfilRapportESGV1_(profile) {
  var value = String(
    profile || ESG_REPORT_PROFILE_V1.DIAGNOSTIC
  ).toUpperCase();

  if (
    value !== ESG_REPORT_PROFILE_V1.SNAPSHOT &&
    value !== ESG_REPORT_PROFILE_V1.DIAGNOSTIC &&
    value !== ESG_REPORT_PROFILE_V1.PREMIUM
  ) {
    return ESG_REPORT_PROFILE_V1.DIAGNOSTIC;
  }

  return value;
}


function TEST_ESG_REPORT_SCHEMA_V1_LOCAL() {
  var model = creerESGReportSchemaV1Vide_();

  return {
    success:
      model.schemaVersion === ESG_REPORT_SCHEMA_VERSION &&
      model.materiality.status === ESG_DATA_STATUS_V1.NOT_ASSESSED &&
      model.report.profile === ESG_REPORT_PROFILE_V1.DIAGNOSTIC,

    schemaVersion: model.schemaVersion
  };
}
