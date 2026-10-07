/**
 * ============================================================
 * ESG QUALITY GATE ENGINE V1
 * ============================================================
 *
 * Quality gates déterministes avant rendu documentaire.
 * Le PDF_RENDER_CHECK est exécuté séparément après export PDF.
 */

var ESG_QC_ENGINE_VERSION_V1 =
  "ESG_QC_ENGINE_V1";


function executerQualityGatesESGV1(
  model
) {
  var gates = [];

  gates.push(
    gateSchemaValidESGV1_(
      model
    )
  );

  gates.push(
    gateScoreConsistentESGV1_(
      model
    )
  );

  gates.push(
    gateNumericClaimsESGV1_(
      model
    )
  );

  gates.push(
    gateKPIUnitsESGV1_(
      model
    )
  );

  gates.push(
    gateTargetYearsESGV1_(
      model
    )
  );

  gates.push(
    gateEvidenceLinksESGV1_(
      model
    )
  );

  gates.push(
    gateMediaRightsESGV1_(
      model
    )
  );

  gates.push(
    gateChartDataESGV1_(
      model
    )
  );

  gates.push(
    gateRequiredSectionsESGV1_(
      model
    )
  );

  gates.push(
    gateWhiteLabelModelESGV1_(
      model
    )
  );

  gates.push(
    gateSnapshotProfileESGV1_(
      model
    )
  );

  var failed =
    gates.filter(
      function(gate) {
        return (
          gate.status ===
          "FAIL"
        );
      }
    );

  var warnings =
    gates.filter(
      function(gate) {
        return (
          gate.status ===
          "WARN"
        );
      }
    );

  return {
    success:
      failed.length ===
      0,

    status:
      failed.length
        ? "FAIL"
        : warnings.length
          ? "WARN"
          : "PASS",

    engineVersion:
      ESG_QC_ENGINE_VERSION_V1,

    gates:
      gates,

    failedGates:
      failed.map(
        function(gate) {
          return gate.gate;
        }
      ),

    warningGates:
      warnings.map(
        function(gate) {
          return gate.gate;
        }
      ),

    checkedAt:
      new Date()
        .toISOString()
  };
}


function gateSchemaValidESGV1_(
  model
) {
  var result =
    validerESGReportSchemaV1(
      model
    );

  return creerGateESGV1_(
    "SCHEMA_VALID",
    result.valid
      ? (
          result.warnings &&
          result.warnings.length
            ? "WARN"
            : "PASS"
        )
      : "FAIL",
    result.errors || [],
    result.warnings || []
  );
}


function gateScoreConsistentESGV1_(
  model
) {
  var errors = [];
  var warnings = [];

  var scores =
    model &&
    model.scores
      ? model.scores
      : {};

  var expected =
    calculerESGOverallScoreV2DepuisPiliers_(
      scores.environmentScore,
      scores.socialScore,
      scores.governanceScore
    );

  var actual =
    scores.esgOverallScoreV2;

  if (
    expected === null &&
    actual !== null &&
    actual !== undefined
  ) {
    errors.push(
      "esgOverallScoreV2 existe alors que les trois scores E/S/G ne sont pas calculables."
    );
  }

  if (
    expected !== null &&
    (
      actual === null ||
      actual === undefined ||
      !isFinite(
        Number(
          actual
        )
      ) ||
      Math.abs(
        Number(
          actual
        ) -
        expected
      ) >
        0.01
    )
  ) {
    errors.push(
      "esgOverallScoreV2 incohérent avec la moyenne E/S/G."
    );
  }

  return creerGateESGV1_(
    "SCORE_CONSISTENT",
    errors.length
      ? "FAIL"
      : warnings.length
        ? "WARN"
        : "PASS",
    errors,
    warnings
  );
}


function gateNumericClaimsESGV1_(
  model
) {
  var errors = [];
  var warnings = [];

  (
    model.claims ||
    []
  ).forEach(
    function(
      claim,
      index
    ) {
      var statement =
        String(
          claim.statement ||
          ""
        );

      var containsNumber =
        /-?\d+(?:[.,]\d+)?/.test(
          statement
        );

      if (!containsNumber) {
        return;
      }

      var evidenced =
        Array.isArray(
          claim.evidenceIds
        ) &&
        claim.evidenceIds.length >
          0;

      var sourced =
        Array.isArray(
          claim.sourceRefs
        ) &&
        claim.sourceRefs.length >
          0;

      var calculated =
        claim.dataStatus ===
        ESG_DATA_STATUS_V1
          .CALCULATED;

      if (
        !evidenced &&
        !sourced &&
        !calculated
      ) {
        errors.push(
          "Claim numérique non sourcé à l'index " +
          index +
          "."
        );
      }
    }
  );

  return creerGateESGV1_(
    "NO_UNSOURCED_NUMERIC_CLAIM",
    errors.length
      ? "FAIL"
      : "PASS",
    errors,
    warnings
  );
}


function gateKPIUnitsESGV1_(
  model
) {
  var errors = [];

  (
    model.kpis ||
    []
  ).forEach(
    function(
      kpi,
      index
    ) {
      var hasNumericValue =
        [
          kpi.baselineValue,
          kpi.currentValue,
          kpi.targetValue
        ].some(
          function(value) {
            return (
              value !== null &&
              value !== undefined &&
              value !== "" &&
              isFinite(
                Number(
                  value
                )
              )
            );
          }
        );

      if (
        hasNumericValue &&
        !String(
          kpi.unit ||
          ""
        ).trim()
      ) {
        errors.push(
          "KPI numérique sans unité à l'index " +
          index +
          "."
        );
      }
    }
  );

  return creerGateESGV1_(
    "KPI_UNITS_VALID",
    errors.length
      ? "FAIL"
      : "PASS",
    errors,
    []
  );
}


function gateTargetYearsESGV1_(
  model
) {
  var errors = [];

  (
    model.kpis ||
    []
  ).forEach(
    function(
      kpi,
      index
    ) {
      if (
        kpi.targetValue !==
          null &&
        kpi.targetValue !==
          undefined &&
        kpi.targetValue !==
          "" &&
        (
          kpi.targetYear ===
            null ||
          kpi.targetYear ===
            undefined ||
          kpi.targetYear ===
            ""
        )
      ) {
        errors.push(
          "KPI cible sans année à l'index " +
          index +
          "."
        );
      }
    }
  );

  (
    model.targets ||
    []
  ).forEach(
    function(
      target,
      index
    ) {
      if (
        target &&
        target.targetValue !==
          undefined &&
        target.targetValue !==
          null &&
        target.targetValue !==
          "" &&
        (
          target.targetYear ===
            undefined ||
          target.targetYear ===
            null ||
          target.targetYear ===
            ""
        )
      ) {
        errors.push(
          "Target sans année à l'index " +
          index +
          "."
        );
      }
    }
  );

  return creerGateESGV1_(
    "TARGET_YEARS_VALID",
    errors.length
      ? "FAIL"
      : "PASS",
    errors,
    []
  );
}


function gateEvidenceLinksESGV1_(
  model
) {
  var evidenceIds = {};
  var errors = [];

  (
    model.evidence ||
    []
  ).forEach(
    function(evidence) {
      if (
        evidence &&
        evidence.evidenceId
      ) {
        evidenceIds[
          evidence.evidenceId
        ] =
          true;
      }
    }
  );

  [
    {
      name:
        "claims",
      items:
        model.claims ||
        []
    },
    {
      name:
        "kpis",
      items:
        model.kpis ||
        []
    },
    {
      name:
        "risks",
      items:
        model.risks ||
        []
    },
    {
      name:
        "responses",
      items:
        model.assessment &&
        model.assessment.responses
          ? model.assessment.responses
          : []
    }
  ].forEach(
    function(group) {
      group.items.forEach(
        function(
          item,
          index
        ) {
          (
            item.evidenceIds ||
            []
          ).forEach(
            function(id) {
              if (
                !evidenceIds[
                  id
                ]
              ) {
                errors.push(
                  group.name +
                  "[" +
                  index +
                  "] → evidenceId inexistant : " +
                  id
                );
              }
            }
          );
        }
      );
    }
  );

  return creerGateESGV1_(
    "CLAIM_EVIDENCE_LINKS_VALID",
    errors.length
      ? "FAIL"
      : "PASS",
    errors,
    []
  );
}


function gateMediaRightsESGV1_(
  model
) {
  var errors = [];
  var warnings = [];

  var renderedMediaIds = {};

  (
    model.report &&
    model.report.sections
      ? model.report.sections
      : []
  ).forEach(
    function(section) {
      (
        section.blocks ||
        []
      ).forEach(
        function(block) {
          if (
            block.type ===
              "IMAGE_BLOCK" &&
            block.data &&
            block.data.mediaId
          ) {
            renderedMediaIds[
              block.data.mediaId
            ] =
              true;
          }
        }
      );
    }
  );

  Object.keys(
    renderedMediaIds
  ).forEach(
    function(mediaId) {
      var media =
        (
          model.media ||
          []
        ).filter(
          function(item) {
            return (
              item &&
              item.mediaId ===
                mediaId
            );
          }
        )[0];

      if (!media) {
        errors.push(
          "Media rendu introuvable : " +
          mediaId
        );

        return;
      }

      var rights =
        String(
          media.rightsStatus ||
          ""
        ).toUpperCase();

      if (
        [
          "OWNED",
          "LICENSED",
          "CLIENT_PROVIDED_AUTHORIZED"
        ].indexOf(
          rights
        ) === -1
      ) {
        errors.push(
          "Droits média insuffisants : " +
          mediaId
        );
      }
    }
  );

  if (
    !Object.keys(
      renderedMediaIds
    ).length
  ) {
    warnings.push(
      "Aucune image rendue : layout data-first appliqué."
    );
  }

  return creerGateESGV1_(
    "MEDIA_RIGHTS_VALID",
    errors.length
      ? "FAIL"
      : warnings.length
        ? "WARN"
        : "PASS",
    errors,
    warnings
  );
}


function gateChartDataESGV1_(
  model
) {
  var errors = [];
  var warnings = [];

  (
    model.report &&
    model.report.sections
      ? model.report.sections
      : []
  ).forEach(
    function(section) {
      (
        section.blocks ||
        []
      ).forEach(
        function(block) {
          if (
            block.type ===
              "CHART_BLOCK" &&
            (
              !block.data ||
              block.data
                .chartDataValid !==
                true
            )
          ) {
            errors.push(
              block.blockId +
              " : chartDataValid=false."
            );
          }

          if (
            block.type ===
              "RISK_MATRIX_BLOCK" &&
            (
              !block.data ||
              block.data
                .matrixEligible !==
                true
            )
          ) {
            errors.push(
              block.blockId +
              " : matrice risque non éligible."
            );
          }

          if (
            block.type ===
              "MATERIALITY_BLOCK" &&
            block.data &&
            block.data.mode ===
              "ADVANCED_MATRIX" &&
            block.data
              .matrixEligible !==
              true
          ) {
            errors.push(
              block.blockId +
              " : matrice matérialité non éligible."
            );
          }
        }
      );
    }
  );

  return creerGateESGV1_(
    "CHART_DATA_VALID",
    errors.length
      ? "FAIL"
      : warnings.length
        ? "WARN"
        : "PASS",
    errors,
    warnings
  );
}


function gateRequiredSectionsESGV1_(
  model
) {
  var errors = [];

  var sections =
    model.report &&
    Array.isArray(
      model.report.sections
    )
      ? model.report.sections
      : [];

  sections.forEach(
    function(
      section,
      index
    ) {
      if (
        section.required ===
          true &&
        (
          !Array.isArray(
            section.blocks
          ) ||
          section.blocks.length ===
            0
        )
      ) {
        errors.push(
          "Section requise vide à l'index " +
          index +
          "."
        );
      }

      (
        section.blocks ||
        []
      ).forEach(
        function(block) {
          if (
            block.required ===
              true
          ) {
            var validation =
              validerBlocESGV1_(
                block
              );

            if (
              validation.valid !==
                true
            ) {
              errors.push(
                block.blockId +
                " invalide : " +
                validation
                  .errors
                  .join(
                    " | "
                  )
              );
            }
          }
        }
      );
    }
  );

  return creerGateESGV1_(
    "NO_EMPTY_REQUIRED_SECTION",
    errors.length
      ? "FAIL"
      : "PASS",
    errors,
    []
  );
}


function gateWhiteLabelModelESGV1_(
  model
) {
  var errors = [];

  if (
    !model.report ||
    model.report.whiteLabel !==
      true
  ) {
    errors.push(
      "report.whiteLabel != true."
    );
  }

  var visibleModel =
    {
      organization:
        model.organization,

      report:
        {
          profile:
            model.report &&
            model.report.profile,

          period:
            model.report &&
            model.report.period,

          sections:
            model.report &&
            model.report.sections
        }
    };

  var text =
    JSON.stringify(
      visibleModel
    )
      .toLowerCase();

  [
    "afrigreen24",
    "openai",
    "humbleos"
  ].forEach(
    function(term) {
      if (
        text.indexOf(
          term
        ) !==
          -1
      ) {
        errors.push(
          "Mention interdite dans le modèle visible : " +
          term
        );
      }
    }
  );

  return creerGateESGV1_(
    "WHITE_LABEL_MODEL_VALID",
    errors.length
      ? "FAIL"
      : "PASS",
    errors,
    []
  );
}


function gateSnapshotProfileESGV1_(
  model
) {
  var errors = [];
  var warnings = [];

  if (
    model.report &&
    model.report.profile ===
      ESG_REPORT_PROFILE_V1
        .SNAPSHOT
  ) {
    var count =
      model.report.sections
        ? model.report.sections.length
        : 0;

    if (
      count !==
      7
    ) {
      errors.push(
        "Snapshot doit contenir 7 sections logiques ; trouvé : " +
        count
      );
    }
  }

  return creerGateESGV1_(
    "PROFILE_PAGE_STRUCTURE_VALID",
    errors.length
      ? "FAIL"
      : warnings.length
        ? "WARN"
        : "PASS",
    errors,
    warnings
  );
}


function creerGateESGV1_(
  name,
  status,
  errors,
  warnings
) {
  return {
    gate:
      name,

    status:
      status,

    errors:
      errors ||
      [],

    warnings:
      warnings ||
      [],

    timestamp:
      new Date()
        .toISOString()
  };
}


function TEST_ESG_QUALITY_GATE_ENGINE_V1_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  model.organization.name =
    "Organisation Test";

  model.scores.environmentScore =
    60;

  model.scores.socialScore =
    70;

  model.scores.governanceScore =
    80;

  model.scores.esgOverallScoreV2 =
    70;

  model.scores
    .evidenceCoverageScore =
    0;

  model.scores
    .dataConfidenceScore =
    50;

  model.dataQualityProfile
    .dataConfidenceScore =
    50;

  model.dataQualityProfile
    .evidenceCoverageScore =
    0;

  model.dataQualityProfile
    .methodologyVersion =
    "AG24_DATA_QUALITY_V1";

  model =
    composerRapportESGV1(
      model,
      "SNAPSHOT"
    ).model;

  var result =
    executerQualityGatesESGV1(
      model
    );

  return {
    success:
      result.success ===
        true,

    status:
      result.status,

    gates:
      result.gates
  };
}
