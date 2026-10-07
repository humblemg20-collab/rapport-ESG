/**
 * ============================================================
 * MICRO TEST — HUMBLEOS ESG REPORT REWRITE
 * ============================================================
 *
 * OBJECTIF :
 * Tester UNE SEULE FOIS la route réelle :
 * POST /esg-report-rewrite
 *
 * GARANTIES :
 * - payload minimal
 * - 1 seul appel HTTP
 * - 1 seul AI.run() attendu côté HumbleOS
 * - 0 retry
 * - aucun rapport généré
 * - aucun stockage
 *
 * PRÉREQUIS :
 * Script Properties :
 *   HUMBLEOS_URL
 *   HUMBLEOS_API_KEY
 *
 * Exemple HUMBLEOS_URL :
 * https://humbleos-afrigreen24.humblemg2-0.workers.dev
 */

function TEST_ESG_REWRITE_02_MICRO_REAL() {

  Logger.log("========================================");
  Logger.log("MICRO TEST ESG — HUMBLEOS REWRITE");
  Logger.log("========================================");

  var props =
    PropertiesService
      .getScriptProperties();

  var baseUrl =
    props.getProperty(
      "HUMBLEOS_URL"
    );

  var apiKey =
    props.getProperty(
      "HUMBLEOS_API_KEY"
    );

  if (!baseUrl) {
    throw new Error(
      "HUMBLEOS_URL non configurée."
    );
  }

  if (!apiKey) {
    throw new Error(
      "HUMBLEOS_API_KEY non configurée."
    );
  }

  var endpoint =
    String(baseUrl)
      .replace(/\/+$/, "") +
    "/esg-report-rewrite";

  var payload = {
    schema_version:
      "esg_report_rewrite_input_v1",

    language:
      "fr",

    texts: [
      {
        id:
          "executive_summary",

        text:
          "L'organisation obtient un score ESG de 58 sur 100. Le niveau de risque est modéré. La priorité est de formaliser la politique ESG dans les trois prochains mois."
      },
      {
        id:
          "digital_interpretation",

        text:
          "Le score de transparence numérique ESG est de 40 sur 100. La présence numérique existe mais reste insuffisamment structurée."
      }
    ]
  };

  Logger.log(
    "Endpoint : " +
    endpoint
  );

  Logger.log(
    "Blocs envoyés : " +
    payload.texts.length
  );

  Logger.log(
    "Lancement de l'UNIQUE appel HTTP..."
  );

  var startedAt =
    new Date().getTime();

  /*
   * IMPORTANT :
   * UN SEUL UrlFetchApp.fetch().
   * Aucun retry.
   */
  var response =
    UrlFetchApp.fetch(
      endpoint,
      {
        method:
          "post",

        contentType:
          "application/json",

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true,

        followRedirects:
          false,

        headers: {
          Accept:
            "application/json",

          Authorization:
            "Bearer " +
            apiKey,

          "X-AfriGreen-Secret":
            apiKey
        }
      }
    );

  var durationMs =
    new Date().getTime() -
    startedAt;

  var status =
    response.getResponseCode();

  var body =
    response.getContentText();

  Logger.log("----------------------------------------");
  Logger.log("HTTP STATUS : " + status);
  Logger.log(
    "Durée : " +
    (
      durationMs / 1000
    ).toFixed(2) +
    " s"
  );

  if (
    status < 200 ||
    status >= 300
  ) {
    Logger.log(
      "Réponse erreur : " +
      body.substring(0, 2000)
    );

    throw new Error(
      "MICRO TEST ESG — HTTP " +
      status
    );
  }

  var parsed;

  try {
    parsed =
      JSON.parse(
        body
      );
  } catch (error) {
    throw new Error(
      "MICRO TEST ESG — JSON HTTP invalide."
    );
  }

  /*
   * Accepte soit le contrat à la racine,
   * soit une enveloppe avec output/result/data.
   */
  var output =
    null;

  [
    parsed,
    parsed && parsed.output,
    parsed && parsed.result,
    parsed && parsed.data
  ].some(
    function(candidate) {
      if (
        candidate &&
        candidate.schema_version ===
          "esg_report_rewrite_output_v1"
      ) {
        output =
          candidate;
        return true;
      }

      return false;
    }
  );

  if (!output) {
    Logger.log(
      "Réponse reçue : " +
      body.substring(0, 2000)
    );

    throw new Error(
      "MICRO TEST ESG — contrat de sortie introuvable."
    );
  }

  if (
    !Array.isArray(
      output.texts
    )
  ) {
    throw new Error(
      "MICRO TEST ESG — output.texts absent."
    );
  }

  var inputIds =
    payload.texts.map(
      function(item) {
        return item.id;
      }
    ).sort();

  var outputIds =
    output.texts.map(
      function(item) {
        return item.id;
      }
    ).sort();

  if (
    JSON.stringify(inputIds) !==
    JSON.stringify(outputIds)
  ) {
    throw new Error(
      "MICRO TEST ESG — IDs entrée/sortie différents."
    );
  }

  output.texts.forEach(
    function(item) {
      if (
        typeof item.rewritten_text !==
          "string" ||
        !item.rewritten_text.trim()
      ) {
        throw new Error(
          "MICRO TEST ESG — rewritten_text vide pour " +
          item.id
        );
      }
    }
  );

  Logger.log("----------------------------------------");
  Logger.log(
    "Schema : " +
    output.schema_version
  );

  Logger.log(
    "Blocs reçus : " +
    output.texts.length
  );

  output.texts.forEach(
    function(item) {
      Logger.log(
        "✓ " +
        item.id +
        " | longueur=" +
        item.rewritten_text.length
      );
    }
  );

  Logger.log("----------------------------------------");
  Logger.log("✅ ROUTE ESG ACCESSIBLE");
  Logger.log("✅ AUTHENTIFICATION VALIDÉE");
  Logger.log("✅ CONTRAT OUTPUT VALIDÉ");
  Logger.log("✅ MÊMES IDS ENTRÉE/SORTIE");
  Logger.log("✅ TEXTES RÉÉCRITS NON VIDES");
  Logger.log("✅ 1 APPEL HTTP");
  Logger.log("✅ 0 RETRY");
  Logger.log("========================================");
  Logger.log("✅ MICRO TEST ESG RÉUSSI");
  Logger.log("========================================");

  return {
    success: true,
    status: status,
    duration_seconds:
      durationMs / 1000,
    schema_version:
      output.schema_version,
    blocks:
      output.texts.length,
    ids:
      outputIds
  };
}
