/**
 * ============================================================
 * TESTS LOCAUX — ESG REWRITE ONLY
 * Aucun appel HumbleOS.
 * ============================================================
 */

function TEST_ESG_REWRITE_01_LOCAL_CONTRACTS() {
  Logger.log("========================================");
  Logger.log("TEST ESG REWRITE — CONTRATS LOCAUX");
  Logger.log("========================================");

  var profil = {
    organizationName:
      "Organisation ESG Test"
  };

  var analyse = {
    diagnostic: {
      risque: {
        justification:
          "Le risque est modéré avec un score de 58 sur 100.",
        label:
          "Modéré"
      },
      alertesCritiques: []
    },

    recommandations: {
      syntheseStrategique:
        "Organisation ESG Test obtient un score de 58 sur 100.",

      prioritePrincipale: {
        action:
          "Formaliser la politique ESG dans les 3 prochains mois."
      },

      forces: [
        {
          titre:
            "Gouvernance",
          description:
            "Le comité se réunit 4 fois par an."
        }
      ],

      faiblesses: [
        {
          recommandation:
            "Mettre en place 2 procédures documentées."
        }
      ],

      planAction: {
        immediate_0_3_months: [
          {
            action:
              "Formaliser 3 procédures.",
            preuveDeRealisation:
              "3 procédures validées."
          }
        ],
        short_term_3_6_months: [],
        structural_6_24_months: []
      },

      conclusion:
        "La priorité est de consolider la gouvernance.",

      messageFinanceur:
        "Le score de 58 sur 100 reflète une organisation en structuration."
    }
  };

  var digital = {
    resume: {
      message:
        "Le score numérique est de 40 sur 100."
    },

    recommandations: [
      "Structurer la communication ESG."
    ]
  };

  var model =
    buildESGReportTextModel_(
      profil,
      analyse,
      digital
    );

  var payload =
    buildESGRewritePayload_(
      model
    );

  assertESGRewriteTest_(
    payload.schema_version ===
      "esg_report_rewrite_input_v1",
    "Schema input incorrect."
  );

  assertESGRewriteTest_(
    payload.texts.length >= 8,
    "Trop peu de blocs construits."
  );

  var fakeOutput = {
    schema_version:
      "esg_report_rewrite_output_v1",

    texts:
      payload.texts.map(
        function(item) {
          return {
            id:
              item.id,

            rewritten_text:
              item.text
          };
        }
      )
  };

  var validation =
    validateESGRewriteOutput_(
      payload,
      fakeOutput
    );

  assertESGRewriteTest_(
    validation.valid === true,
    "Output simulé valide rejeté."
  );

  var badMissing =
    clonerObjetESGRewrite_(
      fakeOutput
    );

  badMissing.texts.pop();

  assertESGRewriteTest_(
    validateESGRewriteOutput_(
      payload,
      badMissing
    ).valid === false,
    "ID manquant non rejeté."
  );

  var badExtra =
    clonerObjetESGRewrite_(
      fakeOutput
    );

  badExtra.texts.push({
    id:
      "unexpected",
    rewritten_text:
      "Texte"
  });

  assertESGRewriteTest_(
    validateESGRewriteOutput_(
      payload,
      badExtra
    ).valid === false,
    "ID supplémentaire non rejeté."
  );

  var badEmpty =
    clonerObjetESGRewrite_(
      fakeOutput
    );

  badEmpty.texts[0]
    .rewritten_text =
      "";

  assertESGRewriteTest_(
    validateESGRewriteOutput_(
      payload,
      badEmpty
    ).valid === false,
    "Texte vide non rejeté."
  );

  var unsafeOutput =
    clonerObjetESGRewrite_(
      fakeOutput
    );

  var executive =
    unsafeOutput.texts.filter(
      function(item) {
        return item.id ===
          "executive_summary";
      }
    )[0];

  executive.rewritten_text =
    "Organisation ESG Test obtient un score de 72 sur 100.";

  var safe =
    applyESGRewriteSafetyFallback_(
      payload,
      unsafeOutput,
      profil
    );

  assertESGRewriteTest_(
    safe.fallback_ids.indexOf(
      "executive_summary"
    ) !== -1,
    "Modification numérique non détectée."
  );

  var analysePresentation =
    clonerObjetESGRewrite_(
      analyse
    );

  var digitalPresentation =
    clonerObjetESGRewrite_(
      digital
    );

  mergeESGRewrittenTexts_(
    analysePresentation,
    digitalPresentation,
    safe.output
  );

  assertESGRewriteTest_(
    analysePresentation
      .diagnostic
      .risque
      .label ===
      analyse
        .diagnostic
        .risque
        .label,
    "Structure diagnostic modifiée."
  );

  assertESGRewriteTest_(
    analysePresentation
      .recommandations
      .syntheseStrategique ===
      analyse
        .recommandations
        .syntheseStrategique,
    "Fallback du résumé non appliqué."
  );

  Logger.log("✅ MODÈLE RÉDACTIONNEL CONSTRUIT");
  Logger.log("✅ PAYLOAD MINIMAL {id,text}");
  Logger.log("✅ IDS UNIQUES");
  Logger.log("✅ OUTPUT SIMULÉ ACCEPTÉ");
  Logger.log("✅ ID MANQUANT REJETÉ");
  Logger.log("✅ ID SUPPLÉMENTAIRE REJETÉ");
  Logger.log("✅ TEXTE VIDE REJETÉ");
  Logger.log("✅ SAFE FALLBACK SUR CHIFFRE MODIFIÉ");
  Logger.log("✅ STRUCTURE ESG INCHANGÉE");
  Logger.log("========================================");
  Logger.log("✅ TEST ESG REWRITE LOCAL RÉUSSI");
  Logger.log("========================================");

  return {
    success: true,
    blockCount:
      payload.texts.length,
    fallbackIds:
      safe.fallback_ids
  };
}


function assertESGRewriteTest_(
  condition,
  message
) {
  if (
    !condition
  ) {
    throw new Error(
      "TEST ESG REWRITE — " +
      message
    );
  }
}
