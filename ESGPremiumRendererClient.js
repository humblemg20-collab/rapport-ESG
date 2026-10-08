/**
 * ============================================================
 * ESG PREMIUM RENDERER CLIENT V2
 * ============================================================
 *
 * Calls the separate HTML/CSS/Chromium renderer.
 * OFF by default.
 *
 * Script Properties:
 * - ESG_PREMIUM_RENDERER_ENABLED
 * - ESG_PREMIUM_RENDERER_URL
 * - ESG_PREMIUM_RENDERER_TOKEN
 * - ESG_PRESENTATION_DESIGN_PROFILE
 */

var ESG_PREMIUM_RENDERER_CLIENT_VERSION_V2 =
  "ESG_PREMIUM_RENDERER_CLIENT_V2";


function obtenirConfigPremiumRendererESGV2_() {
  var properties =
    PropertiesService
      .getScriptProperties();

  var enabled =
    String(
      properties.getProperty(
        "ESG_PREMIUM_RENDERER_ENABLED"
      ) ||
      "false"
    )
      .trim()
      .toLowerCase() ===
      "true";

  var url =
    String(
      properties.getProperty(
        "ESG_PREMIUM_RENDERER_URL"
      ) ||
      ""
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  var token =
    String(
      properties.getProperty(
        "ESG_PREMIUM_RENDERER_TOKEN"
      ) ||
      ""
    )
      .trim();

  var designProfile =
    obtenirDesignProfileESGV2_(
      properties.getProperty(
        "ESG_PRESENTATION_DESIGN_PROFILE"
      ) ||
      ESG_DESIGN_PROFILE_V2
        .INVESTOR_PREMIUM
    );

  return {
    enabled:
      enabled,

    url:
      url,

    token:
      token,

    designProfile:
      designProfile
  };
}


function validerConfigPremiumRendererESGV2_(
  config
) {
  var errors = [];

  if (!config.enabled) {
    errors.push(
      "RENDERER_DISABLED"
    );
  }

  if (!config.url) {
    errors.push(
      "RENDERER_URL_MISSING"
    );
  }

  if (
    config.url &&
    !/^https:\/\//i.test(
      config.url
    ) &&
    !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
      config.url
    )
  ) {
    errors.push(
      "RENDERER_URL_INVALID"
    );
  }

  if (!config.token) {
    errors.push(
      "RENDERER_TOKEN_MISSING"
    );
  }

  return {
    valid:
      errors.length ===
      0,

    errors:
      errors
  };
}


function appelerPremiumRendererESGV2_(
  documentModel,
  profil,
  options
) {
  var config =
    obtenirConfigPremiumRendererESGV2_();

  var validation =
    validerConfigPremiumRendererESGV2_(
      config
    );

  if (
    validation.valid !==
    true
  ) {
    throw new Error(
      "ESG_PREMIUM_RENDERER_CONFIG_INVALID: " +
      validation.errors.join(
        " | "
      )
    );
  }

  options =
    options || {};

  options.designProfile =
    options.designProfile ||
    config.designProfile;

  var payload =
    construirePresentationSpecESGV2_(
      documentModel,
      profil,
      options
    );

  var startedAt =
    Date.now();

  var response =
    UrlFetchApp.fetch(
      config.url +
      "/v1/render",
      {
        method:
          "post",

        contentType:
          "application/json",

        payload:
          JSON.stringify(
            payload
          ),

        headers: {
          Authorization:
            "Bearer " +
            config.token,

          "X-ESG-Contract-Version":
            ESG_PRESENTATION_CONTRACT_VERSION_V2
        },

        muteHttpExceptions:
          true,

        followRedirects:
          false
      }
    );

  var status =
    response.getResponseCode();

  var latencyMs =
    Date.now() -
    startedAt;

  console.log(
    JSON.stringify({
      event:
        "esg_premium_renderer",

      version:
        ESG_PREMIUM_RENDERER_CLIENT_VERSION_V2,

      status:
        status >= 200 &&
        status < 300
          ? "PASS"
          : "FAIL",

      httpStatus:
        status,

      latencyMs:
        latencyMs,

      designProfile:
        payload.designProfile,

      sectorProfile:
        payload.sectorProfile
    })
  );

  if (
    status < 200 ||
    status >= 300
  ) {
    var body =
      "";

    try {
      body =
        response
          .getContentText()
          .slice(
            0,
            500
          );
    } catch (
      ignore
    ) {}

    throw new Error(
      "ESG_PREMIUM_RENDERER_HTTP_" +
      status +
      (
        body
          ? ": " +
            body
          : ""
      )
    );
  }

  var headers =
    response.getHeaders();

  var contentType =
    String(
      headers[
        "Content-Type"
      ] ||
      headers[
        "content-type"
      ] ||
      ""
    )
      .toLowerCase();

  if (
    contentType.indexOf(
      "application/pdf"
    ) === -1
  ) {
    throw new Error(
      "ESG_PREMIUM_RENDERER_NOT_PDF"
    );
  }

  var qaStatus =
    String(
      headers[
        "X-ESG-QA-Status"
      ] ||
      headers[
        "x-esg-qa-status"
      ] ||
      ""
    )
      .trim()
      .toUpperCase();

  if (
    qaStatus !==
    "PASS"
  ) {
    throw new Error(
      "ESG_PREMIUM_RENDERER_QA_NOT_PASS"
    );
  }

  var blob =
    response.getBlob();

  if (
    !blob ||
    blob.getBytes().length ===
      0
  ) {
    throw new Error(
      "ESG_PREMIUM_RENDERER_EMPTY_PDF"
    );
  }

  var compactedSections =
    Number(
      headers[
        "X-ESG-Pagination-Compacted"
      ] ||
      headers[
        "x-esg-pagination-compacted"
      ] ||
      0
    );

  var continuationSections =
    Number(
      headers[
        "X-ESG-Continuation-Sections"
      ] ||
      headers[
        "x-esg-continuation-sections"
      ] ||
      0
    );

  var fragmentationRiskSections =
    Number(
      headers[
        "X-ESG-Fragmentation-Risk-Sections"
      ] ||
      headers[
        "x-esg-fragmentation-risk-sections"
      ] ||
      0
    );

  return {
    success:
      true,

    blob:
      blob,

    latencyMs:
      latencyMs,

    designProfile:
      payload.designProfile,

    sectorProfile:
      payload.sectorProfile,

    qaStatus:
      qaStatus,

    pagination: {
      compactedSections:
        isFinite(
          compactedSections
        )
          ? compactedSections
          : 0,

      continuationSections:
        isFinite(
          continuationSections
        )
          ? continuationSections
          : 0,

      fragmentationRiskSections:
        isFinite(
          fragmentationRiskSections
        )
          ? fragmentationRiskSections
          : 0
    },

    rendererVersion:
      String(
        headers[
          "X-ESG-Renderer-Version"
        ] ||
        headers[
          "x-esg-renderer-version"
        ] ||
        ""
      )
  };
}


function testerHealthPremiumRendererESGV2_() {
  var config =
    obtenirConfigPremiumRendererESGV2_();

  if (!config.url) {
    throw new Error(
      "ESG_PREMIUM_RENDERER_URL_MISSING"
    );
  }

  var response =
    UrlFetchApp.fetch(
      config.url +
      "/health",
      {
        method:
          "get",

        muteHttpExceptions:
          true,

        followRedirects:
          false
      }
    );

  var status =
    response.getResponseCode();

  return {
    success:
      status ===
      200,

    status:
      status,

    body:
      response
        .getContentText()
        .slice(
          0,
          500
        )
  };
}


function TEST_ESG_PREMIUM_RENDERER_CLIENT_V2_LOCAL() {
  var good =
    validerConfigPremiumRendererESGV2_({
      enabled:
        true,

      url:
        "https://renderer.example.com",

      token:
        "configured"
    });

  var bad =
    validerConfigPremiumRendererESGV2_({
      enabled:
        false,

      url:
        "",

      token:
        ""
    });

  return {
    success:
      good.valid ===
        true &&
      bad.valid ===
        false &&
      bad.errors.indexOf(
        "RENDERER_DISABLED"
      ) !==
        -1 &&
      bad.errors.indexOf(
        "RENDERER_URL_MISSING"
      ) !==
        -1 &&
      bad.errors.indexOf(
        "RENDERER_TOKEN_MISSING"
      ) !==
        -1,

    good:
      good,

    bad:
      bad
  };
}
