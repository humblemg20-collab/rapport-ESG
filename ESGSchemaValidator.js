/**
 * ============================================================
 * AFRIGREEN24 — ESG REPORT SCHEMA VALIDATOR V1
 * ============================================================
 *
 * Validation structurelle avant composition documentaire.
 */

function validerESGReportSchemaV1(
  model
) {
  var errors = [];
  var warnings = [];

  if (
    !model ||
    typeof model !==
      "object"
  ) {
    return {
      valid:
        false,

      errors: [
        "Model absent ou invalide."
      ],

      warnings:
        []
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
      model.organization.name ||
      ""
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
      "legacyDataConfidenceScore",
      "evidenceCoverageScore",
      "legacyEvidenceScore",
      "fundingReadinessScore",
      "legacyGlobalScoreV1"
    ].forEach(
      function(field) {
        validerScoreOptionnelESGV1_(
          field,
          model.scores[
            field
          ],
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

  validerIntakeESGV1_(
    model,
    errors,
    warnings
  );

  var responses =
    model.assessment &&
    Array.isArray(
      model.assessment.responses
    )
      ? model
          .assessment
          .responses
      : [];

  var responseIds = {};
  var sourceDocumentIds =
    construireIndexDocumentsSourceESGV1_(
      model
    );

  responses.forEach(
    function(
      response,
      index
    ) {
      var prefix =
        "assessment.responses[" +
        index +
        "]";

      if (
        !response.responseId
      ) {
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
          response
            .validationStatus
        )
      ) {
        errors.push(
          prefix +
          ".validationStatus invalide."
        );
      }

      if (
        !estApplicabilityStatusESGV1Valide_(
          response
            .applicabilityStatus
        )
      ) {
        errors.push(
          prefix +
          ".applicabilityStatus invalide."
        );
      }

      var inputMethod =
        String(
          response.inputMethod ||
          ""
        );

      if (
        inputMethod !==
          ESG_INPUT_METHOD_V1
            .MANUAL &&
        inputMethod !==
          ESG_INPUT_METHOD_V1
            .DOCUMENT_EXTRACTION
      ) {
        errors.push(
          prefix +
          ".inputMethod invalide."
        );
      }

      if (
        inputMethod ===
          ESG_INPUT_METHOD_V1
            .DOCUMENT_EXTRACTION
      ) {
        if (
          !response
            .sourceDocumentId
        ) {
          warnings.push(
            prefix +
            " provient d'un document mais sourceDocumentId est vide."
          );
        } else if (
          !sourceDocumentIds[
            response
              .sourceDocumentId
          ]
        ) {
          warnings.push(
            prefix +
            " référence un sourceDocumentId absent de intake.sourceDocuments."
          );
        }
      }

      if (
        response.dataStatus ===
          ESG_DATA_STATUS_V1
            .CONFIRMED &&
        (
          !Array.isArray(
            response.evidenceIds
          ) ||
          response
            .evidenceIds
            .length ===
            0
        )
      ) {
        errors.push(
          prefix +
          " est CONFIRMED sans evidenceIds."
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
    model.recommendedIndicators,
    "recommendedIndicatorId",
    "recommendedIndicators",
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

  validerCollectionIdsESGV1_(
    model.impacts,
    "impactId",
    "impacts",
    errors
  );

  validerCollectionIdsESGV1_(
    model.sdgMappings,
    "sdgMappingId",
    "sdgMappings",
    errors
  );

  validerCollectionTableauESGV1_(
    model.stakeholders,
    "stakeholders",
    errors
  );

  validerCollectionTableauESGV1_(
    model.valueChainStages,
    "valueChainStages",
    errors
  );

  validerCollectionTableauESGV1_(
    model.targets,
    "targets",
    errors
  );

  validerCollectionTableauESGV1_(
    model.mitigations,
    "mitigations",
    errors
  );

  validerCollectionTableauESGV1_(
    model.media,
    "media",
    errors
  );

  validerCollectionTableauESGV1_(
    model.frameworks,
    "frameworks",
    errors
  );

  validerCollectionTableauESGV1_(
    model.frameworkMappings,
    "frameworkMappings",
    errors
  );

  validerKPIsESGV1_(
    model.kpis || [],
    errors,
    warnings
  );

  validerRisquesESGV1_(
    model.risks || [],
    warnings
  );

  validerRoadmapESGV1_(
    model.roadmapActions ||
      [],
    errors,
    warnings
  );

  validerEvidenceLinksESGV1_(
    model,
    errors
  );

  validerMaterialiteESGV1_(
    model.materiality,
    errors
  );

  validerWhiteLabelESGV1_(
    model,
    errors
  );

  /*
   * Contradiction interdite :
   * un score de couverture canonique ne peut pas exister
   * lorsqu'aucune preuve canonique n'existe.
   */
  if (
    (!model.evidence ||
      model.evidence.length === 0) &&
    model.scores &&
    model.scores
      .evidenceCoverageScore !==
      null &&
    model.scores
      .evidenceCoverageScore !==
      undefined
  ) {
    errors.push(
      "evidenceCoverageScore canonique défini alors que evidence[] est vide."
    );
  }

  if (
    model.dataQualityProfile &&
    Number(
      model
        .dataQualityProfile
        .confirmedCount ||
      0
    ) === 0
  ) {
    warnings.push(
      "Aucune donnée CONFIRMED dans le modèle."
    );
  }

  return {
    valid:
      errors.length ===
      0,

    errors:
      errors,

    warnings:
      warnings,

    checkedAt:
      new Date()
        .toISOString()
  };
}


function validerIntakeESGV1_(
  model,
  errors,
  warnings
) {
  if (!model.intake) {
    errors.push(
      "intake est obligatoire."
    );
    return;
  }

  var entryMode =
    String(
      model.intake.entryMode ||
      ""
    );

  if (
    entryMode !== "MANUAL" &&
    entryMode !==
      "DOCUMENT_IMPORT"
  ) {
    errors.push(
      "intake.entryMode invalide."
    );
  }

  if (
    !Array.isArray(
      model
        .intake
        .sourceDocuments
    )
  ) {
    errors.push(
      "intake.sourceDocuments doit être un tableau."
    );
    return;
  }

  if (
    entryMode ===
      "DOCUMENT_IMPORT" &&
    model
      .intake
      .sourceDocuments
      .length ===
      0
  ) {
    warnings.push(
      "DOCUMENT_IMPORT sans sourceDocuments."
    );
  }

  var ids = {};

  model
    .intake
    .sourceDocuments
    .forEach(
      function(
        document,
        index
      ) {
        var id =
          String(
            document &&
            document
              .sourceDocumentId ||
            ""
          );

        if (!id) {
          errors.push(
            "intake.sourceDocuments[" +
            index +
            "].sourceDocumentId manquant."
          );
          return;
        }

        if (ids[id]) {
          errors.push(
            "sourceDocumentId dupliqué : " +
            id
          );
        }

        ids[id] =
          true;
      }
    );
}


function construireIndexDocumentsSourceESGV1_(
  model
) {
  var index = {};

  (
    model &&
    model.intake &&
    Array.isArray(
      model
        .intake
        .sourceDocuments
    )
      ? model
          .intake
          .sourceDocuments
      : []
  ).forEach(
    function(document) {
      if (
        document &&
        document
          .sourceDocumentId
      ) {
        index[
          document
            .sourceDocumentId
        ] = true;
      }
    }
  );

  return index;
}


function validerKPIsESGV1_(
  kpis,
  errors,
  warnings
) {
  (kpis || [])
    .forEach(
      function(
        kpi,
        index
      ) {
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
            kpi
              .validationStatus
          )
        ) {
          errors.push(
            "kpis[" +
            index +
            "].validationStatus invalide."
          );
        }

        if (
          !String(
            kpi.unit || ""
          ).trim()
        ) {
          warnings.push(
            "KPI " +
            String(
              kpi.kpiId ||
              index
            ) +
            " sans unité."
          );
        }

        if (
          kpi.targetValue !==
            null &&
          kpi.targetValue !==
            undefined &&
          (
            kpi.targetYear ===
              null ||
            kpi.targetYear ===
              undefined ||
            kpi.targetYear ===
              ""
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
}


function validerRisquesESGV1_(
  risks,
  warnings
) {
  (risks || [])
    .forEach(
      function(risk) {
        var hasLikelihood =
          risk.likelihood !==
            null &&
          risk.likelihood !==
            undefined;

        var hasImpact =
          risk.impact !==
            null &&
          risk.impact !==
            undefined;

        if (
          hasLikelihood !==
          hasImpact
        ) {
          warnings.push(
            "Risk " +
            risk.riskId +
            " : likelihood et impact doivent être évalués ensemble avant heatmap."
          );
        }
      }
    );
}


function validerRoadmapESGV1_(
  actions,
  errors,
  warnings
) {
  var allowed = {};

  allowed[
    ESG_ROADMAP_HORIZON_V1
      .MONTHS_0_3
  ] = true;

  allowed[
    ESG_ROADMAP_HORIZON_V1
      .MONTHS_3_12
  ] = true;

  allowed[
    ESG_ROADMAP_HORIZON_V1
      .MONTHS_12_24
  ] = true;

  (actions || [])
    .forEach(
      function(
        action,
        index
      ) {
        if (
          action.horizon ===
            null ||
          action.horizon ===
            undefined ||
          action.horizon ===
            ""
        ) {
          if (
            action
              .migrationStatus !==
            "NEEDS_RECLASSIFICATION"
          ) {
            errors.push(
              "roadmapActions[" +
              index +
              "] sans horizon et sans statut NEEDS_RECLASSIFICATION."
            );
          } else {
            warnings.push(
              "Action legacy à reclasser : " +
              String(
                action.actionId ||
                index
              )
            );
          }

          return;
        }

        if (
          !allowed[
            action.horizon
          ]
        ) {
          errors.push(
            "roadmapActions[" +
            index +
            "].horizon invalide."
          );
        }
      }
    );
}


function validerEvidenceLinksESGV1_(
  model,
  errors
) {
  var evidenceIds = {};

  (model.evidence || [])
    .forEach(
      function(evidence) {
        if (
          evidence &&
          evidence.evidenceId
        ) {
          evidenceIds[
            evidence.evidenceId
          ] = true;
        }
      }
    );

  function verifierLiens_(
    collection,
    label
  ) {
    (collection || [])
      .forEach(
        function(
          item,
          index
        ) {
          (
            item.evidenceIds ||
            []
          ).forEach(
            function(
              evidenceId
            ) {
              if (
                !evidenceIds[
                  evidenceId
                ]
              ) {
                errors.push(
                  label +
                  "[" +
                  index +
                  "] référence une preuve inexistante : " +
                  evidenceId
                );
              }
            }
          );
        }
      );
  }

  verifierLiens_(
    model.claims,
    "claims"
  );

  verifierLiens_(
    model.kpis,
    "kpis"
  );

  verifierLiens_(
    model.risks,
    "risks"
  );
}


function validerMaterialiteESGV1_(
  materiality,
  errors
) {
  if (!materiality) {
    errors.push(
      "materiality est obligatoire."
    );
    return;
  }

  if (
    !Array.isArray(
      materiality.topics
    )
  ) {
    errors.push(
      "materiality.topics doit être un tableau."
    );
    return;
  }

  if (
    materiality.level ===
      "ADVANCED"
  ) {
    materiality
      .topics
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
}


function validerWhiteLabelESGV1_(
  model,
  errors
) {
  if (
    !model.report ||
    model.report.whiteLabel !==
      true
  ) {
    errors.push(
      "report.whiteLabel doit être true."
    );
  }
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
    Number(
      value
    );

  if (
    !isFinite(
      number
    ) ||
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
  if (
    !Array.isArray(
      items
    )
  ) {
    errors.push(
      label +
      " doit être un tableau."
    );
    return;
  }

  var seen = {};

  items.forEach(
    function(
      item,
      index
    ) {
      var id =
        item &&
        item[idField]
          ? String(
              item[
                idField
              ]
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

      seen[id] =
        true;
    }
  );
}


function validerCollectionTableauESGV1_(
  items,
  label,
  errors
) {
  if (
    !Array.isArray(
      items
    )
  ) {
    errors.push(
      label +
      " doit être un tableau."
    );
  }
}


function TEST_ESG_SCHEMA_VALIDATOR_V1_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  model.organization.name =
    "Organisation test";

  model.scores.environmentScore =
    60;

  model.scores.socialScore =
    70;

  model.scores.governanceScore =
    80;

  model.scores.esgOverallScoreV2 =
    70;

  var result =
    validerESGReportSchemaV1(
      model
    );

  return {
    success:
      result.valid ===
        true,

    result:
      result
  };
}
