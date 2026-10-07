/**
 * ============================================================
 * AFRIGREEN24 — ESG DATA QUALITY ENGINE V1
 * ============================================================
 *
 * Score canonique de confiance documentaire.
 *
 * Formule AG24_DATA_QUALITY_V1 :
 * 50 % complétude des réponses applicables
 * 30 % couverture par preuves canoniques vérifiées
 * 20 % revue / confirmation utilisateur
 *
 * Cette formule est une règle interne versionnée.
 * Elle n'est pas présentée comme un standard externe.
 */

var ESG_DATA_QUALITY_ENGINE_CONFIG_V1 = {
  version:
    "AG24_DATA_QUALITY_V1",

  weights: {
    completeness:
      0.50,

    evidenceCoverage:
      0.30,

    userReview:
      0.20
  }
};


function executerDataQualityEngineESGV1(
  canonicalModel
) {
  if (
    !canonicalModel ||
    canonicalModel.schemaVersion !==
      ESG_REPORT_SCHEMA_VERSION
  ) {
    throw new Error(
      "Canonical model invalide pour Data Quality Engine V1."
    );
  }

  var model =
    JSON.parse(
      JSON.stringify(
        canonicalModel
      )
    );

  var responses =
    model.assessment &&
    Array.isArray(
      model.assessment.responses
    )
      ? model.assessment.responses
      : [];

  var counts = {
    totalExpected:
      responses.length,

    applicable:
      0,

    usable:
      0,

    userReviewedUsable:
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
      0
  };

  responses.forEach(
    function(response) {
      if (!response) {
        return;
      }

      if (
        response
          .applicabilityStatus ===
        ESG_APPLICABILITY_STATUS_V1
          .NOT_APPLICABLE
      ) {
        counts
          .notApplicableCount++;

        return;
      }

      counts.applicable++;

      switch (
        response.dataStatus
      ) {
        case ESG_DATA_STATUS_V1
          .CONFIRMED:
          counts.confirmedCount++;
          counts.usable++;
          break;

        case ESG_DATA_STATUS_V1
          .DECLARED:
          counts.declaredCount++;
          counts.usable++;
          break;

        case ESG_DATA_STATUS_V1
          .CALCULATED:
          counts.calculatedCount++;
          counts.usable++;
          break;

        case ESG_DATA_STATUS_V1
          .ESTIMATE:
          counts.estimateCount++;
          counts.usable++;
          break;

        case ESG_DATA_STATUS_V1
          .NOT_AVAILABLE:
          counts.notAvailableCount++;
          break;

        case ESG_DATA_STATUS_V1
          .NOT_ASSESSED:
          counts.notAssessedCount++;
          break;
      }

      if (
        response.userConfirmed ===
          true &&
        [
          ESG_DATA_STATUS_V1
            .CONFIRMED,
          ESG_DATA_STATUS_V1
            .DECLARED,
          ESG_DATA_STATUS_V1
            .CALCULATED,
          ESG_DATA_STATUS_V1
            .ESTIMATE
        ].indexOf(
          response.dataStatus
        ) !== -1
      ) {
        counts
          .userReviewedUsable++;
      }
    }
  );

  var completenessScore =
    counts.applicable > 0
      ? arrondirQualiteESGV1_(
          counts.usable /
          counts.applicable *
          100
        )
      : 0;

  var evidenceCoverageScore =
    valeurScoreQualiteESGV1_(
      model.scores &&
      model.scores
        .evidenceCoverageScore
    );

  var userReviewScore =
    counts.usable > 0
      ? arrondirQualiteESGV1_(
          counts
            .userReviewedUsable /
          counts.usable *
          100
        )
      : 0;

  var weights =
    ESG_DATA_QUALITY_ENGINE_CONFIG_V1
      .weights;

  var dataConfidenceScore =
    arrondirQualiteESGV1_(
      completenessScore *
        weights.completeness +
      evidenceCoverageScore *
        weights.evidenceCoverage +
      userReviewScore *
        weights.userReview
    );

  var warnings = [];

  if (
    counts.notAvailableCount >
    0
  ) {
    warnings.push(
      counts.notAvailableCount +
      " donnée(s) applicable(s) sont indisponibles."
    );
  }

  if (
    evidenceCoverageScore <
    25
  ) {
    warnings.push(
      "Couverture de preuves canoniques faible."
    );
  }

  if (
    userReviewScore <
    50 &&
    model.intake &&
    model.intake.entryMode ===
      "DOCUMENT_IMPORT"
  ) {
    warnings.push(
      "Une part importante des informations préremplies n'a pas encore été confirmée par l'utilisateur."
    );
  }

  model.scores
    .dataConfidenceScore =
    dataConfidenceScore;

  model.dataQualityProfile =
    Object.assign(
      {},
      model.dataQualityProfile ||
        {},
      {
        totalExpected:
          counts.totalExpected,

        applicableCount:
          counts.applicable,

        usableCount:
          counts.usable,

        confirmedCount:
          counts.confirmedCount,

        declaredCount:
          counts.declaredCount,

        calculatedCount:
          counts.calculatedCount,

        estimateCount:
          counts.estimateCount,

        notAvailableCount:
          counts.notAvailableCount,

        notAssessedCount:
          counts.notAssessedCount,

        notApplicableCount:
          counts.notApplicableCount,

        completenessScore:
          completenessScore,

        evidenceCoverageScore:
          evidenceCoverageScore,

        userReviewScore:
          userReviewScore,

        dataConfidenceScore:
          dataConfidenceScore,

        methodologyVersion:
          ESG_DATA_QUALITY_ENGINE_CONFIG_V1
            .version,

        weights:
          JSON.parse(
            JSON.stringify(
              weights
            )
          ),

        warnings:
          fusionnerMessagesQualiteESGV1_(
            model
              .dataQualityProfile &&
            model
              .dataQualityProfile
              .warnings,
            warnings
          )
      }
    );

  return {
    success:
      true,

    model:
      model,

    scores: {
      completeness:
        completenessScore,

      evidenceCoverage:
        evidenceCoverageScore,

      userReview:
        userReviewScore,

      dataConfidence:
        dataConfidenceScore
    },

    counts:
      counts,

    warnings:
      warnings
  };
}


function valeurScoreQualiteESGV1_(
  value
) {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return 0;
  }

  var number =
    Number(
      value
    );

  if (!isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      number
    )
  );
}


function arrondirQualiteESGV1_(
  value
) {
  return Math.round(
    Number(
      value || 0
    ) *
    100
  ) /
    100;
}


function fusionnerMessagesQualiteESGV1_(
  a,
  b
) {
  var seen = {};

  return []
    .concat(
      a || [],
      b || []
    )
    .filter(
      function(message) {
        var key =
          String(
            message || ""
          );

        if (
          !key ||
          seen[key]
        ) {
          return false;
        }

        seen[key] =
          true;

        return true;
      }
    );
}


function TEST_ESG_DATA_QUALITY_ENGINE_V1_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  model.organization.name =
    "Organisation test";

  model.assessment.responses = [
    {
      responseId:
        "R1",

      questionId:
        "Q1",

      dataStatus:
        "DECLARED",

      validationStatus:
        "UNREVIEWED",

      applicabilityStatus:
        "APPLICABLE",

      inputMethod:
        "MANUAL",

      userConfirmed:
        true,

      evidenceIds:
        []
    },
    {
      responseId:
        "R2",

      questionId:
        "Q2",

      dataStatus:
        "DECLARED",

      validationStatus:
        "UNREVIEWED",

      applicabilityStatus:
        "APPLICABLE",

      inputMethod:
        "DOCUMENT_EXTRACTION",

      userConfirmed:
        false,

      evidenceIds: [
        "EV-2"
      ]
    }
  ];

  model.evidence = [
    {
      evidenceId:
        "EV-2",

      validationStatus:
        "INTERNALLY_VERIFIED"
    }
  ];

  model.scores
    .evidenceCoverageScore =
    50;

  model.intake.entryMode =
    "DOCUMENT_IMPORT";

  var result =
    executerDataQualityEngineESGV1(
      model
    );

  /*
   * completeness = 100
   * evidence = 50
   * user review = 50
   * total = 50 + 15 + 10 = 75
   */
  return {
    success:
      result
        .scores
        .dataConfidence ===
        75,

    result:
      result.scores
  };
}
