/**
 * ============================================================
 * ESG PREMIUM REPORT ENGINE V2
 * ============================================================
 *
 * Facade for the premium HTML/CSS renderer.
 *
 * This engine is wired into the report router behind the explicit
 * PREMIUM_V2 feature mode. The renderer itself remains independently
 * controlled by Script Properties and falls back to SNAPSHOT_V1 on
 * renderer failure.
 */

var ESG_PREMIUM_REPORT_ENGINE_VERSION_V2 =
  "ESG_PREMIUM_REPORT_ENGINE_V2";


function preparerSnapshotPremiumESGV2_(
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
      profil,
      {
        narrativeMode:
          options.narrativeMode ||
          ""
      }
    );

  model =
    editorial.model;

  var presentationSpec =
    construirePresentationSpecESGV2_(
      model,
      profil,
      options
    );

  return {
    success:
      true,

    reportId:
      reportId,

    model:
      model,

    presentationSpec:
      presentationSpec,

    validation:
      validation,

    composition:
      composition,

    preRenderQC:
      preRenderQC,

    editorial:
      editorial
  };
}


function genererSnapshotPremiumESGV2(
  canonicalModel,
  profil,
  options
) {
  profil =
    profil || {};

  options =
    options || {};

  var prepared =
    preparerSnapshotPremiumESGV2_(
      canonicalModel,
      profil,
      options
    );

  var model =
    prepared.model;

  var reportId =
    prepared.reportId;

  var editorial =
    prepared.editorial;

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

    documentId:
      "",

    docId:
      "",

    documentUrl:
      "",

    docUrl:
      "",

    editableDocumentAvailable:
      false,

    deliveryFormat:
      "PDF",

    folderId:
      dossier.getId(),

    fileName:
      fileName,

    quality: {
      schema:
        "PASS",

      composition:
        prepared
          .composition
          .validation,

      preRender:
        prepared
          .preRenderQC,

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


function TEST_ESG_PREMIUM_CONTENT_PARITY_KIVU_V2_LOCAL() {
  var fixture =
    construireFixtureKivuSolarESGV2_();

  var prepared =
    preparerSnapshotPremiumESGV2_(
      fixture.model,
      fixture.profil,
      {
        narrativeMode:
          "DETERMINISTIC_ONLY"
      }
    );

  var manifest =
    prepared
      .model
      .report
      .presentation
      .contentManifest || [];

  var riskManifest =
    manifest.filter(
      function(item) {
        return (
          item.type ===
          "RISK_BLOCK"
        );
      }
    )[0];

  var recommendationManifest =
    manifest.filter(
      function(item) {
        return (
          item.type ===
          "RECOMMENDATION_BLOCK"
        );
      }
    )[0];

  var tableRows =
    manifest
      .filter(
        function(item) {
          return (
            item.type ===
            "TABLE_BLOCK"
          );
        }
      )
      .reduce(
        function(
          total,
          item
        ) {
          return (
            total +
            Number(
              item.itemCounts &&
              item.itemCounts.rows
                ? item.itemCounts.rows
                : 0
            )
          );
        },
        0
      );

  var expectedRiskCount =
    Math.min(
      (
        fixture.model.risks ||
        []
      ).length,
      3
    );

  var expectedRecommendationCount =
    Math.min(
      (
        fixture.model
          .recommendations ||
        []
      ).length,
      4
    );

  var actualRiskCount =
    Number(
      riskManifest &&
      riskManifest.itemCounts &&
      riskManifest
        .itemCounts
        .risks
        ? riskManifest
            .itemCounts
            .risks
        : 0
    );

  var actualRecommendationCount =
    Number(
      recommendationManifest &&
      recommendationManifest.itemCounts &&
      recommendationManifest
        .itemCounts
        .recommendations
        ? recommendationManifest
            .itemCounts
            .recommendations
        : 0
    );

  return {
    success:
      prepared
        .editorial
        .parity
        .success ===
        true &&
      actualRiskCount ===
        expectedRiskCount &&
      actualRecommendationCount ===
        expectedRecommendationCount &&
      prepared
        .editorial
        .parity
        .narrativeRequiredCount ===
      prepared
        .editorial
        .parity
        .narrativePresentCount,

    reportId:
      prepared.reportId,

    sectionCount:
      prepared
        .model
        .report
        .sections
        .length,

    blockCount:
      manifest.length,

    expectedItemCount:
      prepared
        .editorial
        .parity
        .expectedItemCount,

    risks: {
      canonical:
        (
          fixture.model.risks ||
          []
        ).length,

      selectedExpected:
        expectedRiskCount,

      manifested:
        actualRiskCount
    },

    recommendations: {
      canonical:
        (
          fixture.model
            .recommendations ||
          []
        ).length,

      selectedExpected:
        expectedRecommendationCount,

      manifested:
        actualRecommendationCount
    },

    recommendedIndicatorRows:
      tableRows,

    narratives: {
      required:
        prepared
          .editorial
          .parity
          .narrativeRequiredCount,

      present:
        prepared
          .editorial
          .parity
          .narrativePresentCount
    },

    parity:
      prepared
        .editorial
        .parity
  };
}


function EXPORT_ESG_PREMIUM_SPEC_KIVU_V2() {
  var fixture =
    construireFixtureKivuSolarESGV2_();

  var prepared =
    preparerSnapshotPremiumESGV2_(
      fixture.model,
      fixture.profil,
      {
        designProfile:
          ESG_DESIGN_PROFILE_V2
            .INVESTOR_PREMIUM
      }
    );

  var fileName =
    "ESG Premium Presentation Spec - Kivu Solar Test - " +
    prepared.reportId +
    ".json";

  var blob =
    Utilities.newBlob(
      JSON.stringify(
        prepared.presentationSpec,
        null,
        2
      ),
      "application/json",
      fileName
    );

  var dossier =
    obtenirOuCreerDossierRapportsESG_();

  var file =
    dossier.createFile(
      blob
    );

  var result = {
    success:
      true,

    reportId:
      prepared.reportId,

    fileId:
      file.getId(),

    fileName:
      fileName,

    fileUrl:
      file.getUrl(),

    sectionCount:
      prepared
        .model
        .report
        .sections
        .length,

    blockCount:
      prepared
        .model
        .report
        .presentation
        .contentManifest
        .length,

    expectedItemCount:
      prepared
        .editorial
        .parity
        .expectedItemCount,

    contentParity:
      prepared
        .editorial
        .parity
  };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


function TEST_ESG_PREMIUM_ENGINE_REAL() {
  var fixture =
    construireFixtureKivuSolarESGV2_();

  var config =
    obtenirConfigPremiumRendererESGV2_();

  var configValidation =
    validerConfigPremiumRendererESGV2_(
      config
    );

  if (
    configValidation.valid !==
      true
  ) {
    throw new Error(
      "ESG_PREMIUM_RENDERER_NOT_READY: " +
      configValidation
        .errors
        .join(
          " | "
        )
    );
  }

  var health =
    testerHealthPremiumRendererESGV2_();

  if (
    health.success !==
      true
  ) {
    throw new Error(
      "ESG_PREMIUM_RENDERER_HEALTH_FAILED: " +
      String(
        health.status
      )
    );
  }

  var result =
    genererSnapshotPremiumESGV2(
      fixture.model,
      fixture.profil,
      {
        designProfile:
          ESG_DESIGN_PROFILE_V2
            .INVESTOR_PREMIUM
      }
    );

  if (
    !result.success ||
    !result.pdfUrl ||
    result.quality.rendererQA !==
      "PASS"
  ) {
    throw new Error(
      "ESG_PREMIUM_REAL_GENERATION_FAILED"
    );
  }

  Logger.log(
    JSON.stringify(
      {
        success:
          true,

        reportId:
          result.reportId,

        pdfUrl:
          result.pdfUrl,

        rendererVersion:
          result.rendererVersion,

        designProfile:
          result.designProfile,

        sectorProfile:
          result.sectorProfile,

        rendererQA:
          result
            .quality
            .rendererQA,

        pagination:
          result
            .quality
            .pagination,

        aiGeneration:
          result
            .aiGeneration
      },
      null,
      2
    )
  );

  return result;
}


function TEST_ESG_PREMIUM_ROUTER_FALLBACK_LOCAL() {
  var properties =
    PropertiesService
      .getScriptProperties();

  var oldEnabled =
    properties.getProperty(
      "ESG_PREMIUM_RENDERER_ENABLED"
    );

  try {
    properties.setProperty(
      "ESG_PREMIUM_RENDERER_ENABLED",
      "false"
    );

    var fixture =
      construireFixtureKivuSolarESGV2_();

    var result =
      genererSnapshotPremiumAvecFallbackESGV2(
        fixture.model,
        fixture.profil,
        {
          narrativeMode:
            "DETERMINISTIC_ONLY"
        }
      );

    return {
      success:
        result &&
        result.success ===
          true &&
        result.premiumRenderer &&
        result
          .premiumRenderer
          .fallbackUsed ===
          true &&
        result
          .premiumRenderer
          .reason ===
          "RENDERER_DISABLED",

      premiumRenderer:
        result
          .premiumRenderer
    };

  } finally {
    if (
      oldEnabled ===
        null ||
      oldEnabled ===
        undefined
    ) {
      properties.deleteProperty(
        "ESG_PREMIUM_RENDERER_ENABLED"
      );
    } else {
      properties.setProperty(
        "ESG_PREMIUM_RENDERER_ENABLED",
        oldEnabled
      );
    }
  }
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
