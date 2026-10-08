/**
 * ============================================================
 * AFRIGREEN24 — ESG COMPOSITION ENGINE V1
 * ============================================================
 *
 * Compose le Document Model à partir du modèle canonique.
 * Aucun Google Docs ici.
 * Aucun appel IA ici.
 *
 * V1 implémente d'abord SNAPSHOT (7 pages).
 * DIAGNOSTIC / PREMIUM restent explicitement non activés tant
 * que leurs moteurs requis ne sont pas validés.
 */

var ESG_COMPOSITION_ENGINE_VERSION_V1 =
  "ESG_COMPOSITION_ENGINE_V1";


function composerRapportESGV1(
  canonicalModel,
  profile
) {
  if (
    !canonicalModel ||
    canonicalModel.schemaVersion !==
      ESG_REPORT_SCHEMA_VERSION
  ) {
    throw new Error(
      "Canonical model invalide pour Composition Engine V1."
    );
  }

  profile =
    normaliserProfilRapportESGV1_(
      profile
    );

  if (
    profile !==
      ESG_REPORT_PROFILE_V1
        .SNAPSHOT
  ) {
    throw new Error(
      "COMPOSITION_PROFILE_NOT_IMPLEMENTED_V1: " +
      profile
    );
  }

  var model =
    JSON.parse(
      JSON.stringify(
        canonicalModel
      )
    );

  model.report.profile =
    profile;

  model.report.sections =
    composerSnapshotESGV1_(
      model
    );

  model.report
    .compositionEngineVersion =
    ESG_COMPOSITION_ENGINE_VERSION_V1;

  var validation =
    validerCompositionRapportESGV1_(
      model
    );

  if (
    validation.valid !==
      true
  ) {
    throw new Error(
      "ESG_COMPOSITION_INVALID: " +
      validation
        .errors
        .join(
          " | "
        )
    );
  }

  return {
    success:
      true,

    model:
      model,

    validation:
      validation
  };
}


function composerSnapshotESGV1_(
  model
) {
  var sections = [];

  var coverMedia =
    selectionnerMediaCoverESGV1_(
      model.media || []
    );

  var coverBlocks = [
    creerBlocESGV1_(
      "SNAP-P1-COVER",
      "COVER_BLOCK",
      true,
      {
        organizationName:
          model.organization.name,

        reportTitle:
          "RAPPORT ESG",

        reportSubtitle:
          "Diagnostic environnemental, social et de gouvernance",

        period:
          model.report.period ||
          model.assessment.period ||
          null,

        reportId:
          model.report.reportId ||
          "",

        scores: {
          overall:
            model
              .scores
              .esgOverallScoreV2,

          environment:
            model
              .scores
              .environmentScore,

          social:
            model
              .scores
              .socialScore,

          governance:
            model
              .scores
              .governanceScore
        }
      }
    )
  ];

  if (coverMedia) {
    coverBlocks.push(
      creerBlocESGV1_(
        "SNAP-P1-COVER-IMAGE",
        "IMAGE_BLOCK",
        false,
        {
          mediaId:
            coverMedia.mediaId,

          category:
            coverMedia.category,

          caption:
            coverMedia.caption ||
            "",

          credit:
            coverMedia.credit ||
            "",

          rightsValidated:
            true
        }
      )
    );
  }

  sections.push(
    creerSectionSnapshotESGV1_(
      1,
      "COVER",
      "Cover",
      coverBlocks
    )
  );


  /*
   * PAGE 2 — EXECUTIVE ESG SNAPSHOT
   */
  var executive =
    construireResumeExecutifStructureESGV1_(
      model
    );

  sections.push(
    creerSectionSnapshotESGV1_(
      2,
      "EXECUTIVE_ESG_SNAPSHOT",
      "Synthèse ESG exécutive",
      [
        creerBlocESGV1_(
          "SNAP-P2-SCORE",
          "SCORE_BLOCK",
          true,
          {
            scores:
              model.scores,

            displayScore:
              model
                .scores
                .esgOverallScoreV2,

            methodology:
              model
                .scores
                .methodology
                .esgOverallScoreV2,

            readinessScore:
              model
                .scores
                .readinessScore
          }
        ),

        creerBlocESGV1_(
          "SNAP-P2-DATA-QUALITY",
          "DATA_QUALITY_BLOCK",
          true,
          {
            dataQualityProfile:
              model
                .dataQualityProfile
          }
        ),

        creerBlocESGV1_(
          "SNAP-P2-EXECUTIVE",
          "EXECUTIVE_SUMMARY_BLOCK",
          true,
          executive,
          {
            renderConfig: {
              aiNarrativeAllowed:
                true,

              maxStrengths:
                3,

              maxGaps:
                3,

              maxRisks:
                3
            }
          }
        )
      ]
    )
  );


  /*
   * PAGE 3 — ORGANISATION + MATERIAL ISSUES
   */
  var materialityData =
    construireMaterialitySnapshotESGV1_(
      model
    );

  var page3Blocks = [
    creerBlocESGV1_(
      "SNAP-P3-ORG",
      "ORGANIZATION_BLOCK",
      true,
      {
        organization:
          construireOrganisationAffichableESGV1_(
            model.organization
          )
      }
    ),

    creerBlocESGV1_(
      "SNAP-P3-MATERIALITY",
      "MATERIALITY_BLOCK",
      true,
      materialityData
    )
  ];

  if (
    model.stakeholders &&
    model.stakeholders.length >=
      2
  ) {
    page3Blocks.push(
      creerBlocESGV1_(
        "SNAP-P3-STAKEHOLDERS",
        "STAKEHOLDER_BLOCK",
        false,
        {
          stakeholders:
            model
              .stakeholders
              .slice(
                0,
                8
              )
        }
      )
    );
  }

  sections.push(
    creerSectionSnapshotESGV1_(
      3,
      "ORGANIZATION_MATERIAL_ISSUES",
      "Organisation & enjeux prioritaires",
      page3Blocks
    )
  );


  /*
   * PAGE 4 — ENVIRONMENT
   */
  sections.push(
    creerSectionSnapshotESGV1_(
      4,
      "ENVIRONMENT",
      "Environnement",
      construireBlocsPilierSnapshotESGV1_(
        model,
        "E"
      )
    )
  );


  /*
   * PAGE 5 — SOCIAL
   */
  sections.push(
    creerSectionSnapshotESGV1_(
      5,
      "SOCIAL",
      "Social",
      construireBlocsPilierSnapshotESGV1_(
        model,
        "S"
      )
    )
  );


  /*
   * PAGE 6 — GOVERNANCE + ESG RISKS
   */
  var page6Blocks =
    construireBlocsPilierSnapshotESGV1_(
      model,
      "G"
    );

  var riskView =
    evaluerRiskHeatmapESGV1_(
      model.risks || []
    );

  if (
    model.risks &&
    model.risks.length
  ) {
    page6Blocks.push(
      creerBlocESGV1_(
        "SNAP-P6-RISKS",
        "RISK_BLOCK",
        true,
        {
          risks:
            model
              .risks
              .slice(
                0,
                3
              ),

          displayMode:
            riskView.eligible
              ? "SUMMARY_WITH_MATRIX"
              : "RANKED_TABLE"
        }
      )
    );
  }

  if (
    riskView.eligible
  ) {
    page6Blocks.push(
      creerBlocESGV1_(
        "SNAP-P6-RISK-MATRIX",
        "RISK_MATRIX_BLOCK",
        false,
        {
          risks:
            model
              .risks,

          matrixEligible:
            true,

          chartType:
            "RISK_HEATMAP"
        }
      )
    );
  }

  sections.push(
    creerSectionSnapshotESGV1_(
      6,
      "GOVERNANCE_RISKS",
      "Gouvernance & risques ESG",
      page6Blocks
    )
  );


  /*
   * PAGE 7 — PRIORITY ACTIONS + ROADMAP
   */
  var roadmap =
    normaliserRoadmapSnapshotESGV1_(
      model
        .roadmapActions ||
      []
    );

  sections.push(
    creerSectionSnapshotESGV1_(
      7,
      "PRIORITY_ACTIONS_ROADMAP",
      "Actions prioritaires & feuille de route",
      [
        creerBlocESGV1_(
          "SNAP-P7-RECOMMENDATIONS",
          "RECOMMENDATION_BLOCK",
          true,
          {
            recommendations:
              (
                model
                  .recommendations ||
                []
              ).slice(
                0,
                4
              )
          }
        ),

        creerBlocESGV1_(
          "SNAP-P7-ROADMAP",
          "ROADMAP_BLOCK",
          true,
          {
            horizons:
              roadmap
          }
        ),

        creerBlocESGV1_(
          "SNAP-P7-METHODOLOGY",
          "METHODOLOGY_BLOCK",
          true,
          {
            schemaVersion:
              model.schemaVersion,

            scoringMethod:
              model
                .scores
                .methodology,

            dataQualityMethod:
              model
                .dataQualityProfile
                .methodologyVersion,

            materialityStatus:
              model
                .materiality
                .level
          },
          {
            renderConfig: {
              compact:
                true
            }
          }
        ),

        creerBlocESGV1_(
          "SNAP-P7-DISCLAIMER",
          "DISCLAIMER_BLOCK",
          true,
          {
            text:
              "Ce rapport constitue une évaluation ESG fondée sur les informations disponibles à la date de l’analyse. Il ne constitue ni une certification, ni un audit indépendant, ni une garantie d’accès au financement."
          }
        )
      ]
    )
  );

  return sections;
}


function creerSectionSnapshotESGV1_(
  pageNumber,
  sectionId,
  title,
  blocks
) {
  return {
    sectionId:
      "SNAP-" +
      String(
        sectionId
      ),

    pageNumber:
      pageNumber,

    title:
      title,

    required:
      true,

    forcePageBreakAfter:
      pageNumber <
      7,

    blocks:
      blocks ||
      []
  };
}


function construireResumeExecutifStructureESGV1_(
  model
) {
  var responses =
    model.assessment &&
    model.assessment.responses
      ? model
          .assessment
          .responses
      : [];

  var strengths =
    responses
      .filter(
        function(response) {
          return (
            response &&
            response
              .applicabilityStatus !==
              ESG_APPLICABILITY_STATUS_V1
                .NOT_APPLICABLE &&
            response.dataStatus !==
              ESG_DATA_STATUS_V1
                .NOT_AVAILABLE &&
            Number(
              response.score
            ) >=
              80
          );
        }
      )
      .sort(
        function(a, b) {
          return (
            Number(
              b.score
            ) -
            Number(
              a.score
            )
          );
        }
      )
      .slice(
        0,
        3
      );

  var gaps =
    responses
      .filter(
        function(response) {
          return (
            response &&
            response
              .applicabilityStatus !==
              ESG_APPLICABILITY_STATUS_V1
                .NOT_APPLICABLE &&
            (
              response.dataStatus ===
                ESG_DATA_STATUS_V1
                  .NOT_AVAILABLE ||
              Number(
                response.score
              ) <=
                40
            )
          );
        }
      )
      .sort(
        function(a, b) {
          var aMissing =
            a.dataStatus ===
              ESG_DATA_STATUS_V1
                .NOT_AVAILABLE
              ? -1
              : Number(
                  a.score
                );

          var bMissing =
            b.dataStatus ===
              ESG_DATA_STATUS_V1
                .NOT_AVAILABLE
              ? -1
              : Number(
                  b.score
                );

          return (
            aMissing -
            bMissing
          );
        }
      )
      .slice(
        0,
        3
      );

  return {
    organizationName:
      model.organization.name,

    overallScore:
      model
        .scores
        .esgOverallScoreV2,

    pillarScores: {
      E:
        model
          .scores
          .environmentScore,

      S:
        model
          .scores
          .socialScore,

      G:
        model
          .scores
          .governanceScore
    },

    dataConfidence:
      model
        .scores
        .dataConfidenceScore,

    evidenceCoverage:
      model
        .scores
        .evidenceCoverageScore,

    strengths:
      strengths,

    gaps:
      gaps,

    risks:
      (
        model.risks ||
        []
      ).slice(
        0,
        3
      ),

    narrativePolicy: {
      noPromotion:
        true,

      discloseGaps:
        true,

      neverInventData:
        true
    }
  };
}


function construireOrganisationAffichableESGV1_(
  organization
) {
  organization =
    organization || {};

  return {
    name:
      organization.name ||
      "",

    legalType:
      organization.legalType ||
      "",

    sector:
      organization.sector ||
      "",

    countries:
      organization.countries ||
      [],

    mainCountry:
      organization.mainCountry ||
      "",

    employeeCount:
      organization.employeeCount,

    annualRevenueOrBudget:
      organization
        .annualRevenueOrBudget,

    creationYear:
      organization.creationYear,

    interventionZone:
      organization.interventionZone ||
      ""
  };
}


function construireMaterialitySnapshotESGV1_(
  model
) {
  var materiality =
    model.materiality || {};

  if (
    materiality.level !==
      "NOT_ASSESSED" &&
    materiality.topics &&
    materiality.topics.length
  ) {
    var matrix =
      evaluerMaterialityMatrixESGV1_(
        materiality
      );

    return {
      mode:
        matrix.eligible
          ? "ADVANCED_MATRIX"
          : "ASSESSED_TOPICS",

      matrixEligible:
        matrix.eligible,

      topics:
        materiality
          .topics
          .slice(
            0,
            8
          ),

      disclaimer:
        ""
    };
  }

  return {
    mode:
      "PRELIMINARY_DIAGNOSTIC_TOPICS",

    matrixEligible:
      false,

    topics:
      construireEnjeuxPreliminairesESGV1_(
        model
      ),

    disclaimer:
      "Ces sujets sont des enjeux préliminaires issus du diagnostic. Ils ne constituent pas une analyse formelle de matérialité."
  };
}


function construireEnjeuxPreliminairesESGV1_(
  model
) {
  var output = [];
  var seen = {};

  function add_(
    name,
    pillar,
    sourceType,
    priority
  ) {
    var clean =
      String(
        name || ""
      ).trim();

    if (!clean) {
      return;
    }

    var key =
      clean
        .toLowerCase();

    if (seen[key]) {
      return;
    }

    seen[key] =
      true;

    output.push({
      name:
        clean,

      pillar:
        String(
          pillar || ""
        ),

      sourceType:
        sourceType,

      priority:
        priority,

      status:
        "PRELIMINARY"
    });
  }

  (
    model.risks ||
    []
  ).forEach(
    function(risk) {
      add_(
        risk.description ||
        risk.riskId,
        risk.pillar,
        "RISK",
        risk.legacySeverity ||
        "PRIORITY"
      );
    }
  );

  (
    model.recommendations ||
    []
  ).forEach(
    function(recommendation) {
      add_(
        recommendation.topic ||
        recommendation.title,
        recommendation.pillar,
        "RECOMMENDATION",
        recommendation.priority ||
        "PRIORITY"
      );
    }
  );

  return output.slice(
    0,
    8
  );
}


function construireBlocsPilierSnapshotESGV1_(
  model,
  pillar
) {
  var scoreMap = {
    E:
      model
        .scores
        .environmentScore,

    S:
      model
        .scores
        .socialScore,

    G:
      model
        .scores
        .governanceScore
  };

  var responses =
    (
      model.assessment &&
      model.assessment.responses
        ? model
            .assessment
            .responses
        : []
    ).filter(
      function(response) {
        return (
          response &&
          response.pillar ===
            pillar
        );
      }
    );

  var gaps =
    dedupliquerReponsesThemeSnapshotESGV1_(
      responses
        .filter(
          function(response) {
            return (
              response
                .applicabilityStatus !==
                ESG_APPLICABILITY_STATUS_V1
                  .NOT_APPLICABLE &&
              (
                response.dataStatus ===
                  ESG_DATA_STATUS_V1
                    .NOT_AVAILABLE ||
                Number(
                  response.score
                ) <=
                  40
              )
            );
          }
        )
    )
      .slice(
        0,
        4
      );

  var strengths =
    dedupliquerReponsesThemeSnapshotESGV1_(
      responses
        .filter(
          function(response) {
            return (
              response
                .applicabilityStatus !==
                ESG_APPLICABILITY_STATUS_V1
                  .NOT_APPLICABLE &&
              response.dataStatus !==
                ESG_DATA_STATUS_V1
                  .NOT_AVAILABLE &&
              Number(
                response.score
              ) >=
                80
            );
          }
        )
    )
      .slice(
        0,
        3
      );

  var blocks = [
    creerBlocESGV1_(
      "SNAP-PILLAR-" +
      pillar,
      "PILLAR_BLOCK",
      true,
      {
        pillar:
          pillar,

        score:
          scoreMap[
            pillar
          ],

        responses:
          responses,

        strengths:
          strengths,

        gaps:
          gaps
      }
    )
  ];

  var kpis =
    (
      model.kpis ||
      []
    ).filter(
      function(kpi) {
        return (
          kpi &&
          kpi.pillar ===
            pillar
        );
      }
    ).slice(
      0,
      5
    );

  if (kpis.length) {
    blocks.push(
      creerBlocESGV1_(
        "SNAP-KPI-" +
        pillar,
        "KPI_DASHBOARD_BLOCK",
        false,
        {
          kpis:
            kpis,

          visualizations:
            kpis.map(
              function(kpi) {
                return {
                  kpiId:
                    kpi.kpiId,

                  visualization:
                    selectionnerVisualisationKPIESGV1_(
                      kpi
                    )
                };
              }
            )
        }
      )
    );
  } else {
    var recommended =
      (
        model
          .recommendedIndicators ||
        []
      ).filter(
        function(indicator) {
          return (
            indicator &&
            indicator.pillar ===
              pillar
          );
        }
      ).slice(
        0,
        5
      );

    if (
      recommended.length
    ) {
      blocks.push(
        creerBlocESGV1_(
          "SNAP-REC-KPI-" +
          pillar,
          "TABLE_BLOCK",
          false,
          {
            title:
              "Indicateurs à mettre en place",

            columns: [
              "Indicateur",
              "Unité",
              "Fréquence",
              "Responsable"
            ],

            rows:
              recommended.map(
                function(item) {
                  return [
                    item.name,
                    item.unit,
                    item.frequency,
                    item.owner
                  ];
                }
              ),

            disclaimer:
              "Ces indicateurs sont recommandés ; ils ne sont pas présentés comme des KPI déjà mesurés."
          }
        )
      );
    }
  }

  return blocks;
}


function dedupliquerReponsesThemeSnapshotESGV1_(
  responses
) {
  var seen = {};

  return (
    responses || []
  ).filter(
    function(response) {
      if (!response) {
        return false;
      }

      var key =
        String(
          response.theme ||
          response.subtheme ||
          response.questionId ||
          response.responseId ||
          ""
        )
          .trim()
          .toLowerCase();

      if (!key) {
        return true;
      }

      if (seen[key]) {
        return false;
      }

      seen[key] =
        true;

      return true;
    }
  );
}


function normaliserRoadmapSnapshotESGV1_(
  actions
) {
  var result = {
    "0_3_MONTHS":
      [],

    "3_12_MONTHS":
      [],

    "12_24_MONTHS":
      [],

    needsReclassification:
      []
  };

  (actions || [])
    .forEach(
      function(action) {
        if (
          action.horizon ===
            ESG_ROADMAP_HORIZON_V1
              .MONTHS_0_3
        ) {
          result[
            "0_3_MONTHS"
          ].push(
            action
          );

        } else if (
          action.horizon ===
            ESG_ROADMAP_HORIZON_V1
              .MONTHS_3_12
        ) {
          result[
            "3_12_MONTHS"
          ].push(
            action
          );

        } else if (
          action.horizon ===
            ESG_ROADMAP_HORIZON_V1
              .MONTHS_12_24
        ) {
          result[
            "12_24_MONTHS"
          ].push(
            action
          );

        } else {
          result
            .needsReclassification
            .push(
              action
            );
        }
      }
    );

  result[
    "0_3_MONTHS"
  ] =
    result[
      "0_3_MONTHS"
    ].slice(
      0,
      3
    );

  result[
    "3_12_MONTHS"
  ] =
    result[
      "3_12_MONTHS"
    ].slice(
      0,
      3
    );

  result[
    "12_24_MONTHS"
  ] =
    result[
      "12_24_MONTHS"
    ].slice(
      0,
      3
    );

  return result;
}


function selectionnerMediaCoverESGV1_(
  media
) {
  return (
    media || []
  ).filter(
    function(item) {
      if (!item) {
        return false;
      }

      var category =
        String(
          item.category ||
          ""
        ).toUpperCase();

      var rights =
        String(
          item.rightsStatus ||
          ""
        ).toUpperCase();

      var eligibleCategory =
        category ===
          "COVER" ||
        category ===
          "FACILITY" ||
        category ===
          "IMPACT";

      var rightsValidated =
        [
          "OWNED",
          "LICENSED",
          "CLIENT_PROVIDED_AUTHORIZED"
        ].indexOf(
          rights
        ) !== -1;

      return (
        eligibleCategory &&
        rightsValidated &&
        item.validationStatus !==
          "REJECTED"
      );
    }
  ).sort(
    function(a, b) {
      return (
        Number(
          b.qualityScore ||
          0
        ) -
        Number(
          a.qualityScore ||
          0
        )
      );
    }
  )[0] ||
    null;
}


function validerCompositionRapportESGV1_(
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

  if (
    model.report.profile ===
      ESG_REPORT_PROFILE_V1
        .SNAPSHOT &&
    sections.length !==
      7
  ) {
    errors.push(
      "Snapshot V1 doit contenir exactement 7 sections/pages."
    );
  }

  var sectionIds = {};
  var blockIds = {};

  sections.forEach(
    function(
      section,
      sectionIndex
    ) {
      if (
        !section.sectionId
      ) {
        errors.push(
          "Section sans ID à l'index " +
          sectionIndex +
          "."
        );
      } else if (
        sectionIds[
          section.sectionId
        ]
      ) {
        errors.push(
          "sectionId dupliqué : " +
          section.sectionId
        );
      } else {
        sectionIds[
          section.sectionId
        ] =
          true;
      }

      if (
        !Array.isArray(
          section.blocks
        ) ||
        section.blocks.length ===
          0
      ) {
        errors.push(
          "Section sans bloc : " +
          String(
            section.sectionId ||
            sectionIndex
          )
        );

        return;
      }

      section.blocks
        .forEach(
          function(block) {
            if (
              blockIds[
                block.blockId
              ]
            ) {
              errors.push(
                "blockId dupliqué : " +
                block.blockId
              );
            }

            blockIds[
              block.blockId
            ] =
              true;

            var validation =
              validerBlocESGV1_(
                block
              );

            if (
              validation.valid !==
              true
            ) {
              errors =
                errors.concat(
                  validation
                    .errors
                    .map(
                      function(error) {
                        return (
                          block.blockId +
                          ": " +
                          error
                        );
                      }
                    )
                );
            }

            warnings =
              warnings.concat(
                validation.warnings ||
                []
              );
          }
        );
    }
  );

  return {
    valid:
      errors.length ===
      0,

    errors:
      errors,

    warnings:
      warnings,

    sectionCount:
      sections.length,

    blockCount:
      Object.keys(
        blockIds
      ).length
  };
}


function TEST_ESG_SNAPSHOT_COMPOSITION_V1_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  model.organization.name =
    "Organisation Test";

  model.scores = {
    environmentScore:
      60,

    socialScore:
      70,

    governanceScore:
      65,

    esgOverallScoreV2:
      65,

    readinessScore:
      55,

    dataConfidenceScore:
      70,

    legacyDataConfidenceScore:
      68,

    evidenceCoverageScore:
      0,

    legacyEvidenceScore:
      40,

    fundingReadinessScore:
      null,

    legacyGlobalScoreV1:
      63,

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
        40,
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
        "Formation",
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
        "Éthique",
      score:
        60,
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
        "Formaliser la politique ESG",
      action:
        "Adopter une politique ESG.",
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
        "Adopter la politique ESG",
      horizon:
        "0_3_MONTHS"
    }
  ];

  model.risks = [
    {
      riskId:
        "RISK-1",
      description:
        "Risque documentaire",
      pillar:
        "G"
    }
  ];

  var result =
    composerRapportESGV1(
      model,
      "SNAPSHOT"
    );

  var governanceSection =
    result
      .model
      .report
      .sections
      .filter(
        function(section) {
          return (
            section.sectionId ===
            "SNAP-GOVERNANCE_RISKS"
          );
        }
      )[0];

  var riskBlock =
    governanceSection
      ? governanceSection
          .blocks
          .filter(
            function(block) {
              return (
                block.type ===
                "RISK_BLOCK"
              );
            }
          )[0]
      : null;

  var roadmapSection =
    result
      .model
      .report
      .sections
      .filter(
        function(section) {
          return (
            section.sectionId ===
            "SNAP-PRIORITY_ACTIONS_ROADMAP"
          );
        }
      )[0];

  var recommendationBlock =
    roadmapSection
      ? roadmapSection
          .blocks
          .filter(
            function(block) {
              return (
                block.type ===
                "RECOMMENDATION_BLOCK"
              );
            }
          )[0]
      : null;

  var roadmapBlock =
    roadmapSection
      ? roadmapSection
          .blocks
          .filter(
            function(block) {
              return (
                block.type ===
                "ROADMAP_BLOCK"
              );
            }
          )[0]
      : null;

  var roadmapCapsValid =
    roadmapBlock &&
    Object.keys(
      roadmapBlock.data.horizons
    )
      .filter(
        function(key) {
          return (
            key !==
            "needsReclassification"
          );
        }
      )
      .every(
        function(key) {
          return (
            (
              roadmapBlock
                .data
                .horizons[
                  key
                ] ||
              []
            ).length <=
            3
          );
        }
      );

  return {
    success:
      result.success ===
        true &&
      result
        .model
        .report
        .sections
        .length ===
        7 &&
      result
        .validation
        .valid ===
        true &&
      (
        !riskBlock ||
        (
          riskBlock
            .data
            .risks ||
          []
        ).length <=
        3
      ) &&
      (
        !recommendationBlock ||
        (
          recommendationBlock
            .data
            .recommendations ||
          []
        ).length <=
        4
      ) &&
      roadmapCapsValid ===
        true,

    validation:
      result.validation
  };
}
