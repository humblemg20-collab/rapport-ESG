/**
 * ============================================================
 * AFRIGREEN24 — ESG REPORT SCHEMA V1
 * ============================================================
 *
 * Modèle documentaire canonique.
 *
 * Invariants :
 * - le Document Engine consomme ce modèle ;
 * - il ne recalcule jamais le diagnostic ESG ;
 * - aucune donnée absente n'est inventée ;
 * - Snapshot / Diagnostic / Premium partagent ce même modèle ;
 * - le rapport client est white-label.
 */

var ESG_REPORT_SCHEMA_VERSION =
  "ESG_REPORT_SCHEMA_V1";

var ESG_REPORT_PROFILE_V1 = {
  SNAPSHOT:
    "SNAPSHOT",

  DIAGNOSTIC:
    "DIAGNOSTIC",

  PREMIUM:
    "PREMIUM"
};

var ESG_ROADMAP_HORIZON_V1 = {
  MONTHS_0_3:
    "0_3_MONTHS",

  MONTHS_3_12:
    "3_12_MONTHS",

  MONTHS_12_24:
    "12_24_MONTHS"
};


function creerESGReportSchemaV1Vide_() {
  return {
    schemaVersion:
      ESG_REPORT_SCHEMA_VERSION,

    generatedAt:
      new Date()
        .toISOString(),

    organization: {
      organizationId:
        "",

      name:
        "",

      legalType:
        "",

      sector:
        "",

      countries:
        [],

      mainCountry:
        "",

      employeeCount:
        null,

      annualRevenueOrBudget:
        null,

      creationYear:
        null,

      interventionZone:
        "",

      activities:
        [],

      beneficiaries:
        null,

      sourceRefs:
        [],

      fieldProvenance:
        {}
    },

    intake: {
      entryMode:
        "MANUAL",

      capturedAt:
        null,

      sourceDocuments:
        []
    },

    assessment: {
      assessmentId:
        "",

      schemaVersion:
        ESG_REPORT_SCHEMA_VERSION,

      scoringVersion:
        "",

      questionnaireVersion:
        "",

      startedAt:
        null,

      completedAt:
        null,

      period:
        null,

      responses:
        [],

      sourceRefs:
        []
    },

    scores: {
      environmentScore:
        null,

      socialScore:
        null,

      governanceScore:
        null,

      esgOverallScoreV2:
        null,

      readinessScore:
        null,

      dataConfidenceScore:
        null,

      legacyDataConfidenceScore:
        null,

      /*
       * Couverture de PREUVES CANONIQUES.
       * Ne doit jamais être alimentée par le simple score de preuve legacy.
       */
      evidenceCoverageScore:
        null,

      /*
       * Historique du moteur actuel pour compatibilité.
       */
      legacyEvidenceScore:
        null,

      fundingReadinessScore:
        null,

      legacyGlobalScoreV1:
        null,

      methodology: {
        esgOverallScoreV2:
          "EQUAL_WEIGHT_E_S_G_V2",

        legacyGlobalScoreV1:
          "LEGACY_ENGINE",

        canonicalEvidenceCoverage:
          "EVIDENCE_ENGINE_V1",

        canonicalDataConfidence:
          "AG24_DATA_QUALITY_V1"
      }
    },

    dataQualityProfile: {
      totalExpected:
        0,

      confirmedCount:
        0,

      declaredCount:
        0,

      calculatedCount:
        0,

      estimateCount:
        0,

      notAvailableCount:
        0,

      notAssessedCount:
        0,

      notApplicableCount:
        0,

      /*
       * Canonical evidence coverage.
       * null = Evidence Engine pas encore exécuté.
       */
      evidenceCoverageScore:
        null,

      legacyEvidenceScore:
        null,

      dataConfidenceScore:
        null,

      legacyDataConfidenceScore:
        null,

      methodologyVersion:
        "AG24_DATA_QUALITY_V1",

      warnings:
        [],

      limitations:
        []
    },

    stakeholders:
      [],

    valueChainStages:
      [],

    materiality: {
      status:
        ESG_DATA_STATUS_V1
          .NOT_ASSESSED,

      level:
        "NOT_ASSESSED",

      topics:
        []
    },

    /*
     * KPI = métriques mesurées.
     * Les indicateurs seulement recommandés sont séparés.
     */
    kpis:
      [],

    recommendedIndicators:
      [],

    targets:
      [],

    risks:
      [],

    mitigations:
      [],

    recommendations:
      [],

    roadmapActions:
      [],

    /*
     * Claims = affirmations destinées au rapport.
     * Une réponse de questionnaire n'est pas automatiquement un Claim.
     */
    claims:
      [],

    evidence:
      [],

    media:
      [],

    impacts:
      [],

    sdgMappings:
      [],

    frameworks:
      [],

    frameworkMappings:
      [],

    report: {
      reportId:
        "",

      profile:
        ESG_REPORT_PROFILE_V1
          .DIAGNOSTIC,

      language:
        "fr",

      period:
        null,

      whiteLabel:
        true,

      status:
        "MODEL_READY",

      sections:
        [],

      qualityGates:
        [],

      outputRefs:
        {}
    },

    /*
     * Métadonnées techniques internes.
     * Ne doivent jamais être rendues dans le rapport white-label.
     */
    systemMeta: {
      generatedBySystem:
        "AFRIGREEN24_ESG_ENGINE",

      aiGeneration:
        {
          primaryProvider:
            "OPENAI",

          fallbackProvider:
            "HUMBLEOS",

          executions:
            []
        }
    },

    legacy: {
      source:
        "AfriGreen24 ESG legacy engine",

      sourceVersion:
        "",

      adaptedAt:
        new Date()
          .toISOString()
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
  ].map(
    function(value) {
      return Number(
        value
      );
    }
  );

  var valid =
    values.every(
      function(value) {
        return isFinite(
          value
        );
      }
    );

  if (!valid) {
    return null;
  }

  var score =
    (
      values[0] +
      values[1] +
      values[2]
    ) /
    3;

  return Math.round(
    score * 100
  ) /
    100;
}


function normaliserProfilRapportESGV1_(
  profile
) {
  var value =
    String(
      profile ||
      ESG_REPORT_PROFILE_V1
        .DIAGNOSTIC
    ).toUpperCase();

  if (
    value !==
      ESG_REPORT_PROFILE_V1
        .SNAPSHOT &&
    value !==
      ESG_REPORT_PROFILE_V1
        .DIAGNOSTIC &&
    value !==
      ESG_REPORT_PROFILE_V1
        .PREMIUM
  ) {
    return ESG_REPORT_PROFILE_V1
      .DIAGNOSTIC;
  }

  return value;
}


function TEST_ESG_REPORT_SCHEMA_V1_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  var score =
    calculerESGOverallScoreV2DepuisPiliers_(
      60,
      70,
      80
    );

  return {
    success:
      model.schemaVersion ===
        ESG_REPORT_SCHEMA_VERSION &&
      model.materiality.status ===
        ESG_DATA_STATUS_V1
          .NOT_ASSESSED &&
      model.report.profile ===
        ESG_REPORT_PROFILE_V1
          .DIAGNOSTIC &&
      model.report.whiteLabel ===
        true &&
      Array.isArray(
        model.recommendedIndicators
      ) &&
      Array.isArray(
        model.stakeholders
      ) &&
      Array.isArray(
        model.valueChainStages
      ) &&
      Array.isArray(
        model.impacts
      ) &&
      Array.isArray(
        model.sdgMappings
      ) &&
      score ===
        70,

    schemaVersion:
      model.schemaVersion,

    scoreTest:
      score
  };
}
