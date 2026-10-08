/**
 * ============================================================
 * ESG SNAPSHOT RENDERER V1 — GOOGLE DOCS / PDF
 * ============================================================
 *
 * Rôle :
 * - reçoit exclusivement ESG_REPORT_SCHEMA_V1 déjà validé ;
 * - compose SNAPSHOT via ESGCompositionEngine ;
 * - génère les narrations via ESGAIGateway :
 *      OpenAI PRIMARY → HumbleOS FALLBACK ;
 * - rend Google Docs + PDF ;
 * - applique le quality gate white-label avant export.
 *
 * Aucun scoring métier dans ce fichier.
 */

var ESG_SNAPSHOT_RENDERER_VERSION_V1 =
  "ESG_SNAPSHOT_RENDERER_V1";

var ESG_SNAPSHOT_THEME_V1 = {
  primary:
    "#1F5D50",

  primaryLight:
    "#EAF4F1",

  dark:
    "#17202A",

  muted:
    "#667085",

  border:
    "#D0D5DD",

  soft:
    "#F7F8FA",

  success:
    "#277A4B",

  warning:
    "#B7791F",

  critical:
    "#B42318",

  white:
    "#FFFFFF"
};


/**
 * ============================================================
 * POINT D'ENTRÉE — SNAPSHOT V1
 * ============================================================
 */
function genererSnapshotESGV1(
  canonicalModel,
  profil
) {
  profil =
    profil || {};

  var validation =
    validerESGReportSchemaV1(
      canonicalModel
    );

  if (
    validation.valid !==
      true
  ) {
    throw new Error(
      "ESG_SNAPSHOT_SCHEMA_INVALID: " +
      validation
        .errors
        .join(
          " | "
        )
    );
  }

  var composition =
    composerRapportESGV1(
      canonicalModel,
      ESG_REPORT_PROFILE_V1
        .SNAPSHOT
    );

  var model =
    composition.model;


  var preRenderQC =
    executerQualityGatesESGV1(
      model
    );


  if (
    preRenderQC.success !==
      true
  ) {
    throw new Error(
      "ESG_SNAPSHOT_PRE_RENDER_QC_FAILED: " +
      preRenderQC
        .failedGates
        .join(
          " | "
        )
    );
  }


  var identifiantRapport =
    model.report.reportId ||
    creerIdentifiantRapportESG_();

  model.report.reportId =
    identifiantRapport;

  var narration =
    genererNarrationsSnapshotESGV1_(
      model,
      profil
    );

  var organisation =
    nettoyerNomFichierESG_(
      model.organization.name ||
      "Organisation"
    );

  var nomDocument =
    "Rapport ESG - " +
    organisation +
    " - " +
    identifiantRapport;

  var dossier =
    obtenirOuCreerDossierRapportsESG_();

  var document =
    DocumentApp.create(
      nomDocument
    );

  var documentId =
    document.getId();

  var fichierDocument =
    DriveApp.getFileById(
      documentId
    );

  dossier.addFile(
    fichierDocument
  );

  retirerFichierDeRacineESG_(
    fichierDocument
  );

  var body =
    document.getBody();

  configurerDocumentSnapshotESGV1_(
    body
  );

  (
    model.report.sections ||
    []
  ).forEach(
    function(
      section,
      index
    ) {
      rendreSectionSnapshotESGV1_(
        body,
        section,
        model,
        profil,
        narration.textByBlockId
      );

      if (
        index <
        model.report.sections.length -
          1
      ) {
        body.appendPageBreak();
      }
    }
  );

  ajouterPiedDePageSnapshotESGV1_(
    document,
    model.organization.name,
    identifiantRapport
  );

  var whiteLabel =
    validerWhiteLabelDocumentESG_(
      document
    );

  document.saveAndClose();

  Utilities.sleep(
    1200
  );

  var pdf =
    creerPDFFromDocumentESG_(
      documentId,
      nomDocument,
      dossier
    );

  var pdfHealth =
    verifierPDFSnapshotESGV1_(
      pdf
    );

  if (
    pdfHealth.status !==
      "PASS"
  ) {
    throw new Error(
      "PDF_RENDER_CHECK_FAILED: " +
      pdfHealth
        .errors
        .join(
          " | "
        )
    );
  }

  essayerPartagerRapportESG_(
    documentId,
    pdf.id
  );

  var docUrl =
    "https://docs.google.com/document/d/" +
    documentId +
    "/edit";

  return {
    success:
      true,

    version:
      ESG_SNAPSHOT_RENDERER_VERSION_V1,

    reportId:
      identifiantRapport,

    profile:
      "SNAPSHOT",

    logicalPageCount:
      model
        .report
        .sections
        .length,

    documentId:
      documentId,

    docId:
      documentId,

    documentUrl:
      docUrl,

    docUrl:
      docUrl,

    pdfId:
      pdf.id,

    pdfUrl:
      pdf.url,

    pdfDownloadUrl:
      pdf.downloadUrl,

    folderId:
      dossier.getId(),

    fileName:
      nomDocument,

    aiGeneration: {
      providerUsed:
        narration.providerUsed,

      providerFallbackUsed:
        narration.fallbackUsed,

      deterministicFallbackUsed:
        narration
          .deterministicFallbackUsed,

      blockCount:
        narration.blockCount,

      attempts:
        narration.attempts
    },

    quality: {
      schema:
        "PASS",

      composition:
        composition.validation,

      preRender:
        preRenderQC,

      whiteLabel:
        whiteLabel,

      pdfRender:
        pdfHealth
    }
  };
}


/**
 * ============================================================
 * DOCUMENT / PAGE SETUP
 * ============================================================
 */
function configurerDocumentSnapshotESGV1_(
  body
) {
  body.setMarginTop(
    42
  );

  body.setMarginBottom(
    42
  );

  body.setMarginLeft(
    46
  );

  body.setMarginRight(
    46
  );

  try {
    body.setPageWidth(
      595
    );

    body.setPageHeight(
      842
    );
  } catch (_) {}
}


/**
 * ============================================================
 * AI NARRATIVE BATCH
 * ============================================================
 */
function genererNarrationsSnapshotESGV1_(
  model,
  profil
) {
  var blocks = [];

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
            blocks.push({
              id:
                block.blockId,

              text:
                draft
            });
          }
        }
      );
    }
  );

  if (!blocks.length) {
    return {
      providerUsed:
        "DETERMINISTIC_SAFE_FALLBACK",

      fallbackUsed:
        false,

      deterministicFallbackUsed:
        true,

      blockCount:
        0,

      attempts:
        [],

      textByBlockId:
        {}
    };
  }

  var payload =
    buildESGRewritePayload_({
      blocks:
        blocks
    });

  var protection =
    protectPayloadESGRewrite_(
      payload
    );

  try {
    var gateway =
      reecrireRapportESGAvecAIGateway_(
        protection
          .protectedPayload
      );

    var restored =
      restoreOutputESGRewrite_(
        gateway.output,
        protection
          .replacementsById
      );

    var restoredOutput =
      restored.output;

    var safe =
      applyESGRewriteSafetyFallback_(
        payload,
        restoredOutput,
        {
          organizationName:
            model.organization.name
        }
      );

    var byId = {};

    (
      safe.output.texts ||
      []
    ).forEach(
      function(item) {
        byId[
          String(
            item.id
          )
        ] =
          String(
            item.rewritten_text ||
            ""
          );
      }
    );

    /*
     * Tout bloc dont la restauration a échoué doit
     * rester déterministe.
     */
    (
      restored.failed_ids ||
      []
    ).forEach(
      function(id) {
        var source =
          blocks.filter(
            function(block) {
              return (
                block.id ===
                id
              );
            }
          )[0];

        if (source) {
          byId[id] =
            source.text;
        }
      }
    );

    return {
      providerUsed:
        gateway.providerUsed,

      fallbackUsed:
        gateway.fallbackUsed ===
        true,

      deterministicFallbackUsed:
        (
          safe.fallback_ids ||
          []
        ).length >
          0 ||
        (
          restored.failed_ids ||
          []
        ).length >
          0,

      blockCount:
        blocks.length,

      attempts:
        gateway.attempts ||
        [],

      textByBlockId:
        byId
    };

  } catch (error) {
    var deterministic = {};

    blocks.forEach(
      function(block) {
        deterministic[
          block.id
        ] =
          block.text;
      }
    );

    console.warn(
      "Snapshot ESG AI indisponible ; fallback déterministe : " +
      (
        error &&
        error.message
          ? error.message
          : error
      )
    );

    return {
      providerUsed:
        "DETERMINISTIC_SAFE_FALLBACK",

      fallbackUsed:
        true,

      deterministicFallbackUsed:
        true,

      blockCount:
        blocks.length,

      attempts:
        error &&
        error.attempts
          ? error.attempts
          : [],

      textByBlockId:
        deterministic
    };
  }
}


function construireNarrationDeterministeSnapshotESGV1_(
  block,
  model
) {
  if (!block) {
    return "";
  }

  if (
    block.type ===
      "EXECUTIVE_SUMMARY_BLOCK"
  ) {
    var data =
      block.data || {};

    return [
      String(
        data.organizationName ||
        model.organization.name ||
        "L’organisation"
      ),
      "présente un score ESG global de",
      formaterScoreSnapshotESGV1_(
        data.overallScore
      ) +
        ".",
      "Les scores par pilier sont de",
      formaterScoreSnapshotESGV1_(
        data.pillarScores &&
        data.pillarScores.E
      ),
      "pour l’Environnement,",
      formaterScoreSnapshotESGV1_(
        data.pillarScores &&
        data.pillarScores.S
      ),
      "pour le Social et",
      formaterScoreSnapshotESGV1_(
        data.pillarScores &&
        data.pillarScores.G
      ),
      "pour la Gouvernance.",
      "La confiance dans les données est de",
      formaterScoreSnapshotESGV1_(
        data.dataConfidence
      ),
      "et la couverture par preuves canoniques de",
      formaterScoreSnapshotESGV1_(
        data.evidenceCoverage
      ) +
        ".",
      "Les principaux écarts et risques identifiés doivent être traités selon la feuille de route présentée dans ce rapport."
    ].join(
      " "
    );
  }

  if (
    block.type ===
      "PILLAR_BLOCK"
  ) {
    var pillar =
      block.data || {};

    var label =
      pillar.pillar ===
        "E"
        ? "environnemental"
        : pillar.pillar ===
            "S"
          ? "social"
          : "de gouvernance";

    return [
      "Le pilier",
      label,
      "obtient un score de",
      formaterScoreSnapshotESGV1_(
        pillar.score
      ) +
        ".",
      "L’analyse fait ressortir",
      String(
        (
          pillar.strengths ||
          []
        ).length
      ),
      "point(s) fort(s) prioritaire(s) et",
      String(
        (
          pillar.gaps ||
          []
        ).length
      ),
      "écart(s) majeur(s) à traiter.",
      "Cette lecture repose uniquement sur les réponses, statuts de données et éléments disponibles dans le diagnostic."
    ].join(
      " "
    );
  }

  return "";
}


/**
 * ============================================================
 * SECTION RENDERING
 * ============================================================
 */
function rendreSectionSnapshotESGV1_(
  body,
  section,
  model,
  profil,
  narrativeById
) {
  if (!section) {
    return;
  }

  if (
    section.pageNumber >
    1
  ) {
    ajouterEnTeteSectionSnapshotESGV1_(
      body,
      section.pageNumber,
      section.title
    );
  }

  (
    section.blocks ||
    []
  ).forEach(
    function(block) {
      rendreBlocSnapshotESGV1_(
        body,
        block,
        model,
        profil,
        narrativeById || {}
      );
    }
  );
}


function rendreBlocSnapshotESGV1_(
  body,
  block,
  model,
  profil,
  narrativeById
) {
  var validation =
    validerBlocESGV1_(
      block
    );

  if (
    validation.valid !==
      true
  ) {
    if (
      block.required ===
      true
    ) {
      throw new Error(
        "SNAPSHOT_BLOCK_INVALID " +
        block.blockId +
        ": " +
        validation
          .errors
          .join(
            " | "
          )
      );
    }

    return;
  }

  switch (
    block.type
  ) {
    case "COVER_BLOCK":
      rendreCoverSnapshotESGV1_(
        body,
        block,
        model,
        profil
      );
      break;

    case "IMAGE_BLOCK":
      rendreImageSnapshotESGV1_(
        body,
        block,
        model
      );
      break;

    case "SCORE_BLOCK":
      rendreScoreSnapshotESGV1_(
        body,
        block
      );
      break;

    case "DATA_QUALITY_BLOCK":
      rendreDataQualitySnapshotESGV1_(
        body,
        block
      );
      break;

    case "EXECUTIVE_SUMMARY_BLOCK":
      rendreExecutiveSummarySnapshotESGV1_(
        body,
        block,
        narrativeById[
          block.blockId
        ]
      );
      break;

    case "ORGANIZATION_BLOCK":
      rendreOrganisationSnapshotESGV1_(
        body,
        block
      );
      break;

    case "MATERIALITY_BLOCK":
      rendreMaterialitySnapshotESGV1_(
        body,
        block
      );
      break;

    case "STAKEHOLDER_BLOCK":
      rendreStakeholdersSnapshotESGV1_(
        body,
        block
      );
      break;

    case "PILLAR_BLOCK":
      rendrePilierSnapshotESGV1_(
        body,
        block,
        narrativeById[
          block.blockId
        ]
      );
      break;

    case "KPI_DASHBOARD_BLOCK":
      rendreKPIDashboardSnapshotESGV1_(
        body,
        block
      );
      break;

    case "TABLE_BLOCK":
      rendreTableBlockSnapshotESGV1_(
        body,
        block
      );
      break;

    case "RISK_BLOCK":
      rendreRisksSnapshotESGV1_(
        body,
        block
      );
      break;

    case "RISK_MATRIX_BLOCK":
      rendreRiskMatrixSnapshotESGV1_(
        body,
        block
      );
      break;

    case "RECOMMENDATION_BLOCK":
      rendreRecommendationsSnapshotESGV1_(
        body,
        block
      );
      break;

    case "ROADMAP_BLOCK":
      rendreRoadmapSnapshotESGV1_(
        body,
        block
      );
      break;

    case "METHODOLOGY_BLOCK":
      rendreMethodologySnapshotESGV1_(
        body,
        block
      );
      break;

    case "DISCLAIMER_BLOCK":
      rendreDisclaimerSnapshotESGV1_(
        body,
        block
      );
      break;

    default:
      /*
       * Snapshot V1 ignore uniquement les blocs optionnels
       * non encore implémentés. Un bloc required inconnu
       * aurait déjà échoué au registry.
       */
      if (
        block.required ===
        true
      ) {
        throw new Error(
          "SNAPSHOT_RENDERER_BLOCK_NOT_IMPLEMENTED: " +
          block.type
        );
      }
  }
}


/**
 * ============================================================
 * COVER
 * ============================================================
 */
function rendreCoverSnapshotESGV1_(
  body,
  block,
  model,
  profil
) {
  body.appendParagraph(
    ""
  ).setSpacingAfter(
    24
  );

  var logo =
    obtenirLogoBlobOrganisationESG_(
      profil
    );

  if (logo) {
    var logoParagraph =
      body.appendParagraph(
        ""
      );

    logoParagraph
      .setAlignment(
        DocumentApp
          .HorizontalAlignment
          .CENTER
      );

    var image =
      logoParagraph
        .appendInlineImage(
          logo
        );

    ajusterImageSnapshotESGV1_(
      image,
      150,
      70
    );

    logoParagraph
      .setSpacingAfter(
        28
      );
  }

  var title =
    body.appendParagraph(
      "RAPPORT ESG"
    );

  title
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setBold(
      true
    )
    .setFontSize(
      29
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .dark
    )
    .setSpacingBefore(
      28
    )
    .setSpacingAfter(
      8
    );

  var subtitle =
    body.appendParagraph(
      "Diagnostic environnemental, social et de gouvernance"
    );

  subtitle
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setBold(
      true
    )
    .setFontSize(
      13
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .primary
    )
    .setSpacingAfter(
      30
    );

  var orgName =
    body.appendParagraph(
      model.organization.name
    );

  orgName
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setBold(
      true
    )
    .setFontSize(
      20
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .dark
    )
    .setSpacingAfter(
      25
    );

  var score =
    model
      .scores
      .esgOverallScoreV2;

  var scoreTable =
    body.appendTable([
      [
        "ESG OVERALL SCORE",
        formaterScoreSnapshotESGV1_(
          score
        )
      ]
    ]);

  scoreTable
    .setBorderWidth(
      0
    );

  scoreTable
    .getCell(
      0,
      0
    )
    .setBackgroundColor(
      ESG_SNAPSHOT_THEME_V1
        .primaryLight
    );

  scoreTable
    .getCell(
      0,
      1
    )
    .setBackgroundColor(
      ESG_SNAPSHOT_THEME_V1
        .primary
    );

  scoreTable
    .getCell(
      0,
      0
    )
    .getChild(
      0
    )
    .asParagraph()
    .setBold(
      true
    )
    .setFontSize(
      11
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .dark
    );

  scoreTable
    .getCell(
      0,
      1
    )
    .getChild(
      0
    )
    .asParagraph()
    .setBold(
      true
    )
    .setFontSize(
      18
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .white
    )
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    );

  body.appendParagraph(
    ""
  ).setSpacingAfter(
    12
  );

  var metadata = [];

  if (
    block.data.period
  ) {
    metadata.push(
      "Période : " +
      String(
        block.data.period
      )
    );
  }

  metadata.push(
    "Référence : " +
    String(
      model.report.reportId ||
      ""
    )
  );

  var meta =
    body.appendParagraph(
      metadata.join(
        "   •   "
      )
    );

  meta
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setFontSize(
      9
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .muted
    );
}


/**
 * ============================================================
 * SECTION HEADER
 * ============================================================
 */
function ajouterEnTeteSectionSnapshotESGV1_(
  body,
  number,
  title
) {
  var kicker =
    body.appendParagraph(
      String(
        number
      ).padStart(
        2,
        "0"
      ) +
      " — RAPPORT ESG"
    );

  kicker
    .setFontSize(
      8
    )
    .setBold(
      true
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .primary
    )
    .setSpacingAfter(
      5
    );

  var heading =
    body.appendParagraph(
      String(
        title ||
        ""
      )
    );

  heading
    .setBold(
      true
    )
    .setFontSize(
      20
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .dark
    )
    .setSpacingAfter(
      14
    );
}


/**
 * ============================================================
 * SCORE / DATA QUALITY
 * ============================================================
 */
function rendreScoreSnapshotESGV1_(
  body,
  block
) {
  var scores =
    block.data.scores ||
    {};

  ajouterSousTitreSnapshotESGV1_(
    body,
    "ESG Intelligence Score"
  );

  var rows = [
    [
      "Global",
      formaterScoreSnapshotESGV1_(
        scores.esgOverallScoreV2
      )
    ],
    [
      "Environnement",
      formaterScoreSnapshotESGV1_(
        scores.environmentScore
      )
    ],
    [
      "Social",
      formaterScoreSnapshotESGV1_(
        scores.socialScore
      )
    ],
    [
      "Gouvernance",
      formaterScoreSnapshotESGV1_(
        scores.governanceScore
      )
    ]
  ];

  var table =
    body.appendTable(
      rows
    );

  table.setBorderWidth(
    0
  );

  for (
    var i = 0;
    i <
    table.getNumRows();
    i++
  ) {
    var labelCell =
      table.getCell(
        i,
        0
      );

    var scoreCell =
      table.getCell(
        i,
        1
      );

    labelCell
      .setBackgroundColor(
        i === 0
          ? ESG_SNAPSHOT_THEME_V1
              .dark
          : ESG_SNAPSHOT_THEME_V1
              .soft
      );

    scoreCell
      .setBackgroundColor(
        i === 0
          ? ESG_SNAPSHOT_THEME_V1
              .primary
          : ESG_SNAPSHOT_THEME_V1
              .primaryLight
      );

    labelCell
      .getChild(
        0
      )
      .asParagraph()
      .setBold(
        true
      )
      .setFontSize(
        9
      )
      .setForegroundColor(
        i === 0
          ? ESG_SNAPSHOT_THEME_V1
              .white
          : ESG_SNAPSHOT_THEME_V1
              .dark
      );

    scoreCell
      .getChild(
        0
      )
      .asParagraph()
      .setBold(
        true
      )
      .setFontSize(
        i === 0
          ? 14
          : 11
      )
      .setForegroundColor(
        i === 0
          ? ESG_SNAPSHOT_THEME_V1
              .white
          : ESG_SNAPSHOT_THEME_V1
              .primary
      )
      .setAlignment(
        DocumentApp
          .HorizontalAlignment
          .CENTER
      );
  }

  ajouterBarreScoreSnapshotESGV1_(
    body,
    scores.esgOverallScoreV2
  );
}


function rendreDataQualitySnapshotESGV1_(
  body,
  block
) {
  var profile =
    block.data
      .dataQualityProfile ||
    {};

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Qualité et confiance des données"
  );

  var table =
    body.appendTable([
      [
        "Confiance des données",
        formaterScoreSnapshotESGV1_(
          profile
            .dataConfidenceScore
        ),
        "Couverture preuves",
        formaterScoreSnapshotESGV1_(
          profile
            .evidenceCoverageScore
        )
      ],
      [
        "Complétude",
        formaterScoreSnapshotESGV1_(
          profile
            .completenessScore
        ),
        "Revue utilisateur",
        formaterScoreSnapshotESGV1_(
          profile
            .userReviewScore
        )
      ]
    ]);

  styliserTableauKPICompactSnapshotESGV1_(
    table
  );

  if (
    profile.warnings &&
    profile.warnings.length
  ) {
    ajouterNoteSnapshotESGV1_(
      body,
      profile.warnings
        .slice(
          0,
          2
        )
        .join(
          " "
        ),
      "WARNING"
    );
  }
}


/**
 * ============================================================
 * EXECUTIVE SUMMARY
 * ============================================================
 */
function rendreExecutiveSummarySnapshotESGV1_(
  body,
  block,
  narrative
) {
  ajouterSousTitreSnapshotESGV1_(
    body,
    "Lecture exécutive"
  );

  ajouterParagrapheSnapshotESGV1_(
    body,
    narrative ||
    construireNarrationDeterministeSnapshotESGV1_(
      block,
      {
        organization: {
          name:
            block.data
              .organizationName ||
            ""
        }
      }
    )
  );

  var strengths =
    block.data.strengths ||
    [];

  var gaps =
    block.data.gaps ||
    [];

  var risks =
    block.data.risks ||
    [];

  var columns =
    body.appendTable([
      [
        "Forces",
        "Écarts",
        "Risques"
      ],
      [
        formaterListeCompacteSnapshotESGV1_(
          strengths,
          function(item) {
            return (
              item.theme ||
              item.subtheme ||
              item.questionId ||
              "Point fort"
            );
          }
        ),
        formaterListeCompacteSnapshotESGV1_(
          gaps,
          function(item) {
            return (
              item.theme ||
              item.subtheme ||
              item.questionId ||
              "Écart"
            );
          }
        ),
        formaterListeCompacteSnapshotESGV1_(
          risks,
          function(item) {
            return (
              item.description ||
              item.riskId ||
              "Risque"
            );
          }
        )
      ]
    ]);

  styliserTableauTroisColonnesSnapshotESGV1_(
    columns
  );
}


/**
 * ============================================================
 * ORGANIZATION / MATERIALITY / STAKEHOLDERS
 * ============================================================
 */
function rendreOrganisationSnapshotESGV1_(
  body,
  block
) {
  var org =
    block.data.organization ||
    {};

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Profil de l’organisation"
  );

  var rows = [
    [
      "Organisation",
      valeurAffichableSnapshotESGV1_(
        org.name
      )
    ],
    [
      "Type",
      valeurAffichableSnapshotESGV1_(
        org.legalType
      )
    ],
    [
      "Secteur",
      valeurAffichableSnapshotESGV1_(
        org.sector
      )
    ],
    [
      "Pays principal",
      valeurAffichableSnapshotESGV1_(
        org.mainCountry
      )
    ],
    [
      "Zone d’intervention",
      valeurAffichableSnapshotESGV1_(
        org.interventionZone
      )
    ],
    [
      "Effectif",
      valeurAffichableSnapshotESGV1_(
        org.employeeCount
      )
    ]
  ];

  var table =
    body.appendTable(
      rows
    );

  styliserTableauDeuxColonnesSnapshotESGV1_(
    table
  );
}


function rendreMaterialitySnapshotESGV1_(
  body,
  block
) {
  var data =
    block.data || {};

  ajouterSousTitreSnapshotESGV1_(
    body,
    data.mode ===
      "PRELIMINARY_DIAGNOSTIC_TOPICS"
      ? "Enjeux préliminaires"
      : "Enjeux matériels"
  );

  var topics =
    data.topics ||
    [];

  if (!topics.length) {
    ajouterNoteSnapshotESGV1_(
      body,
      "Aucun enjeu de matérialité n’a encore été évalué de manière suffisante.",
      "INFO"
    );

    return;
  }

  var rows = [
    [
      "Sujet",
      "Pilier",
      "Priorité / statut"
    ]
  ];

  topics
    .slice(
      0,
      8
    )
    .forEach(
      function(topic) {
        rows.push([
          String(
            topic.name ||
            ""
          ),
          String(
            topic.pillar ||
            "—"
          ),
          String(
            topic.priority ||
            topic.status ||
            "—"
          )
        ]);
      }
    );

  var table =
    body.appendTable(
      rows
    );

  styliserTableauStandardSnapshotESGV1_(
    table
  );

  if (
    data.disclaimer
  ) {
    ajouterNoteSnapshotESGV1_(
      body,
      data.disclaimer,
      "INFO"
    );
  }
}


function rendreStakeholdersSnapshotESGV1_(
  body,
  block
) {
  var stakeholders =
    block.data.stakeholders ||
    [];

  if (!stakeholders.length) {
    return;
  }

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Parties prenantes"
  );

  var rows = [
    [
      "Partie prenante",
      "Importance",
      "Attente principale"
    ]
  ];

  stakeholders.forEach(
    function(item) {
      rows.push([
        String(
          item.name ||
          item.label ||
          ""
        ),
        String(
          item.relevance ||
          item.priority ||
          "—"
        ),
        String(
          item.expectation ||
          item.notes ||
          "—"
        )
      ]);
    }
  );

  styliserTableauStandardSnapshotESGV1_(
    body.appendTable(
      rows
    )
  );
}


/**
 * ============================================================
 * PILLARS
 * ============================================================
 */
function rendrePilierSnapshotESGV1_(
  body,
  block,
  narrative
) {
  var data =
    block.data || {};

  var label =
    data.pillar ===
      "E"
      ? "Performance environnementale"
      : data.pillar ===
          "S"
        ? "Performance sociale"
        : "Performance de gouvernance";

  ajouterSousTitreSnapshotESGV1_(
    body,
    label
  );

  var scoreTable =
    body.appendTable([
      [
        "Score",
        formaterScoreSnapshotESGV1_(
          data.score
        ),
        "Forces",
        String(
          (
            data.strengths ||
            []
          ).length
        ),
        "Écarts",
        String(
          (
            data.gaps ||
            []
          ).length
        )
      ]
    ]);

  styliserTableauKPICompactSnapshotESGV1_(
    scoreTable
  );

  ajouterBarreScoreSnapshotESGV1_(
    body,
    data.score
  );

  ajouterParagrapheSnapshotESGV1_(
    body,
    narrative ||
    construireNarrationDeterministeSnapshotESGV1_(
      block,
      {}
    )
  );

  if (
    data.strengths &&
    data.strengths.length
  ) {
    ajouterListeSimpleSnapshotESGV1_(
      body,
      "Points forts",
      data.strengths
        .slice(
          0,
          3
        )
        .map(
          function(item) {
            return (
              item.theme ||
              item.subtheme ||
              item.questionId ||
              "Point fort"
            );
          }
        )
    );
  }

  if (
    data.gaps &&
    data.gaps.length
  ) {
    ajouterListeSimpleSnapshotESGV1_(
      body,
      "Écarts prioritaires",
      data.gaps
        .slice(
          0,
          4
        )
        .map(
          function(item) {
            var name =
              item.theme ||
              item.subtheme ||
              item.questionId ||
              "Écart";

            if (
              item.dataStatus ===
                ESG_DATA_STATUS_V1
                  .NOT_AVAILABLE
            ) {
              return (
                name +
                " — donnée non disponible"
              );
            }

            return name;
          }
        )
    );
  }
}


/**
 * ============================================================
 * KPI / TABLES / VISUALS
 * ============================================================
 */
function rendreKPIDashboardSnapshotESGV1_(
  body,
  block
) {
  var kpis =
    block.data.kpis ||
    [];

  if (!kpis.length) {
    return;
  }

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Indicateurs clés"
  );

  kpis.forEach(
    function(kpi) {
      var visual =
        selectionnerVisualisationKPIESGV1_(
          kpi
        );

      ajouterKPICardSnapshotESGV1_(
        body,
        kpi,
        visual
      );

      if (
        visual.type ===
          ESG_VISUALIZATION_TYPE_V1
            .LINE_CHART
      ) {
        ajouterLineChartSnapshotESGV1_(
          body,
          kpi
        );
      }

      if (
        visual.type ===
          ESG_VISUALIZATION_TYPE_V1
            .BAR_CHART ||
        visual.type ===
          ESG_VISUALIZATION_TYPE_V1
            .DONUT_CHART
      ) {
        ajouterCategoryChartSnapshotESGV1_(
          body,
          kpi,
          visual.type
        );
      }
    }
  );
}


function ajouterKPICardSnapshotESGV1_(
  body,
  kpi,
  visual
) {
  var current =
    valeurKPIExisteESGV1_(
      kpi.currentValue
    )
      ? String(
          kpi.currentValue
        ) +
        (
          kpi.unit
            ? " " +
              kpi.unit
            : ""
        )
      : "Non disponible";

  var rows = [
    [
      String(
        kpi.name ||
        "KPI"
      ),
      current
    ]
  ];

  if (
    visual.type ===
      ESG_VISUALIZATION_TYPE_V1
        .DELTA_CARD ||
    visual.type ===
      ESG_VISUALIZATION_TYPE_V1
        .TARGET_PROGRESS
  ) {
    rows.push([
      "Baseline",
      valeurKPIExisteESGV1_(
        kpi.baselineValue
      )
        ? String(
            kpi.baselineValue
          ) +
          (
            kpi.unit
              ? " " +
                kpi.unit
              : ""
          )
        : "—"
    ]);
  }

  if (
    visual.type ===
      ESG_VISUALIZATION_TYPE_V1
        .TARGET_PROGRESS
  ) {
    rows.push([
      "Cible " +
      String(
        kpi.targetYear ||
        ""
      ),
      String(
        kpi.targetValue
      ) +
      (
        kpi.unit
          ? " " +
            kpi.unit
          : ""
      )
    ]);
  }

  var table =
    body.appendTable(
      rows
    );

  styliserTableauDeuxColonnesSnapshotESGV1_(
    table
  );
}


function rendreTableBlockSnapshotESGV1_(
  body,
  block
) {
  var data =
    block.data || {};

  if (
    data.title
  ) {
    ajouterSousTitreSnapshotESGV1_(
      body,
      data.title
    );
  }

  var rows = [];

  if (
    data.columns &&
    data.columns.length
  ) {
    rows.push(
      data.columns
    );
  }

  rows =
    rows.concat(
      data.rows ||
      []
    );

  if (!rows.length) {
    return;
  }

  var table =
    body.appendTable(
      rows
    );

  styliserTableauStandardSnapshotESGV1_(
    table
  );

  if (
    data.disclaimer
  ) {
    ajouterNoteSnapshotESGV1_(
      body,
      data.disclaimer,
      "INFO"
    );
  }
}


/**
 * ============================================================
 * RISKS
 * ============================================================
 */
function rendreRisksSnapshotESGV1_(
  body,
  block
) {
  var risks =
    block.data.risks ||
    [];

  if (!risks.length) {
    return;
  }

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Risques ESG prioritaires"
  );

  /*
   * Snapshot finance-facing :
   * les mesures de mitigation ne sont pas répétées ici.
   * Elles sont déjà portées par les actions prioritaires
   * et la feuille de route. On garde donc un tableau
   * exécutif compact : risque + pilier + niveau.
   */
  var rows = [
    [
      "Risque",
      "Pilier",
      "Niveau"
    ]
  ];

  risks
    .slice(
      0,
      3
    )
    .forEach(
      function(risk) {
        rows.push([
          String(
            risk.description ||
            risk.riskId ||
            ""
          ),
          String(
            risk.pillar ||
            "—"
          ),
          risk.inherentScore !==
            null &&
          risk.inherentScore !==
            undefined
            ? String(
                risk.inherentScore
              )
            : String(
                risk.legacySeverity ||
                "À évaluer"
              )
        ]);
      }
    );

  styliserTableauStandardSnapshotESGV1_(
    body.appendTable(
      rows
    )
  );
}


function rendreRiskMatrixSnapshotESGV1_(
  body,
  block
) {
  if (
    block.data.matrixEligible !==
      true
  ) {
    return;
  }

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Matrice probabilité × impact"
  );

  var risks =
    block.data.risks ||
    [];

  var rows = [
    [
      "Impact \ Prob.",
      "1",
      "2",
      "3",
      "4",
      "5"
    ]
  ];

  for (
    var impact = 5;
    impact >= 1;
    impact--
  ) {
    var row = [
      String(
        impact
      )
    ];

    for (
      var likelihood = 1;
      likelihood <= 5;
      likelihood++
    ) {
      var labels =
        risks
          .filter(
            function(risk) {
              return (
                Number(
                  risk.impact
                ) ===
                  impact &&
                Number(
                  risk.likelihood
                ) ===
                  likelihood
              );
            }
          )
          .map(
            function(risk) {
              return String(
                risk.riskId ||
                "R"
              );
            }
          );

      row.push(
        labels.join(
          ", "
        )
      );
    }

    rows.push(
      row
    );
  }

  var table =
    body.appendTable(
      rows
    );

  styliserHeatmapSnapshotESGV1_(
    table
  );
}


/**
 * ============================================================
 * RECOMMENDATIONS / ROADMAP
 * ============================================================
 */
function rendreRecommendationsSnapshotESGV1_(
  body,
  block
) {
  var recommendations =
    block.data.recommendations ||
    [];

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Actions prioritaires"
  );

  if (!recommendations.length) {
    ajouterNoteSnapshotESGV1_(
      body,
      "Aucune recommandation prioritaire n’est disponible.",
      "INFO"
    );

    return;
  }

  var rows = [
    [
      "Priorité",
      "Action",
      "Pilier"
    ]
  ];

  recommendations.forEach(
    function(item) {
      rows.push([
        String(
          item.priority ||
          "Prioritaire"
        ),
        String(
          item.action ||
          item.title ||
          ""
        ),
        String(
          item.pillar ||
          "—"
        )
      ]);
    }
  );

  styliserTableauStandardSnapshotESGV1_(
    body.appendTable(
      rows
    )
  );
}


function construireLignesRoadmapAffichablesSnapshotESGV1_(
  horizons
) {
  horizons =
    horizons || {};

  var rows = [
    [
      "Horizon",
      "Actions"
    ]
  ];

  [
    {
      key:
        "0_3_MONTHS",

      label:
        "0–3 mois"
    },
    {
      key:
        "3_12_MONTHS",

      label:
        "3–12 mois"
    },
    {
      key:
        "12_24_MONTHS",

      label:
        "12–24 mois"
    }
  ].forEach(
    function(config) {
      var actions =
        Array.isArray(
          horizons[
            config.key
          ]
        )
          ? horizons[
              config.key
            ]
          : [];

      /*
       * Un horizon vide n'est pas rendu.
       * On évite ainsi d'exposer une faiblesse de migration
       * ou de donner l'impression d'une absence stratégique.
       */
      if (!actions.length) {
        return;
      }

      rows.push([
        config.label,

        formaterActionsRoadmapSnapshotESGV1_(
          actions
        )
      ]);
    }
  );

  return rows;
}


function TEST_ESG_ROADMAP_VISIBLE_ROWS_LOCAL() {
  var rows =
    construireLignesRoadmapAffichablesSnapshotESGV1_({
      "0_3_MONTHS": [
        {
          title:
            "Action immédiate"
        }
      ],

      "3_12_MONTHS": [
        {
          title:
            "Action structurante"
        }
      ],

      "12_24_MONTHS":
        [],

      needsReclassification: [
        {
          title:
            "Action legacy ambiguë"
        }
      ]
    });

  return {
    success:
      rows.length ===
        3 &&
      rows.some(
        function(row) {
          return (
            row[0] ===
            "0–3 mois"
          );
        }
      ) &&
      rows.some(
        function(row) {
          return (
            row[0] ===
            "3–12 mois"
          );
        }
      ) &&
      !rows.some(
        function(row) {
          return (
            row[0] ===
            "12–24 mois"
          );
        }
      ),

    rows:
      rows
  };
}


function rendreRoadmapSnapshotESGV1_(
  body,
  block
) {
  var horizons =
    block.data.horizons ||
    {};

  ajouterSousTitreSnapshotESGV1_(
    body,
    "Feuille de route"
  );

  var rows =
    construireLignesRoadmapAffichablesSnapshotESGV1_(
      horizons
    );

  if (
    rows.length >
    1
  ) {
    styliserTableauDeuxColonnesSnapshotESGV1_(
      body.appendTable(
        rows
      )
    );
  } else {
    ajouterNoteSnapshotESGV1_(
      body,
      "Aucune action prioritaire n’est actuellement classée dans la feuille de route.",
      "INFO"
    );
  }

  /*
   * Les actions legacy encore ambiguës restent dans les logs/QC
   * internes. Elles ne sont jamais exposées telles quelles au
   * porteur de projet dans le rapport white-label.
   */
  if (
    horizons
      .needsReclassification &&
    horizons
      .needsReclassification
      .length
  ) {
    console.warn(
      "SNAPSHOT_ROADMAP_RECLASSIFICATION_PENDING=" +
      horizons
        .needsReclassification
        .length
    );
  }
}


/**
 * ============================================================
 * METHODOLOGY / DISCLAIMER
 * ============================================================
 */
function rendreMethodologySnapshotESGV1_(
  body,
  block
) {
  ajouterSousTitreSnapshotESGV1_(
    body,
    "Méthodologie"
  );

  ajouterParagrapheSnapshotESGV1_(
    body,
    "Le diagnostic repose sur des règles de scoring déterministes, des statuts de données explicites et une séparation entre informations déclarées, preuves canoniques, confiance des données et préparation ESG. Les sujets présentés comme préliminaires ne constituent pas une analyse formelle de matérialité."
  );
}


function rendreDisclaimerSnapshotESGV1_(
  body,
  block
) {
  ajouterNoteSnapshotESGV1_(
    body,
    String(
      block.data.text ||
      ""
    ),
    "INFO"
  );
}


/**
 * ============================================================
 * MEDIA
 * ============================================================
 */
function rendreImageSnapshotESGV1_(
  body,
  block,
  model
) {
  var media =
    (
      model.media ||
      []
    ).filter(
      function(item) {
        return (
          item &&
          item.mediaId ===
            block.data.mediaId
        );
      }
    )[0];

  if (
    !media ||
    !media.fileId
  ) {
    return;
  }

  try {
    var blob =
      DriveApp
        .getFileById(
          media.fileId
        )
        .getBlob();

    var paragraph =
      body.appendParagraph(
        ""
      );

    paragraph.setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    );

    var image =
      paragraph
        .appendInlineImage(
          blob
        );

    ajusterImageSnapshotESGV1_(
      image,
      460,
      210
    );

    if (
      media.caption
    ) {
      var caption =
        body.appendParagraph(
          media.caption +
          (
            media.credit
              ? " — " +
                media.credit
              : ""
          )
        );

      caption
        .setAlignment(
          DocumentApp
            .HorizontalAlignment
            .CENTER
        )
        .setFontSize(
          8
        )
        .setForegroundColor(
          ESG_SNAPSHOT_THEME_V1
            .muted
        );
    }
  } catch (
    error
  ) {
    console.warn(
      "Image Snapshot non rendue : " +
      (
        error &&
        error.message
          ? error.message
          : error
      )
    );
  }
}


/**
 * ============================================================
 * CHARTS
 * ============================================================
 */
function ajouterLineChartSnapshotESGV1_(
  body,
  kpi
) {
  try {
    var history =
      kpi.history ||
      [];

    var data =
      Charts
        .newDataTable()
        .addColumn(
          Charts
            .ColumnType
            .STRING,
          "Période"
        )
        .addColumn(
          Charts
            .ColumnType
            .NUMBER,
          kpi.name ||
          "Valeur"
        );

    history.forEach(
      function(point) {
        data.addRow([
          String(
            point.period
          ),
          Number(
            point.value
          )
        ]);
      }
    );

    var chart =
      Charts
        .newLineChart()
        .setDataTable(
          data.build()
        )
        .setDimensions(
          520,
          245
        )
        .setLegendPosition(
          Charts
            .Position
            .NONE
        )
        .setTitle(
          String(
            kpi.name ||
            "Évolution"
          )
        )
        .build();

    ajouterImageChartSnapshotESGV1_(
      body,
      chart
    );
  } catch (
    error
  ) {
    ajouterNoteSnapshotESGV1_(
      body,
      "Graphique non disponible ; les valeurs restent présentées sous forme structurée.",
      "INFO"
    );
  }
}


function ajouterCategoryChartSnapshotESGV1_(
  body,
  kpi,
  type
) {
  try {
    var categories =
      kpi.categories ||
      [];

    var data =
      Charts
        .newDataTable()
        .addColumn(
          Charts
            .ColumnType
            .STRING,
          "Catégorie"
        )
        .addColumn(
          Charts
            .ColumnType
            .NUMBER,
          kpi.name ||
          "Valeur"
        );

    categories.forEach(
      function(item) {
        data.addRow([
          String(
            item.name
          ),
          Number(
            item.value
          )
        ]);
      }
    );

    var chart;

    if (
      type ===
        ESG_VISUALIZATION_TYPE_V1
          .DONUT_CHART
    ) {
      chart =
        Charts
          .newPieChart()
          .setDataTable(
            data.build()
          )
          .setDimensions(
            480,
            245
          )
          .setTitle(
            String(
              kpi.name ||
              "Répartition"
            )
          )
          .setOption(
            "pieHole",
            0.52
          )
          .build();
    } else {
      chart =
        Charts
          .newBarChart()
          .setDataTable(
            data.build()
          )
          .setDimensions(
            520,
            245
          )
          .setLegendPosition(
            Charts
              .Position
              .NONE
          )
          .setTitle(
            String(
              kpi.name ||
              "Comparaison"
            )
          )
          .build();
    }

    ajouterImageChartSnapshotESGV1_(
      body,
      chart
    );
  } catch (
    error
  ) {
    ajouterNoteSnapshotESGV1_(
      body,
      "Graphique non disponible ; les données restent présentées sous forme tabulaire.",
      "INFO"
    );
  }
}


function ajouterImageChartSnapshotESGV1_(
  body,
  chart
) {
  var paragraph =
    body.appendParagraph(
      ""
    );

  paragraph.setAlignment(
    DocumentApp
      .HorizontalAlignment
      .CENTER
  );

  var image =
    paragraph.appendInlineImage(
      chart.getAs(
        "image/png"
      )
    );

  ajusterImageSnapshotESGV1_(
    image,
    500,
    250
  );
}


/**
 * ============================================================
 * STYLING HELPERS
 * ============================================================
 */
function ajouterSousTitreSnapshotESGV1_(
  body,
  text
) {
  var paragraph =
    body.appendParagraph(
      String(
        text ||
        ""
      )
    );

  paragraph
    .setBold(
      true
    )
    .setFontSize(
      12
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .dark
    )
    .setSpacingBefore(
      8
    )
    .setSpacingAfter(
      7
    );

  return paragraph;
}


function ajouterParagrapheSnapshotESGV1_(
  body,
  text
) {
  return body
    .appendParagraph(
      String(
        text ||
        ""
      )
    )
    .setFontSize(
      9.5
    )
    .setLineSpacing(
      1.18
    )
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .JUSTIFY
    )
    .setSpacingAfter(
      8
    );
}


function ajouterListeSimpleSnapshotESGV1_(
  body,
  title,
  items
) {
  if (
    !items ||
    !items.length
  ) {
    return;
  }

  ajouterSousTitreSnapshotESGV1_(
    body,
    title
  );

  items.forEach(
    function(item) {
      body.appendListItem(
        String(
          item || ""
        )
      )
        .setGlyphType(
          DocumentApp
            .GlyphType
            .BULLET
        )
        .setFontSize(
          9
        );
    }
  );
}


function ajouterNoteSnapshotESGV1_(
  body,
  text,
  type
) {
  if (!text) {
    return;
  }

  var background =
    ESG_SNAPSHOT_THEME_V1
      .primaryLight;

  var titleColor =
    ESG_SNAPSHOT_THEME_V1
      .primary;

  if (
    type ===
      "WARNING"
  ) {
    background =
      "#FFF7E8";

    titleColor =
      ESG_SNAPSHOT_THEME_V1
        .warning;
  }

  var table =
    body.appendTable([
      [
        String(
          text
        )
      ]
    ]);

  table.setBorderWidth(
    0
  );

  table
    .getCell(
      0,
      0
    )
    .setBackgroundColor(
      background
    )
    .getChild(
      0
    )
    .asParagraph()
    .setFontSize(
      8.5
    )
    .setForegroundColor(
      titleColor
    )
    .setSpacingBefore(
      3
    )
    .setSpacingAfter(
      3
    );
}


function ajouterBarreScoreSnapshotESGV1_(
  body,
  score
) {
  var numeric =
    Number(
      score
    );

  if (!isFinite(numeric)) {
    return;
  }

  numeric =
    Math.max(
      0,
      Math.min(
        100,
        numeric
      )
    );

  var filled =
    Math.round(
      numeric /
      10
    );

  var row = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ];

  var table =
    body.appendTable([
      row
    ]);

  table.setBorderWidth(
    0
  );

  for (
    var i = 0;
    i < 10;
    i++
  ) {
    table.getCell(
      0,
      i
    )
      .setBackgroundColor(
        i <
        filled
          ? couleurScoreSnapshotESGV1_(
              numeric
            )
          : "#E5E7EB"
      )
      .setPaddingTop(
        3
      )
      .setPaddingBottom(
        3
      );
  }

  body.appendParagraph(
    ""
  ).setSpacingAfter(
    3
  );
}


function couleurScoreSnapshotESGV1_(
  score
) {
  score =
    Number(
      score
    );

  if (
    score >=
    70
  ) {
    return ESG_SNAPSHOT_THEME_V1
      .success;
  }

  if (
    score >=
    45
  ) {
    return ESG_SNAPSHOT_THEME_V1
      .warning;
  }

  return ESG_SNAPSHOT_THEME_V1
    .critical;
}


function styliserTableauKPICompactSnapshotESGV1_(
  table
) {
  table.setBorderWidth(
    0
  );

  for (
    var row = 0;
    row <
    table.getNumRows();
    row++
  ) {
    for (
      var col = 0;
      col <
      table
        .getRow(
          row
        )
        .getNumCells();
      col++
    ) {
      var cell =
        table.getCell(
          row,
          col
        );

      cell.setBackgroundColor(
        col % 2 ===
          0
          ? ESG_SNAPSHOT_THEME_V1
              .soft
          : ESG_SNAPSHOT_THEME_V1
              .primaryLight
      );

      cell
        .getChild(
          0
        )
        .asParagraph()
        .setFontSize(
          col % 2 ===
            0
            ? 8
            : 10
        )
        .setBold(
          col % 2 ===
          1
        )
        .setForegroundColor(
          col % 2 ===
            0
            ? ESG_SNAPSHOT_THEME_V1
                .muted
            : ESG_SNAPSHOT_THEME_V1
                .dark
        );
    }
  }

  bodySpacerSnapshotESGV1_(
    table
  );
}


function styliserTableauTroisColonnesSnapshotESGV1_(
  table
) {
  table.setBorderWidth(
    0
  );

  var headers =
    table.getRow(
      0
    );

  for (
    var i = 0;
    i <
    headers.getNumCells();
    i++
  ) {
    headers
      .getCell(
        i
      )
      .setBackgroundColor(
        ESG_SNAPSHOT_THEME_V1
          .dark
      )
      .getChild(
        0
      )
      .asParagraph()
      .setBold(
        true
      )
      .setFontSize(
        8.5
      )
      .setForegroundColor(
        ESG_SNAPSHOT_THEME_V1
          .white
      );
  }

  for (
    var row = 1;
    row <
    table.getNumRows();
    row++
  ) {
    for (
      var col = 0;
      col <
      table
        .getRow(
          row
        )
        .getNumCells();
      col++
    ) {
      table
        .getCell(
          row,
          col
        )
        .setBackgroundColor(
          ESG_SNAPSHOT_THEME_V1
            .soft
        )
        .getChild(
          0
        )
        .asParagraph()
        .setFontSize(
          8
        );
    }
  }

  bodySpacerSnapshotESGV1_(
    table
  );
}


function styliserTableauDeuxColonnesSnapshotESGV1_(
  table
) {
  table.setBorderWidth(
    0
  );

  for (
    var row = 0;
    row <
    table.getNumRows();
    row++
  ) {
    var cells =
      table.getRow(
        row
      );

    for (
      var col = 0;
      col <
      cells.getNumCells();
      col++
    ) {
      var cell =
        cells.getCell(
          col
        );

      cell.setBackgroundColor(
        col ===
          0
          ? ESG_SNAPSHOT_THEME_V1
              .soft
          : ESG_SNAPSHOT_THEME_V1
              .white
      );

      cell
        .getChild(
          0
        )
        .asParagraph()
        .setFontSize(
          8.5
        )
        .setBold(
          col ===
          0
        )
        .setForegroundColor(
          col ===
            0
            ? ESG_SNAPSHOT_THEME_V1
                .muted
            : ESG_SNAPSHOT_THEME_V1
                .dark
        );
    }
  }

  bodySpacerSnapshotESGV1_(
    table
  );
}


function styliserTableauStandardSnapshotESGV1_(
  table
) {
  table.setBorderWidth(
    1
  );

  if (
    table.getNumRows() ===
    0
  ) {
    return;
  }

  var header =
    table.getRow(
      0
    );

  for (
    var col = 0;
    col <
    header.getNumCells();
    col++
  ) {
    header
      .getCell(
        col
      )
      .setBackgroundColor(
        ESG_SNAPSHOT_THEME_V1
          .dark
      )
      .getChild(
        0
      )
      .asParagraph()
      .setBold(
        true
      )
      .setFontSize(
        8
      )
      .setForegroundColor(
        ESG_SNAPSHOT_THEME_V1
          .white
      );
  }

  for (
    var row = 1;
    row <
    table.getNumRows();
    row++
  ) {
    for (
      var c = 0;
      c <
      table
        .getRow(
          row
        )
        .getNumCells();
      c++
    ) {
      table
        .getCell(
          row,
          c
        )
        .setBackgroundColor(
          row % 2 ===
            0
            ? ESG_SNAPSHOT_THEME_V1
                .soft
            : ESG_SNAPSHOT_THEME_V1
                .white
        )
        .getChild(
          0
        )
        .asParagraph()
        .setFontSize(
          8
        );
    }
  }

  bodySpacerSnapshotESGV1_(
    table
  );
}


function styliserHeatmapSnapshotESGV1_(
  table
) {
  table.setBorderWidth(
    1
  );

  for (
    var row = 0;
    row <
    table.getNumRows();
    row++
  ) {
    for (
      var col = 0;
      col <
      table
        .getRow(
          row
        )
        .getNumCells();
      col++
    ) {
      var cell =
        table.getCell(
          row,
          col
        );

      var paragraph =
        cell
          .getChild(
            0
          )
          .asParagraph();

      paragraph
        .setFontSize(
          7.5
        )
        .setAlignment(
          DocumentApp
            .HorizontalAlignment
            .CENTER
        );

      if (
        row === 0 ||
        col === 0
      ) {
        cell
          .setBackgroundColor(
            ESG_SNAPSHOT_THEME_V1
              .dark
          );

        paragraph
          .setBold(
            true
          )
          .setForegroundColor(
            ESG_SNAPSHOT_THEME_V1
              .white
          );

        continue;
      }

      var impact =
        6 -
        row;

      var likelihood =
        col;

      var score =
        impact *
        likelihood;

      cell.setBackgroundColor(
        score >=
          15
          ? "#F4B7B2"
          : score >=
              8
            ? "#FDE3A7"
            : "#D8EEE3"
      );
    }
  }

  bodySpacerSnapshotESGV1_(
    table
  );
}


function bodySpacerSnapshotESGV1_(
  table
) {
  try {
    table
      .getParent()
      .asBody()
      .appendParagraph(
        ""
      )
      .setSpacingAfter(
        3
      );
  } catch (_) {}
}


function ajusterImageSnapshotESGV1_(
  image,
  maxWidth,
  maxHeight
) {
  if (!image) {
    return;
  }

  var width =
    image.getWidth();

  var height =
    image.getHeight();

  if (
    !width ||
    !height
  ) {
    return;
  }

  var ratio =
    Math.min(
      Number(
        maxWidth ||
        width
      ) /
        width,
      Number(
        maxHeight ||
        height
      ) /
        height,
      1
    );

  image
    .setWidth(
      Math.round(
        width *
        ratio
      )
    )
    .setHeight(
      Math.round(
        height *
        ratio
      )
    );
}


function formaterScoreSnapshotESGV1_(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !isFinite(
      Number(
        value
      )
    )
  ) {
    return "N/D";
  }

  return (
    Math.round(
      Number(
        value
      ) *
      100
    ) /
    100
  ) +
    " / 100";
}


function valeurAffichableSnapshotESGV1_(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Non disponible";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return (
      value.length
        ? value.join(
            ", "
          )
        : "Non disponible"
    );
  }

  return String(
    value
  );
}


function formaterListeCompacteSnapshotESGV1_(
  items,
  mapper
) {
  if (
    !items ||
    !items.length
  ) {
    return "Aucun élément prioritaire.";
  }

  return items
    .slice(
      0,
      3
    )
    .map(
      function(item) {
        return (
          "• " +
          mapper(
            item
          )
        );
      }
    )
    .join(
      "\n"
    );
}


function formaterActionsRoadmapSnapshotESGV1_(
  actions
) {
  actions =
    actions || [];

  if (!actions.length) {
    return "Aucune action classée.";
  }

  return actions
    .slice(
      0,
      5
    )
    .map(
      function(action) {
        return (
          "• " +
          String(
            action.title ||
            "Action"
          )
        );
      }
    )
    .join(
      "\n"
    );
}


/**
 * ============================================================
 * FOOTER / PDF QC
 * ============================================================
 */
function ajouterPiedDePageSnapshotESGV1_(
  document,
  organizationName,
  reportId
) {
  var footer =
    document.addFooter();

  var text = [
    String(
      organizationName ||
      "Organisation"
    ),
    "Rapport ESG",
    String(
      reportId ||
      ""
    )
  ]
    .filter(
      function(value) {
        return !!value;
      }
    )
    .join(
      " — "
    );

  footer
    .appendParagraph(
      text
    )
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setFontSize(
      7.5
    )
    .setForegroundColor(
      ESG_SNAPSHOT_THEME_V1
        .muted
    );
}


function verifierPDFSnapshotESGV1_(
  pdf
) {
  var errors = [];

  if (
    !pdf ||
    !pdf.id
  ) {
    errors.push(
      "PDF_ID_MISSING"
    );
  }

  if (
    !pdf ||
    !pdf.url
  ) {
    errors.push(
      "PDF_URL_MISSING"
    );
  }

  if (
    pdf &&
    pdf.id
  ) {
    try {
      var file =
        DriveApp.getFileById(
          pdf.id
        );

      if (
        file.getSize() <=
        0
      ) {
        errors.push(
          "PDF_EMPTY"
        );
      }
    } catch (
      error
    ) {
      errors.push(
        "PDF_FILE_UNREADABLE"
      );
    }
  }

  return {
    gate:
      "PDF_RENDER_CHECK",

    status:
      errors.length ===
        0
        ? "PASS"
        : "FAIL",

    errors:
      errors,

    warnings: [
      "Le comptage exact des pages PDF doit être contrôlé visuellement avant mise en production du Snapshot V1."
    ],

    timestamp:
      new Date()
        .toISOString()
  };
}


/**
 * ============================================================
 * REAL SMOKE TEST
 * ============================================================
 *
 * Consomme OpenAI si configuré.
 * Produit réellement Google Doc + PDF.
 */
function TEST_ESG_SNAPSHOT_RENDERER_REAL_OPENAI() {
  var profil = {
    organizationName:
      "Kivu Solar Test",

    mainCountry:
      "RDC",

    organizationType:
      "Entreprise",

    mainSector:
      "Énergie solaire",

    employeeCount:
      "36",

    creationYear:
      "2021",

    interventionZone:
      "Afrique centrale"
  };

  var reponses = {};

  obtenirQuestionsESG()
    .forEach(
      function(
        question,
        index
      ) {
        reponses[
          question.question_id
        ] = {
          value:
            index %
            6,

          evidenceLevel:
            index %
              3 ===
              0
              ? "MEDIUM"
              : "DECLARATIVE",

          comment:
            "Test Snapshot renderer.",

          inputMethod:
            "MANUAL",

          userConfirmed:
            true
        };
      }
    );

  var analyse =
    executerDiagnosticEtRecommandationsESG(
      reponses
    );

  var model =
    adapterAnalyseLegacyVersSchemaESGV1(
      profil,
      analyse,
      {},
      {
        profile:
          "SNAPSHOT",

        rawResponses:
          reponses,

        intake: {
          entryMode:
            "manual"
        }
      }
    );

  model =
    executerEvidenceEngineESGV1(
      model
    ).model;

  model =
    executerDataQualityEngineESGV1(
      model
    ).model;

  var result =
    genererSnapshotESGV1(
      model,
      profil
    );

  if (
    !result.success ||
    !result.pdfUrl
  ) {
    throw new Error(
      "Snapshot renderer réel échoué."
    );
  }

  if (
    result
      .aiGeneration
      .providerUsed !==
      "OPENAI"
  ) {
    throw new Error(
      "OPENAI_PRIMARY_EXPECTED_BUT_USED_" +
      String(
        result
          .aiGeneration
          .providerUsed ||
        "NONE"
      )
    );
  }

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}
