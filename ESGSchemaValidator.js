/**
 * ============================================================
 * AFRIGREEN24 — ESG REPORT SCHEMA VALIDATOR V1
 * ============================================================
 *
 * Validation structurelle avant composition documentaire.
 */

function validerESGReportSchemaV1(model) {
  var errors = [];
  var warnings = [];

  if (!model || typeof model !== "object") {
    return {
      valid: false,
      errors: ["Model absent ou invalide."],
      warnings: []
    };
  }

  if (
    model.schemaVersion !==
    ESG_REPORT_SCHEMA_VERSION
  ) {
    errors.push(
      "schemaVersion invalide."
    );
  }

  if (
    !model.organization ||
    !String(
      model.organization.name || ""
    ).trim()
  ) {
    errors.push(
      "organization.name est obligatoire."
    );
  }

  if (!model.assessment) {
    errors.push(
      "assessment est obligatoire."
    );
  }

  if (!model.scores) {
    errors.push(
      "scores est obligatoire."
    );
  } else {
    [
      "environmentScore",
      "socialScore",
      "governanceScore",
      "esgOverallScoreV2",
      "readinessScore",
      "dataConfidenceScore",
      "evidenceCoverageScore",
      "legacyGlobalScoreV1"
    ].forEach(
      function(field) {
        validerScoreOptionnelESGV1_(
          field,
          model.scores[field],
          errors
        );
      }
    );
  }

  if (
    !model.dataQualityProfile
  ) {
    errors.push(
      "dataQualityProfile est obligatoire."
    );
  }

  var responses =
    model.assessment &&
    Array.isArray(
      model.assessment.responses
    )
      ? model.assessment.responses
      : [];

  var responseIds = {};

  responses.forEach(
    function(response, index) {
      var prefix =
        "assessment.responses[" +
        index +
        "]";

      if (!response.responseId) {
        errors.push(
          prefix +
          ".responseId manquant."
        );
      } else if (
        responseIds[
          response.responseId
        ]
      ) {
        errors.push(
          "responseId dupliqué : " +
          response.responseId
        );
      } else {
        responseIds[
          response.responseId
        ] = true;
      }

      if (
        !estDataStatusESGV1Valide_(
          response.dataStatus
        )
      ) {
        errors.push(
          prefix +
          ".dataStatus invalide."
        );
      }

      if (
        !estValidationStatusESGV1Valide_(
          response.validationStatus
        )
      ) {
        errors.push(
          prefix +
          ".validationStatus invalide."
        );
      }

      if (
        !estApplicabilityStatusESGV1Valide_(
          response.applicabilityStatus
        )
      ) {
        errors.push(
          prefix +
          ".applicabilityStatus invalide."
        );
      }
    }
  );

  validerCollectionIdsESGV1_(
    model.kpis,
    "kpiId",
    "kpis",
    errors
  );

  validerCollectionIdsESGV1_(
    model.risks,
    "riskId",
    "risks",
    errors
  );

  validerCollectionIdsESGV1_(
    model.recommendations,
    "recommendationId",
    "recommendations",
    errors
  );

  validerCollectionIdsESGV1_(
    model.roadmapActions,
    "actionId",
    "roadmapActions",
    errors
  );

  validerCollectionIdsESGV1_(
    model.claims,
    "claimId",
    "claims",
    errors
  );

  validerCollectionIdsESGV1_(
    model.evidence,
    "evidenceId",
    "evidence",
    errors
  );

  (model.kpis || []).forEach(
    function(kpi, index) {
      if (
        !estDataStatusESGV1Valide_(
          kpi.dataStatus
        )
      ) {
        errors.push(
          "kpis[" +
          index +
          "].dataStatus invalide."
        );
      }

      if (
        !estValidationStatusESGV1Valide_(
          kpi.validationStatus
        )
      ) {
        errors.push(
          "kpis[" +
          index +
          "].validationStatus invalide."
        );
      }

      if (
        kpi.targetValue !== null &&
        kpi.targetValue !== undefined &&
        (
          kpi.targetYear === null ||
          kpi.targetYear === undefined ||
          kpi.targetYear === ""
        )
      ) {
        warnings.push(
          "KPI " +
          kpi.kpiId +
          " : targetValue sans targetYear."
        );
      }
    }
  );

  (model.risks || []).forEach(
    function(risk) {
      var hasLikelihood =
        risk.likelihood !== null &&
        risk.likelihood !== undefined;

      var hasImpact =
        risk.impact !== null &&
        risk.impact !== undefined;

      if (
        hasLikelihood !== hasImpact
      ) {
        warnings.push(
          "Risk " +
          risk.riskId +
          " : likelihood et impact doivent être évalués ensemble avant heatmap."
        );
      }
    }
  );

  if (
    model.materiality &&
    model.materiality.level ===
    "ADVANCED"
  ) {
    (model.materiality.topics || [])
      .forEach(
        function(topic) {
          if (
            topic.impactMateriality ===
              null ||
            topic.impactMateriality ===
              undefined ||
            topic.financialMateriality ===
              null ||
            topic.financialMateriality ===
              undefined
          ) {
            errors.push(
              "Materiality Advanced : les deux axes sont obligatoires."
            );
          }
        }
      );
  }

  if (
    model.dataQualityProfile &&
    Number(
      model.dataQualityProfile.confirmedCount ||
      0
    ) === 0
  ) {
    warnings.push(
      "Aucune donnée CONFIRMED dans le modèle."
    );
  }

  return {
    valid:
      errors.length === 0,

    errors:
      errors,

    warnings:
      warnings,

    checkedAt:
      new Date().toISOString()
  };
}


function validerScoreOptionnelESGV1_(
  field,
  value,
  errors
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return;
  }

  var number =
    Number(value);

  if (
    !isFinite(number) ||
    number < 0 ||
    number > 100
  ) {
    errors.push(
      field +
      " doit être compris entre 0 et 100."
    );
  }
}


function validerCollectionIdsESGV1_(
  items,
  idField,
  label,
  errors
) {
  if (!Array.isArray(items)) {
    errors.push(
      label +
      " doit être un tableau."
    );
    return;
  }

  var seen = {};

  items.forEach(
    function(item, index) {
      var id =
        item &&
        item[idField]
          ? String(
              item[idField]
            )
          : "";

      if (!id) {
        errors.push(
          label +
          "[" +
          index +
          "]." +
          idField +
          " manquant."
        );
        return;
      }

      if (seen[id]) {
        errors.push(
          label +
          " : ID dupliqué " +
          id
        );
      }

      seen[id] = true;
    }
  );
}


function TEST_ESG_SCHEMA_VALIDATOR_V1_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  model.organization.name =
    "Organisation test";

  model.scores.environmentScore = 60;
  model.scores.socialScore = 70;
  model.scores.governanceScore = 80;
  model.scores.esgOverallScoreV2 = 70;

  var result =
    validerESGReportSchemaV1(
      model
    );

  return {
    success:
      result.valid === true,

    result:
      result
  };
}
