/**
 * ============================================================
 * AFRIGREEN24 — OPENAI PROVIDER V1
 * ============================================================
 *
 * Provider serveur pour l'API Responses.
 * La clé API reste exclusivement dans Script Properties.
 *
 * Ce fichier :
 * - ne calcule aucun score ESG ;
 * - ne modifie aucune règle métier ;
 * - retourne uniquement des sorties structurées à valider ensuite.
 */

function appelerOpenAIResponsesESG_(
  task,
  request
) {
  request = request || {};

  var config =
    obtenirConfigurationESGAI_();

  var apiKey =
    String(
      config.openAI.apiKey || ""
    ).trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY non configurée."
    );
  }

  var model =
    String(
      request.model ||
      obtenirModeleOpenAIParTacheESG_(
        task
      ) ||
      ""
    ).trim();

  if (!model) {
    throw new Error(
      "Modèle OpenAI ESG non configuré."
    );
  }

  var endpoint =
    String(
      config.openAI.baseUrl ||
      ""
    ).replace(
      /\/+$/,
      ""
    ) +
    "/responses";

  if (
    !/^https:\/\//i.test(
      endpoint
    )
  ) {
    throw new Error(
      "OPENAI_BASE_URL doit utiliser HTTPS."
    );
  }

  var body = {
    model:
      model,

    store:
      false,

    input:
      request.input || [],

    text: {
      format:
        request.schema
          ? {
              type:
                "json_schema",

              name:
                String(
                  request.schemaName ||
                  "esg_structured_output"
                ),

              strict:
                true,

              schema:
                request.schema
            }
          : {
              type:
                "text"
            }
    }
  };

  if (
    request.instructions
  ) {
    body.instructions =
      String(
        request.instructions
      );
  }

  if (
    request.maxOutputTokens
  ) {
    body.max_output_tokens =
      Number(
        request.maxOutputTokens
      );
  }

  var headers = {
    Authorization:
      "Bearer " +
      apiKey,

    Accept:
      "application/json"
  };

  if (
    config.openAI.organizationId
  ) {
    headers[
      "OpenAI-Organization"
    ] =
      config.openAI.organizationId;
  }

  if (
    config.openAI.projectId
  ) {
    headers[
      "OpenAI-Project"
    ] =
      config.openAI.projectId;
  }

  var startedAt =
    new Date()
      .getTime();

  var response =
    UrlFetchApp.fetch(
      endpoint,
      {
        method:
          "post",

        contentType:
          "application/json",

        headers:
          headers,

        payload:
          JSON.stringify(
            body
          ),

        muteHttpExceptions:
          true
      }
    );

  var latencyMs =
    new Date()
      .getTime() -
    startedAt;

  var statusCode =
    response
      .getResponseCode();

  var responseText =
    response
      .getContentText();

  var parsed;

  try {
    parsed =
      responseText
        ? JSON.parse(
            responseText
          )
        : {};
  } catch (parseError) {
    throw new Error(
      "OpenAI a répondu avec un JSON HTTP invalide " +
      "(HTTP " +
      statusCode +
      ")."
    );
  }

  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {
    var apiMessage =
      parsed &&
      parsed.error &&
      parsed.error.message
        ? parsed.error.message
        : responseText.substring(
            0,
            1000
          );

    var error =
      new Error(
        "OpenAI ESG refusé (HTTP " +
        statusCode +
        ") : " +
        apiMessage
      );

    error.code =
      parsed &&
      parsed.error &&
      parsed.error.code
        ? parsed.error.code
        : "OPENAI_HTTP_" +
          statusCode;

    throw error;
  }

  if (
    parsed.status &&
    parsed.status !== "completed"
  ) {
    throw new Error(
      "OpenAI ESG réponse non terminée : " +
      String(
        parsed.status
      )
    );
  }

  var outputText =
    extraireOutputTextOpenAIResponseESG_(
      parsed
    );

  if (!outputText) {
    throw new Error(
      "OpenAI ESG n'a retourné aucun output_text exploitable."
    );
  }

  return {
    success:
      true,

    provider:
      "OPENAI",

    task:
      task,

    model:
      parsed.model ||
      model,

    responseId:
      parsed.id ||
      "",

    latencyMs:
      latencyMs,

    usage:
      parsed.usage || {},

    outputText:
      outputText,

    rawStatus:
      parsed.status ||
      "completed"
  };
}


function extraireOutputTextOpenAIResponseESG_(
  response
) {
  response = response || {};

  if (
    typeof response.output_text ===
      "string" &&
    response.output_text.trim()
  ) {
    return response
      .output_text
      .trim();
  }

  var texts = [];

  (
    response.output ||
    []
  ).forEach(
    function(item) {
      (
        item &&
        item.content
          ? item.content
          : []
      ).forEach(
        function(content) {
          if (
            content &&
            content.type ===
              "output_text" &&
            typeof content.text ===
              "string"
          ) {
            texts.push(
              content.text
            );
          }

          if (
            content &&
            content.type ===
              "refusal"
          ) {
            throw new Error(
              "OpenAI ESG a refusé la requête : " +
              String(
                content.refusal ||
                ""
              )
            );
          }
        }
      );
    }
  );

  return texts
    .join("\n")
    .trim();
}


function parserJSONStructureOpenAIESG_(
  result
) {
  var text =
    result &&
    result.outputText
      ? String(
          result.outputText
        )
      : "";

  if (!text) {
    throw new Error(
      "Sortie structurée OpenAI ESG vide."
    );
  }

  try {
    return JSON.parse(
      text
    );
  } catch (error) {
    throw new Error(
      "Sortie structurée OpenAI ESG invalide."
    );
  }
}


function construireSchemaExtractionOpenAIESG_(
  definitions
) {
  var paths =
    (definitions || [])
      .map(
        function(definition) {
          return String(
            definition.path || ""
          );
        }
      )
      .filter(
        function(path) {
          return !!path;
        }
      );

  return {
    type:
      "object",

    properties: {
      fields: {
        type:
          "array",

        items: {
          type:
            "object",

          properties: {
            path: {
              type:
                "string",

              enum:
                paths
            },

            value_text: {
              type:
                "string"
            },

            confidence: {
              type:
                "number",
              minimum:
                0,
              maximum:
                1
            },

            evidence: {
              type:
                "string"
            }
          },

          required: [
            "path",
            "value_text",
            "confidence",
            "evidence"
          ],

          additionalProperties:
            false
        }
      }
    },

    required: [
      "fields"
    ],

    additionalProperties:
      false
  };
}


function preparerDefinitionsExtractionOpenAIESG_(
  definitions
) {
  return (definitions || []).map(
    function(definition) {
      return {
        path:
          String(
            definition.path || ""
          ),

        label:
          String(
            definition.label || ""
          ),

        type:
          String(
            definition.type || "text"
          ),

        allowedValues:
          (
            definition.options ||
            []
          ).map(
            function(option) {
              if (
                option &&
                typeof option ===
                  "object"
              ) {
                return {
                  value:
                    String(
                      option.value
                    ),

                  label:
                    String(
                      option.label ||
                      option.value
                    )
                };
              }

              return {
                value:
                  String(option),

                label:
                  String(option)
              };
            }
          )
      };
    }
  );
}


function extraireESGAvecOpenAI_(
  sourceText,
  definitions,
  documentMode
) {
  sourceText =
    String(
      sourceText || ""
    );

  if (!sourceText.trim()) {
    throw new Error(
      "Source ESG vide pour OpenAI."
    );
  }

  if (
    !Array.isArray(
      definitions
    ) ||
    definitions.length === 0
  ) {
    throw new Error(
      "Définitions ESG absentes pour OpenAI."
    );
  }

  var extractionContract =
    preparerDefinitionsExtractionOpenAIESG_(
      definitions
    );

  var instructions = [
    "Tu es le moteur d'extraction documentaire ESG d'un système de diagnostic.",
    "Tu dois extraire uniquement ce qui est explicitement soutenu par le document fourni.",
    "N'invente jamais une valeur absente.",
    "N'infère jamais un niveau de maturité supérieur à ce que le texte démontre.",
    "Pour chaque champ extrait, evidence doit être un extrait textuel exact et contigu présent dans SOURCE_DOCUMENT.",
    "Si l'information n'est pas suffisamment établie, n'ajoute pas le champ.",
    "Pour un champ multiselect, sépare plusieurs valeurs exactes par ||.",
    "Pour les questions ESG, respecte strictement les valeurs documentaires autorisées présentes dans FIELD_DEFINITIONS.",
    "Les champs retournés doivent utiliser uniquement les paths autorisés."
  ].join(" ");

  var input = [
    {
      role:
        "user",

      content: [
        "DOCUMENT_MODE: " +
          String(
            documentMode ||
            "NARRATIVE_ESG"
          ),

        "FIELD_DEFINITIONS:",
        JSON.stringify(
          extractionContract
        ),

        "SOURCE_DOCUMENT:",
        sourceText
      ].join(
        "\n\n"
      )
    }
  ];

  var result =
    appelerOpenAIResponsesESG_(
      ESG_AI_CONFIG_V1
        .tasks
        .EXTRACT_DOCUMENT,
      {
        instructions:
          instructions,

        input:
          input,

        schemaName:
          "esg_document_extraction_v1",

        schema:
          construireSchemaExtractionOpenAIESG_(
            definitions
          ),

        maxOutputTokens:
          12000
      }
    );

  var structured =
    parserJSONStructureOpenAIESG_(
      result
    );

  return {
    fields:
      convertirExtractionOpenAIEnFieldsESG_(
        structured,
        definitions
      ),

    providerMeta: {
      provider:
        result.provider,

      model:
        result.model,

      responseId:
        result.responseId,

      latencyMs:
        result.latencyMs,

      usage:
        result.usage
    }
  };
}


function convertirExtractionOpenAIEnFieldsESG_(
  structured,
  definitions
) {
  var output = {};
  var definitionByPath = {};

  (definitions || []).forEach(
    function(definition) {
      var path =
        String(
          definition.path || ""
        );

      if (!path) {
        return;
      }

      definitionByPath[path] =
        definition;

      output[path] = {
        value:
          "",

        confidence:
          0,

        evidence:
          ""
      };
    }
  );

  (
    structured &&
    Array.isArray(
      structured.fields
    )
      ? structured.fields
      : []
  ).forEach(
    function(item) {
      var path =
        String(
          item &&
          item.path ||
          ""
        );

      var definition =
        definitionByPath[path];

      if (!definition) {
        return;
      }

      var valueText =
        String(
          item.value_text || ""
        ).trim();

      var value =
        valueText;

      if (
        definition.type ===
          "number" &&
        valueText !== ""
      ) {
        var numeric =
          Number(
            valueText
              .replace(
                ",",
                "."
              )
          );

        if (isFinite(numeric)) {
          value =
            numeric;
        }
      }

      if (
        definition.type ===
          "multiselect" &&
        valueText
      ) {
        value =
          valueText
            .split(
              /\s*\|\|\s*/
            )
            .map(
              function(v) {
                return v.trim();
              }
            )
            .filter(
              function(v) {
                return !!v;
              }
            );
      }

      output[path] = {
        value:
          value,

        confidence:
          Math.max(
            0,
            Math.min(
              1,
              Number(
                item.confidence ||
                0
              )
            )
          ),

        evidence:
          String(
            item.evidence || ""
          ).trim()
      };
    }
  );

  return output;
}


function construireSchemaRewriteOpenAIESG_(
  payload
) {
  var ids =
    (
      payload &&
      payload.texts
        ? payload.texts
        : []
    ).map(
      function(item) {
        return String(
          item.id || ""
        );
      }
    );

  return {
    type:
      "object",

    properties: {
      schema_version: {
        type:
          "string",
        enum: [
          ESG_REWRITE_CONFIG
            .outputSchema
        ]
      },

      texts: {
        type:
          "array",

        minItems:
          ids.length,

        maxItems:
          ids.length,

        items: {
          type:
            "object",

          properties: {
            id: {
              type:
                "string",
              enum:
                ids
            },

            rewritten_text: {
              type:
                "string"
            }
          },

          required: [
            "id",
            "rewritten_text"
          ],

          additionalProperties:
            false
        }
      }
    },

    required: [
      "schema_version",
      "texts"
    ],

    additionalProperties:
      false
  };
}


function reecrireESGAvecOpenAI_(
  payload
) {
  payload = payload || {};

  var instructions = [
    "Tu es l'éditeur professionnel d'un rapport ESG institutionnel white-label.",
    "Réécris uniquement les textes fournis.",
    "Ne crée aucun fait, chiffre, date, score, nom, URL, email ou référence non présent dans le texte source.",
    "Conserve exactement tous les tokens de protection de forme __AG_KEEP_001__.",
    "Ne mentionne jamais AfriGreen24, OpenAI, HumbleOS ou le système technique.",
    "Le ton doit être clair, professionnel, factuel, non promotionnel et adapté à un financeur ou une direction générale.",
    "Si un texte est déjà bon, améliore seulement la fluidité sans changer le sens.",
    "Retourne exactement un bloc par id."
  ].join(" ");

  var result =
    appelerOpenAIResponsesESG_(
      ESG_AI_CONFIG_V1
        .tasks
        .REWRITE_REPORT,
      {
        instructions:
          instructions,

        input: [
          {
            role:
              "user",

            content:
              JSON.stringify(
                payload
              )
          }
        ],

        schemaName:
          "esg_report_rewrite_output_v1",

        schema:
          construireSchemaRewriteOpenAIESG_(
            payload
          ),

        maxOutputTokens:
          12000
      }
    );

  var structured =
    parserJSONStructureOpenAIESG_(
      result
    );

  structured._providerMeta = {
    provider:
      result.provider,

    model:
      result.model,

    responseId:
      result.responseId,

    latencyMs:
      result.latencyMs,

    usage:
      result.usage
  };

  return structured;
}


function TEST_ESG_OPENAI_SCHEMA_LOCAL() {
  var extractionSchema =
    construireSchemaExtractionOpenAIESG_([
      {
        path:
          "profile.organizationName",
        type:
          "text"
      },
      {
        path:
          "question.E-POL-001",
        type:
          "select"
      }
    ]);

  var rewriteSchema =
    construireSchemaRewriteOpenAIESG_({
      texts: [
        {
          id:
            "summary"
        }
      ]
    });

  return {
    success:
      extractionSchema
        .properties
        .fields
        .items
        .properties
        .path
        .enum
        .length ===
        2 &&
      rewriteSchema
        .properties
        .texts
        .minItems ===
        1
  };
}
