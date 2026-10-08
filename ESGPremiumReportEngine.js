/**
 * ============================================================
 * ESG PREMIUM REPORT ENGINE V2
 * ============================================================
 *
 * Facade for the premium HTML/CSS renderer.
 *
 * This engine is NOT wired into the production report router yet.
 * It can be called explicitly for smoke tests after the renderer
 * service is deployed.
 */

var ESG_PREMIUM_REPORT_ENGINE_VERSION_V2 =
  "ESG_PREMIUM_REPORT_ENGINE_V2";


function genererSnapshotPremiumESGV2(
  canonicalModel,
  profil,
  options
) {
  profil =
    profil || {};

  options =
    options || {};

  var validation =
    validerESGReportSchemaV1(
      canonicalModel
    );

  if (
    validation.valid !==
      true
  ) {
    throw new Error(
      "ESG_PREMIUM_SCHEMA_INVALID: " +
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
      "ESG_PREMIUM_PRE_RENDER_QC_FAILED: " +
      preRenderQC
        .failedGates
        .join(
          " | "
        )
    );
  }

  var reportId =
    model.report.reportId ||
    creerIdentifiantRapportESG_();

  model.report.reportId =
    reportId;

  var editorial =
    preparerDocumentEditorialESGV2_(
      model,
      profil
    );

  model =
    editorial.model;

  var renderer =
    appelerPremiumRendererESGV2_(
      model,
      profil,
      options
    );

  var organisation =
    nettoyerNomFichierESG_(
      model.organization.name ||
      "Organisation"
    );

  var fileName =
    "Rapport ESG Premium - " +
    organisation +
    " - " +
    reportId +
    ".pdf";

  var dossier =
    obtenirOuCreerDossierRapportsESG_();

  var blob =
    renderer
      .blob
      .setName(
        fileName
      );

  var pdfFile =
    dossier.createFile(
      blob
    );

  var pdfId =
    pdfFile.getId();

  var pdfUrl =
    pdfFile.getUrl();

  var pdfDownloadUrl =
    "https://drive.google.com/uc?export=download&id=" +
    pdfId;

  return {
    success:
      true,

    version:
      ESG_PREMIUM_REPORT_ENGINE_VERSION_V2,

    rendererVersion:
      renderer.rendererVersion,

    reportId:
      reportId,

    profile:
      "SNAPSHOT",

    designProfile:
      renderer.designProfile,

    sectorProfile:
      renderer.sectorProfile,

    logicalSectionCount:
      model
        .report
        .sections
        .length,

    aiGeneration: {
      providerUsed:
        editorial
          .narration
          .providerUsed,

      providerFallbackUsed:
        editorial
          .narration
          .fallbackUsed ===
          true,

      deterministicFallbackUsed:
        editorial
          .narration
          .deterministicFallbackUsed ===
          true,

      blockCount:
        editorial
          .narration
          .blockCount,

      attempts:
        editorial
          .narration
          .attempts || []
    },

    pdfId:
      pdfId,

    pdfUrl:
      pdfUrl,

    pdfDownloadUrl:
      pdfDownloadUrl,

    folderId:
      dossier.getId(),

    fileName:
      fileName,

    quality: {
      schema:
        "PASS",

      composition:
        composition.validation,

      preRender:
        preRenderQC,

      contentParity:
        editorial.parity,

      rendererQA:
        renderer.qaStatus,

      pagination:
        renderer.pagination || {
          compactedSections:
            0,

          continuationSections:
            0
        }
    },

    rendererLatencyMs:
      renderer.latencyMs
  };
}


function genererSnapshotPremiumAvecFallbackESGV2(
  canonicalModel,
  profil,
  options
) {
  var config =
    obtenirConfigPremiumRendererESGV2_();

  if (
    config.enabled !==
      true
  ) {
    var disabledFallback =
      genererSnapshotESGV1(
        canonicalModel,
        profil
      );

    disabledFallback
      .premiumRenderer = {
        attempted:
          false,

        fallbackUsed:
          true,

        reason:
          "RENDERER_DISABLED"
      };

    return disabledFallback;
  }

  try {
    var premium =
      genererSnapshotPremiumESGV2(
        canonicalModel,
        profil,
        options
      );

    premium.premiumRenderer = {
      attempted:
        true,

      fallbackUsed:
        false,

      reason:
        ""
    };

    return premium;

  } catch (
    error
  ) {
    console.error(
      JSON.stringify({
        event:
          "esg_premium_renderer_fallback",

        status:
          "FALLBACK",

        error:
          error &&
          error.message
            ? error.message
            : String(
                error
              )
      })
    );

    var fallback =
      genererSnapshotESGV1(
        canonicalModel,
        profil
      );

    fallback
      .premiumRenderer = {
        attempted:
          true,

        fallbackUsed:
          true,

        reason:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
            .slice(
              0,
              300
            )
      };

    return fallback;
  }
}


function TEST_ESG_PREMIUM_REPORT_ENGINE_V2_LOCAL() {
  var config =
    {
      enabled:
        true,

      url:
        "https://renderer.example.com",

      token:
        "configured"
    };

  var validation =
    validerConfigPremiumRendererESGV2_(
      config
    );

  return {
    success:
      validation.valid ===
        true &&
      ESG_PREMIUM_REPORT_ENGINE_VERSION_V2 ===
        "ESG_PREMIUM_REPORT_ENGINE_V2"
  };
}
