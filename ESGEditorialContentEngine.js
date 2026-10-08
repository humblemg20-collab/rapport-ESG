/**
 * ============================================================
 * ESG EDITORIAL CONTENT ENGINE V2
 * ============================================================
 *
 * Shared content layer for every renderer.
 *
 * Invariant:
 * presentation may transform hierarchy and appearance, never reduce the
 * information required by the selected report profile.
 */

var ESG_EDITORIAL_CONTENT_ENGINE_VERSION_V2 =
  "ESG_EDITORIAL_CONTENT_ENGINE_V2";

var ESG_PRESENTATION_RENDER_POLICY_V2 = {
  RENDER:
    "RENDER",

  OMIT_ALLOWED:
    "OMIT_ALLOWED"
};


function preparerDocumentEditorialESGV2_(
  composedModel,
  profil,
  options
) {
  options =
    options || {};

  if (
    !composedModel ||
    !composedModel.report ||
    !Array.isArray(
      composedModel
        .report
        .sections
    )
  ) {
    throw new Error(
      "ESG_EDITORIAL_MODEL_INVALID"
    );
  }

  var model =
    JSON.parse(
      JSON.stringify(
        composedModel
      )
    );

  var narration =
    String(
      options.narrativeMode ||
      ""
    )
      .trim()
      .toUpperCase() ===
      "DETERMINISTIC_ONLY"
      ? construireNarrationsDeterministesESGV2_(
          model
        )
      : genererNarrationsSnapshotESGV1_(
          model,
          profil || {}
        );

  var manifest = [];

  (
    model.report.sections ||
    []
  ).forEach(
    function(section) {
      (
        section.blocks ||
        []
      ).forEach(
        function(block) {
          var narrative =
            narration &&
            narration.textByBlockId
              ? String(
                  narration
                    .textByBlockId[
                      block.blockId
                    ] ||
                  ""
                )
              : "";

          var narrativeRequired =
            block.type ===
              "EXECUTIVE_SUMMARY_BLOCK" ||
            block.type ===
              "PILLAR_BLOCK";

          var renderPolicy =
            obtenirPolitiqueRenduEditorialESGV2_(
              block
            );

          var blockParity =
            construirePariteBlocEditorialESGV2_(
              block
            );

          block.presentationContent = {
            narrative:
              narrative,

            narrativeRequired:
              narrativeRequired,

            renderPolicy:
              renderPolicy,

            parity:
              blockParity,

            engineVersion:
              ESG_EDITORIAL_CONTENT_ENGINE_VERSION_V2
          };

          manifest.push({
            sectionId:
              section.sectionId,

            blockId:
              block.blockId,

            type:
              block.type,

            required:
              block.required ===
              true,

            renderPolicy:
              renderPolicy,

            narrativeRequired:
              narrativeRequired,

            itemCounts:
              blockParity.itemCounts,

            criticalValues:
              blockParity.criticalValues
          });
        }
      );
    }
  );

  model.report.presentation = {
    engineVersion:
      ESG_EDITORIAL_CONTENT_ENGINE_VERSION_V2,

    contentManifest:
      manifest
  };

  var parity =
    validerPariteContenuEditorialESGV2_(
      model
    );

  if (
    parity.success !==
      true
  ) {
    throw new Error(
      "ESG_CONTENT_PARITY_FAILED: " +
      parity.errors.join(
        " | "
      )
    );
  }

  return {
    success:
      true,

    model:
      model,

    narration:
      narration,

    parity:
      parity
  };
}


function construireNarrationsDeterministesESGV2_(
  model
) {
  var textByBlockId = {};
  var blockCount = 0;

  (
    model.report.sections ||
    []
  ).forEach(
    function(section) {
      (
        section.blocks ||
        []
      ).forEach(
        function(block) {
          var draft =
            construireNarrationDeterministeSnapshotESGV1_(
              block,
              model
            );

          if (draft) {
            textByBlockId[
              block.blockId
            ] =
              draft;

            blockCount +=
              1;
          }
        }
      );
    }
  );

  return {
    providerUsed:
      "DETERMINISTIC_SAFE_FALLBACK",

    fallbackUsed:
      false,

    deterministicFallbackUsed:
      true,

    blockCount:
      blockCount,

    attempts:
      [],

    textByBlockId:
      textByBlockId
  };
}


function obtenirPolitiqueRenduEditorialESGV2_(
  block
) {
  if (!block) {
    return ESG_PRESENTATION_RENDER_POLICY_V2
      .OMIT_ALLOWED;
  }

  /*
   * Media remains optional. Until Media Engine V2 embeds an authorised
   * data URI into the presentation contract, absence of the visual must
   * never suppress or block the underlying ESG information.
   */
  if (
    block.type ===
      "IMAGE_BLOCK"
  ) {
    return ESG_PRESENTATION_RENDER_POLICY_V2
      .OMIT_ALLOWED;
  }

  return ESG_PRESENTATION_RENDER_POLICY_V2
    .RENDER;
}


function compterRisquesEligiblesMatriceESGV2_(
  risks
) {
  return (
    risks || []
  ).filter(
    function(risk) {
      if (!risk) {
        return false;
      }

      var likelihood =
        Number(
          risk.likelihood
        );

      var impact =
        Number(
          risk.impact
        );

      return (
        risk.likelihood !==
          null &&
        risk.likelihood !==
          undefined &&
        risk.likelihood !==
          "" &&
        risk.impact !==
          null &&
        risk.impact !==
          undefined &&
        risk.impact !==
          "" &&
        isFinite(
          likelihood
        ) &&
        isFinite(
          impact
        ) &&
        likelihood >=
          1 &&
        likelihood <=
          5 &&
        impact >=
          1 &&
        impact <=
          5
      );
    }
  ).length;
}


function construirePariteBlocEditorialESGV2_(
  block
) {
  var data =
    block &&
    block.data
      ? block.data
      : {};

  var itemCounts = {};
  var criticalValues = [];

  function count_(
    key,
    list
  ) {
    var value =
      Array.isArray(
        list
      )
        ? list.length
        : 0;

    if (
      value >
      0
    ) {
      itemCounts[
        key
      ] =
        value;
    }
  }

  function critical_(
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
      return;
    }

    criticalValues.push(
      String(
        value
      )
    );
  }

  switch (
    block &&
    block.type
  ) {
    case "COVER_BLOCK":
      critical_(
        data.organizationName
      );
      critical_(
        data.reportTitle
      );
      critical_(
        data.reportId
      );
      break;

    case "SCORE_BLOCK":
      critical_(
        data.displayScore
      );
      critical_(
        data.scores &&
        data.scores.environmentScore
      );
      critical_(
        data.scores &&
        data.scores.socialScore
      );
      critical_(
        data.scores &&
        data.scores.governanceScore
      );
      critical_(
        data.readinessScore
      );
      break;

    case "EXECUTIVE_SUMMARY_BLOCK":
      count_(
        "strengths",
        data.strengths
      );
      count_(
        "gaps",
        data.gaps
      );
      count_(
        "risks",
        data.risks
      );
      critical_(
        data.overallScore
      );
      break;

    case "ORGANIZATION_BLOCK":
      if (
        data.organization
      ) {
        critical_(
          data.organization.name
        );
        critical_(
          data.organization.sector
        );
        critical_(
          data.organization.mainCountry
        );
      }
      break;

    case "MATERIALITY_BLOCK":
      count_(
        "topics",
        data.topics
      );
      break;

    case "STAKEHOLDER_BLOCK":
      count_(
        "stakeholders",
        data.stakeholders
      );
      break;

    case "PILLAR_BLOCK":
      count_(
        "strengths",
        data.strengths
      );
      count_(
        "gaps",
        data.gaps
      );
      critical_(
        data.score
      );
      break;

    case "KPI_DASHBOARD_BLOCK":
      count_(
        "kpis",
        data.kpis
      );
      break;

    case "TABLE_BLOCK":
      count_(
        "rows",
        data.rows
      );
      break;

    case "RISK_BLOCK":
      count_(
        "risks",
        data.risks
      );
      break;

    case "RISK_MATRIX_BLOCK":
      var matrixCount =
        compterRisquesEligiblesMatriceESGV2_(
          data.risks
        );

      if (
        matrixCount >
        0
      ) {
        itemCounts
          .matrixRisks =
          matrixCount;
      }
      break;

    case "RECOMMENDATION_BLOCK":
      count_(
        "recommendations",
        data.recommendations
      );
      break;

    case "ROADMAP_BLOCK":
      var horizons =
        data.horizons || {};

      var roadmapCount =
        [
          "0_3_MONTHS",
          "3_12_MONTHS",
          "12_24_MONTHS"
        ].reduce(
          function(
            total,
            key
          ) {
            return (
              total +
              (
                Array.isArray(
                  horizons[
                    key
                  ]
                )
                  ? horizons[
                      key
                    ].length
                  : 0
              )
            );
          },
          0
        );

      if (
        roadmapCount >
        0
      ) {
        itemCounts
          .roadmapActions =
          roadmapCount;
      }
      break;

    case "DISCLAIMER_BLOCK":
      critical_(
        data.text
      );
      break;
  }

  return {
    itemCounts:
      itemCounts,

    criticalValues:
      criticalValues
  };
}


function validerPariteContenuEditorialESGV2_(
  model
) {
  var errors = [];
  var warnings = [];
  var sections =
    model &&
    model.report &&
    Array.isArray(
      model.report.sections
    )
      ? model.report.sections
      : [];

  var manifest =
    model &&
    model.report &&
    model.report.presentation &&
    Array.isArray(
      model.report
        .presentation
        .contentManifest
    )
      ? model.report
          .presentation
          .contentManifest
      : [];

  var blocks = [];
  var byId = {};

  sections.forEach(
    function(section) {
      (
        section.blocks ||
        []
      ).forEach(
        function(block) {
          blocks.push({
            section:
              section,

            block:
              block
          });

          if (
            block &&
            block.blockId
          ) {
            byId[
              block.blockId
            ] =
              block;
          }
        }
      );
    }
  );

  if (
    manifest.length !==
      blocks.length
  ) {
    errors.push(
      "CONTENT_MANIFEST_BLOCK_COUNT_MISMATCH"
    );
  }

  var narrativeRequiredCount = 0;
  var narrativePresentCount = 0;
  var renderRequiredCount = 0;
  var omittedAllowedCount = 0;
  var expectedItemCount = 0;

  manifest.forEach(
    function(item) {
      var block =
        byId[
          item.blockId
        ];

      if (!block) {
        errors.push(
          "CONTENT_BLOCK_MISSING:" +
          String(
            item.blockId || ""
          )
        );

        return;
      }

      if (
        item.renderPolicy ===
          ESG_PRESENTATION_RENDER_POLICY_V2
            .RENDER
      ) {
        renderRequiredCount +=
          1;
      } else {
        omittedAllowedCount +=
          1;
      }

      if (
        item.narrativeRequired ===
          true
      ) {
        narrativeRequiredCount +=
          1;

        var narrative =
          block.presentationContent
            ? String(
                block
                  .presentationContent
                  .narrative ||
                ""
              ).trim()
            : "";

        if (narrative) {
          narrativePresentCount +=
            1;
        } else {
          errors.push(
            "NARRATIVE_MISSING:" +
            String(
              item.blockId || ""
            )
          );
        }
      }

      var expectedParity =
        construirePariteBlocEditorialESGV2_(
          block
        );

      var manifestItemCounts =
        item.itemCounts ||
        {};

      Object.keys(
        expectedParity.itemCounts
      ).forEach(
        function(key) {
          var expectedCount =
            Number(
              expectedParity
                .itemCounts[
                  key
                ] ||
              0
            );

          var manifestCount =
            Number(
              manifestItemCounts[
                key
              ] ||
              0
            );

          expectedItemCount +=
            expectedCount;

          if (
            expectedCount !==
              manifestCount
          ) {
            errors.push(
              "CONTENT_ITEM_COUNT_MANIFEST_MISMATCH:" +
              String(
                item.blockId || ""
              ) +
              ":" +
              key
            );
          }
        }
      );
    }
  );

  if (
    model.report.profile ===
      ESG_REPORT_PROFILE_V1
        .SNAPSHOT
  ) {
    validerPariteSnapshotESGV2_(
      model,
      sections,
      errors,
      warnings
    );
  }

  return {
    success:
      errors.length ===
      0,

    engineVersion:
      ESG_EDITORIAL_CONTENT_ENGINE_VERSION_V2,

    expectedBlockCount:
      manifest.length,

    renderRequiredBlockCount:
      renderRequiredCount,

    omittedAllowedBlockCount:
      omittedAllowedCount,

    narrativeRequiredCount:
      narrativeRequiredCount,

    narrativePresentCount:
      narrativePresentCount,

    expectedItemCount:
      expectedItemCount,

    errors:
      errors,

    warnings:
      warnings
  };
}


function validerPariteSnapshotESGV2_(
  model,
  sections,
  errors,
  warnings
) {
  if (
    sections.length !==
      7
  ) {
    errors.push(
      "SNAPSHOT_SECTION_COUNT_INVALID"
    );
  }

  var allBlocks = [];

  sections.forEach(
    function(section) {
      (
        section.blocks ||
        []
      ).forEach(
        function(block) {
          allBlocks.push(
            block
          );
        }
      );
    }
  );

  function countType_(
    type
  ) {
    return allBlocks.filter(
      function(block) {
        return (
          block &&
          block.type ===
            type
        );
      }
    ).length;
  }

  [
    "COVER_BLOCK",
    "SCORE_BLOCK",
    "DATA_QUALITY_BLOCK",
    "EXECUTIVE_SUMMARY_BLOCK",
    "ORGANIZATION_BLOCK",
    "MATERIALITY_BLOCK",
    "RECOMMENDATION_BLOCK",
    "ROADMAP_BLOCK",
    "METHODOLOGY_BLOCK",
    "DISCLAIMER_BLOCK"
  ].forEach(
    function(type) {
      if (
        countType_(
          type
        ) < 1
      ) {
        errors.push(
          "SNAPSHOT_REQUIRED_BLOCK_TYPE_MISSING:" +
          type
        );
      }
    }
  );

  if (
    countType_(
      "PILLAR_BLOCK"
    ) !==
      3
  ) {
    errors.push(
      "SNAPSHOT_PILLAR_BLOCK_COUNT_INVALID"
    );
  }

  var pillarSections = {
    E:
      "SNAP-ENVIRONMENT",

    S:
      "SNAP-SOCIAL",

    G:
      "SNAP-GOVERNANCE_RISKS"
  };

  [
    "E",
    "S",
    "G"
  ].forEach(
    function(pillar) {
      var section =
        sections.filter(
          function(item) {
            return (
              item.sectionId ===
              pillarSections[
                pillar
              ]
            );
          }
        )[0];

      if (!section) {
        errors.push(
          "SNAPSHOT_PILLAR_SECTION_MISSING:" +
          pillar
        );

        return;
      }

      var sectionBlocks =
        section.blocks ||
        [];

      var kpis =
        (
          model.kpis ||
          []
        ).filter(
          function(item) {
            return (
              item &&
              item.pillar ===
                pillar
            );
          }
        );

      var recommended =
        (
          model.recommendedIndicators ||
          []
        ).filter(
          function(item) {
            return (
              item &&
              item.pillar ===
                pillar
            );
          }
        );

      if (
        kpis.length &&
        !sectionBlocks.some(
          function(block) {
            return (
              block.type ===
              "KPI_DASHBOARD_BLOCK"
            );
          }
        )
      ) {
        errors.push(
          "SNAPSHOT_KPI_BLOCK_MISSING:" +
          pillar
        );
      }

      if (
        !kpis.length &&
        recommended.length &&
        !sectionBlocks.some(
          function(block) {
            return (
              block.type ===
              "TABLE_BLOCK"
            );
          }
        )
      ) {
        errors.push(
          "SNAPSHOT_RECOMMENDED_INDICATORS_MISSING:" +
          pillar
        );
      }
    }
  );

  if (
    (
      model.risks ||
      []
    ).length &&
    countType_(
      "RISK_BLOCK"
    ) < 1
  ) {
    errors.push(
      "SNAPSHOT_RISK_BLOCK_MISSING"
    );
  }

  var riskView =
    evaluerRiskHeatmapESGV1_(
      model.risks ||
      []
    );

  if (
    riskView.eligible &&
    countType_(
      "RISK_MATRIX_BLOCK"
    ) < 1
  ) {
    errors.push(
      "SNAPSHOT_RISK_MATRIX_BLOCK_MISSING"
    );
  }

  if (
    (
      model.stakeholders ||
      []
    ).length >=
      2 &&
    countType_(
      "STAKEHOLDER_BLOCK"
    ) < 1
  ) {
    errors.push(
      "SNAPSHOT_STAKEHOLDER_BLOCK_MISSING"
    );
  }

  if (
    (
      model.recommendations ||
      []
    ).length >
      0 &&
    countType_(
      "RECOMMENDATION_BLOCK"
    ) < 1
  ) {
    errors.push(
      "SNAPSHOT_RECOMMENDATION_BLOCK_MISSING"
    );
  }

  var omittedMedia =
    allBlocks.filter(
      function(block) {
        return (
          block &&
          block.type ===
            "IMAGE_BLOCK" &&
          block.presentationContent &&
          block
            .presentationContent
            .renderPolicy ===
              ESG_PRESENTATION_RENDER_POLICY_V2
                .OMIT_ALLOWED
        );
      }
    ).length;

  if (
    omittedMedia >
      0
  ) {
    warnings.push(
      "OPTIONAL_MEDIA_OMITTED:" +
      omittedMedia
    );
  }
}


function TEST_ESG_EDITORIAL_CONTENT_ENGINE_V2_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  model.organization.name =
    "Editorial Test";

  model.organization.sector =
    "Énergie solaire";

  model.scores = {
    environmentScore:
      60,

    socialScore:
      55,

    governanceScore:
      50,

    esgOverallScoreV2:
      55,

    readinessScore:
      50,

    dataConfidenceScore:
      70,

    evidenceCoverageScore:
      0,

    methodology: {
      esgOverallScoreV2:
        "EQUAL_WEIGHT_E_S_G_V2"
    }
  };

  model.dataQualityProfile = {
    methodologyVersion:
      "AG24_DATA_QUALITY_V1",

    dataConfidenceScore:
      70,

    evidenceCoverageScore:
      0,

    warnings:
      []
  };

  model.materiality = {
    level:
      "NOT_ASSESSED",

    topics:
      []
  };

  model.assessment.responses = [
    {
      responseId:
        "R-E-1",
      questionId:
        "E-1",
      pillar:
        "E",
      theme:
        "Énergie",
      score:
        20,
      dataStatus:
        "DECLARED",
      applicabilityStatus:
        "APPLICABLE"
    },
    {
      responseId:
        "R-S-1",
      questionId:
        "S-1",
      pillar:
        "S",
      theme:
        "Emploi",
      score:
        80,
      dataStatus:
        "DECLARED",
      applicabilityStatus:
        "APPLICABLE"
    },
    {
      responseId:
        "R-G-1",
      questionId:
        "G-1",
      pillar:
        "G",
      theme:
        "Gouvernance",
      score:
        40,
      dataStatus:
        "DECLARED",
      applicabilityStatus:
        "APPLICABLE"
    }
  ];

  model.recommendations = [
    {
      recommendationId:
        "REC-1",
      title:
        "Formaliser la gouvernance",
      action:
        "Adopter les règles de gouvernance.",
      pillar:
        "G",
      topic:
        "Gouvernance"
    }
  ];

  model.roadmapActions = [
    {
      actionId:
        "ACT-1",
      title:
        "Adopter les règles de gouvernance",
      horizon:
        "0_3_MONTHS"
    }
  ];

  var composition =
    composerRapportESGV1(
      model,
      ESG_REPORT_PROFILE_V1
        .SNAPSHOT
    );

  var editorial =
    preparerDocumentEditorialESGV2_(
      composition.model,
      {},
      {
        narrativeMode:
          "DETERMINISTIC_ONLY"
      }
    );

  return {
    success:
      editorial.success ===
        true &&
      editorial.parity.success ===
        true &&
      editorial.parity
        .narrativeRequiredCount ===
      editorial.parity
        .narrativePresentCount,

    parity:
      editorial.parity,

    providerUsed:
      editorial
        .narration
        .providerUsed
  };
}
