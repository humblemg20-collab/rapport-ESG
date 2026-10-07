/**
 * ============================================================
 * AFRIGREEN24 — ESG AI CONFIG V1
 * ============================================================
 *
 * Politique IA :
 * - OpenAI = fournisseur principal ;
 * - HumbleOS = fallback uniquement ;
 * - fallback déterministe final dans le code AfriGreen24 ;
 * - aucun moteur IA ne décide du scoring ESG.
 */

var ESG_AI_CONFIG_V1 = {
  version: "1.0.0",

  providers: {
    primary: "OPENAI",
    fallback: "HUMBLEOS"
  },

  tasks: {
    EXTRACT_DOCUMENT: "EXTRACT_DOCUMENT",
    REWRITE_REPORT: "REWRITE_REPORT"
  },

  defaults: {
    openAIBaseUrl:
      "https://api.openai.com/v1",

    extractModel:
      "gpt-6-luna",

    rewriteModel:
      "gpt-6-luna"
  },

  properties: {
    openAIKey:
      "OPENAI_API_KEY",

    openAIBaseUrl:
      "OPENAI_BASE_URL",

    openAIOrganization:
      "OPENAI_ORGANIZATION_ID",

    openAIProject:
      "OPENAI_PROJECT_ID",

    extractModel:
      "OPENAI_ESG_EXTRACT_MODEL",

    rewriteModel:
      "OPENAI_ESG_REWRITE_MODEL"
  }
};


function obtenirConfigurationESGAI_() {
  var properties =
    PropertiesService
      .getScriptProperties();

  function lire_(propertyName, fallbackValue) {
    var value =
      String(
        properties.getProperty(
          propertyName
        ) || ""
      ).trim();

    return value ||
      fallbackValue ||
      "";
  }

  return {
    version:
      ESG_AI_CONFIG_V1.version,

    primaryProvider:
      ESG_AI_CONFIG_V1
        .providers
        .primary,

    fallbackProvider:
      ESG_AI_CONFIG_V1
        .providers
        .fallback,

    openAI: {
      apiKey:
        lire_(
          ESG_AI_CONFIG_V1
            .properties
            .openAIKey
        ),

      baseUrl:
        lire_(
          ESG_AI_CONFIG_V1
            .properties
            .openAIBaseUrl,
          ESG_AI_CONFIG_V1
            .defaults
            .openAIBaseUrl
        ).replace(
          /\/+$/,
          ""
        ),

      organizationId:
        lire_(
          ESG_AI_CONFIG_V1
            .properties
            .openAIOrganization
        ),

      projectId:
        lire_(
          ESG_AI_CONFIG_V1
            .properties
            .openAIProject
        ),

      extractModel:
        lire_(
          ESG_AI_CONFIG_V1
            .properties
            .extractModel,
          ESG_AI_CONFIG_V1
            .defaults
            .extractModel
        ),

      rewriteModel:
        lire_(
          ESG_AI_CONFIG_V1
            .properties
            .rewriteModel,
          ESG_AI_CONFIG_V1
            .defaults
            .rewriteModel
        )
    }
  };
}


function obtenirModeleOpenAIParTacheESG_(
  task
) {
  var config =
    obtenirConfigurationESGAI_();

  if (
    task ===
    ESG_AI_CONFIG_V1
      .tasks
      .EXTRACT_DOCUMENT
  ) {
    return config
      .openAI
      .extractModel;
  }

  if (
    task ===
    ESG_AI_CONFIG_V1
      .tasks
      .REWRITE_REPORT
  ) {
    return config
      .openAI
      .rewriteModel;
  }

  throw new Error(
    "Tâche IA ESG inconnue : " +
    String(task || "")
  );
}


function TEST_ESG_AI_CONFIG_V1_LOCAL() {
  var errors = [];

  if (
    ESG_AI_CONFIG_V1
      .providers
      .primary !==
    "OPENAI"
  ) {
    errors.push(
      "Le provider principal doit être OPENAI."
    );
  }

  if (
    ESG_AI_CONFIG_V1
      .providers
      .fallback !==
    "HUMBLEOS"
  ) {
    errors.push(
      "Le fallback doit être HUMBLEOS."
    );
  }

  return {
    success:
      errors.length === 0,

    errors:
      errors,

    primary:
      ESG_AI_CONFIG_V1
        .providers
        .primary,

    fallback:
      ESG_AI_CONFIG_V1
        .providers
        .fallback
  };
}
