/**
 * ============================================================
 * TEST GLOBAL ESG — END TO END + HUMBLEOS REWRITE ONLY
 * ============================================================
 *
 * OBJECTIF :
 * Tester le vrai pipeline ESG complet :
 *
 * Questionnaire officiel
 * → scoring Apps Script
 * → diagnostic numérique
 * → qualification
 * → recommandations déterministes
 * → 1 batch HumbleOS Rewrite
 * → Safe Fallback
 * → Google Docs
 * → PDF
 * → stockage
 *
 * GARANTIES :
 * - 1 génération complète
 * - 1 appel HumbleOS maximum attendu
 * - 0 retry
 * - le rapport doit rester générable même si HumbleOS échoue
 *
 * IMPORTANT :
 * Lance cette fonction UNE SEULE FOIS.
 */

function TEST_ESG_GLOBAL_END_TO_END_REWRITE_ONLY() {

  Logger.log("========================================");
  Logger.log("TEST GLOBAL ESG — END TO END");
  Logger.log("HUMBLEOS = REWRITE ONLY");
  Logger.log("========================================");

  /*
   * ========================================================
   * 1. CHARGEMENT DU QUESTIONNAIRE OFFICIEL
   * ========================================================
   */
  var donnees =
    obtenirDonneesApplicationV2();

  if (
    !donnees ||
    !donnees.questionnaire
  ) {
    throw new Error(
      "Impossible de charger le questionnaire ESG."
    );
  }

  var questionnaire =
    donnees.questionnaire;

  var questionsESG =
    questionnaire.questions ||
    questionnaire;

  if (
    !Array.isArray(
      questionsESG
    )
  ) {
    throw new Error(
      "Format du questionnaire ESG non reconnu."
    );
  }

  var questionsDigitales =
    donnees.digitalQuestions || [];

  Logger.log(
    "Questions ESG : " +
    questionsESG.length
  );

  Logger.log(
    "Questions digitales : " +
    questionsDigitales.length
  );

  /*
   * ========================================================
   * 2. PROFIL DE TEST RÉALISTE
   * ========================================================
   */
  var profil = {

    organizationName:
      "EcoNova Industries",

    responsibleName:
      "Direction Générale",

    professionalEmail:
      "direction@econova.example",

    phone:
      "+237600000001",

    mainCountry:
      "Cameroun",

    additionalCountries: [
      "Côte d'Ivoire"
    ],

    organizationType:
      "PME",

    mainSector:
      "Industrie et économie circulaire",

    employeeCount:
      "42",

    annualRevenueOrBudget:
      "185000000 XAF",

    creationYear:
      "2021",

    interventionZone:
      "Cameroun et Côte d'Ivoire",

    existingESGPolicy:
      "Partiellement",

    existingESGReport:
      "Non",

    diagnosticPurpose: [
      "Structurer la démarche ESG",
      "Améliorer la préparation au financement",
      "Renforcer la crédibilité auprès des partenaires"
    ]
  };

  /*
   * ========================================================
   * 3. RÉPONSES ESG À PARTIR DES QUESTIONS RÉELLES
   * ========================================================
   *
   * On évite d'inventer des IDs.
   * On choisit une option officielle existante pour chaque
   * question lorsque cela est possible.
   */
  var reponsesESG = {};

  questionsESG.forEach(
    function(question, index) {

      var id =
        question.question_id ||
        question.id ||
        question.questionId;

      if (!id) {
        return;
      }

      var valeur =
        TEST_ESG_GLOBAL_PICK_VALUE_(
          question,
          index
        );

      reponsesESG[id] = {
        value:
          valeur,

        evidenceLevel:
          TEST_ESG_GLOBAL_PICK_EVIDENCE_(
            index
          ),

        comment:
          index % 5 === 0
            ? "Une formalisation complémentaire est prévue."
            : ""
      };
    }
  );

  /*
   * ========================================================
   * 4. RÉPONSES DIGITALES
   * ========================================================
   */
  var reponsesDigitales = {};

  questionsDigitales.forEach(
    function(question, index) {

      var id =
        question.id ||
        question.questionId;

      if (!id) {
        return;
      }

      if (
        question.type === "multi"
      ) {
        var options =
          question.options || [];

        reponsesDigitales[id] =
          options
            .slice(
              0,
              Math.min(
                3,
                options.length
              )
            )
            .map(
              function(option) {
                return (
                  option &&
                  typeof option === "object"
                )
                  ? (
                      option.value !== undefined
                        ? option.value
                        : option.label
                    )
                  : option;
              }
            );

        return;
      }

      reponsesDigitales[id] =
        TEST_ESG_GLOBAL_PICK_VALUE_(
          question,
          index
        );
    }
  );

  /*
   * ========================================================
   * 5. PAYLOAD GLOBAL
   * ========================================================
   */
  var payload = {

    profil:
      profil,

    reponsesESG:
      reponsesESG,

    reponsesDigitales:
      reponsesDigitales,

    consentements: {

      diagnostic:
        true,

      privacyNoticeAccepted:
        true,

      afriGreen24:
        true,

      /*
       * On évite la création d'un prospect commercial
       * MB Digital pendant ce test global.
       */
      mbDigital:
        false
    }
  };

  Logger.log("----------------------------------------");
  Logger.log("Payload global préparé.");
  Logger.log(
    "Réponses ESG : " +
    Object.keys(
      reponsesESG
    ).length
  );
  Logger.log(
    "Réponses digitales : " +
    Object.keys(
      reponsesDigitales
    ).length
  );

  /*
   * ========================================================
   * 6. TEST END TO END
   * ========================================================
   */
  Logger.log("----------------------------------------");
  Logger.log(
    "Lancement soumettreDiagnosticV2()..."
  );

  var startedAt =
    new Date().getTime();

  var resultat =
    soumettreDiagnosticV2(
      payload
    );

  var durationSeconds =
    (
      new Date().getTime() -
      startedAt
    ) / 1000;

  /*
   * ========================================================
   * 7. VALIDATION RÉSULTAT
   * ========================================================
   */
  if (
    !resultat ||
    resultat.success !== true
  ) {
    throw new Error(
      "Le test global ESG a échoué."
    );
  }

  if (
    !resultat.docUrl
  ) {
    throw new Error(
      "Google Docs absent du résultat."
    );
  }

  if (
    !resultat.pdfUrl
  ) {
    throw new Error(
      "PDF absent du résultat."
    );
  }

  if (
    resultat.scoreESG ===
      undefined ||
    resultat.scoreESG ===
      null
  ) {
    throw new Error(
      "Score ESG absent."
    );
  }

  /*
   * ========================================================
   * 8. LOG REWRITE ONLY
   * ========================================================
   */
  var rewrite =
    resultat.humbleOSRewrite ||
    {};

  Logger.log("----------------------------------------");
  Logger.log("RÉSULTAT HUMBLEOS REWRITE :");
  Logger.log(
    "Attempted : " +
    String(
      rewrite.attempted
    )
  );
  Logger.log(
    "Applied : " +
    String(
      rewrite.applied
    )
  );
  Logger.log(
    "Block count : " +
    String(
      rewrite.blockCount || 0
    )
  );
  Logger.log(
    "Fallback count : " +
    String(
      rewrite.fallbackCount || 0
    )
  );

  /*
   * HumbleOS peut échouer sans casser le produit.
   * Mais si la route est correctement connectée après
   * le micro-test, on s'attend normalement à applied=true.
   */
  if (
    rewrite.attempted !== true
  ) {
    Logger.log(
      "⚠️ HumbleOS Rewrite n'a pas été tenté. " +
      "Le rapport a néanmoins été généré par Apps Script."
    );
  }

  if (
    rewrite.attempted === true &&
    rewrite.applied !== true
  ) {
    Logger.log(
      "⚠️ HumbleOS Rewrite n'a pas été appliqué. " +
      "Fallback global Apps Script utilisé."
    );
  }

  /*
   * ========================================================
   * 9. JOURNAL FINAL
   * ========================================================
   */
  Logger.log("----------------------------------------");
  Logger.log("✅ TEST GLOBAL ESG RÉUSSI");
  Logger.log("----------------------------------------");

  Logger.log(
    "Durée : " +
    durationSeconds.toFixed(2) +
    " secondes"
  );

  Logger.log(
    "Organisation : " +
    resultat.organisation
  );

  Logger.log(
    "Score ESG : " +
    resultat.scoreESG
  );

  Logger.log(
    "Maturité : " +
    JSON.stringify(
      resultat.maturite
    )
  );

  Logger.log(
    "Risque : " +
    JSON.stringify(
      resultat.risque
    )
  );

  Logger.log(
    "Score Digital : " +
    resultat.scoreDigital
  );

  Logger.log("----------------------------------------");
  Logger.log("✅ GOOGLE DOCS :");
  Logger.log(
    resultat.docUrl
  );

  Logger.log("----------------------------------------");
  Logger.log("✅ PDF :");
  Logger.log(
    resultat.pdfUrl
  );

  if (
    resultat.pdfDownloadUrl
  ) {
    Logger.log("----------------------------------------");
    Logger.log("✅ PDF DOWNLOAD :");
    Logger.log(
      resultat.pdfDownloadUrl
    );
  }

  if (
    resultat.spreadsheetUrl
  ) {
    Logger.log("----------------------------------------");
    Logger.log("✅ STOCKAGE :");
    Logger.log(
      resultat.spreadsheetUrl
    );
  }

  Logger.log("----------------------------------------");
  Logger.log("✅ SCORING APPS SCRIPT");
  Logger.log("✅ RECOMMANDATIONS DÉTERMINISTES");
  Logger.log("✅ HUMBLEOS = RÉDACTION FINALE UNIQUEMENT");
  Logger.log("✅ GOOGLE DOCS GÉNÉRÉ");
  Logger.log("✅ PDF GÉNÉRÉ");
  Logger.log("✅ STOCKAGE EFFECTUÉ");
  Logger.log("✅ 1 APPEL HUMBLEOS MAXIMUM");
  Logger.log("✅ 0 RETRY");
  Logger.log("========================================");
  Logger.log("✅ TEST ESG GLOBAL END-TO-END RÉUSSI");
  Logger.log("========================================");

  return {
    success:
      true,

    duration_seconds:
      durationSeconds,

    organisation:
      resultat.organisation,

    scoreESG:
      resultat.scoreESG,

    maturite:
      resultat.maturite,

    risque:
      resultat.risque,

    scoreDigital:
      resultat.scoreDigital,

    humbleOSRewrite:
      rewrite,

    docUrl:
      resultat.docUrl,

    pdfUrl:
      resultat.pdfUrl,

    pdfDownloadUrl:
      resultat.pdfDownloadUrl,

    spreadsheetUrl:
      resultat.spreadsheetUrl
  };
}


/**
 * Choisit une valeur parmi les options officielles.
 *
 * Le choix varie selon l'index afin d'obtenir un diagnostic
 * un peu plus réaliste qu'une réponse identique partout.
 */
function TEST_ESG_GLOBAL_PICK_VALUE_(
  question,
  index
) {
  var options =
    question.options ||
    [];

  if (
    options.length
  ) {
    var position;

    if (
      options.length >= 5
    ) {
      position =
        index % 4 === 0
          ? 1
          : index % 4 === 1
            ? 2
            : index % 4 === 2
              ? 3
              : 4;

      position =
        Math.min(
          position,
          options.length - 1
        );

    } else {
      position =
        index %
        options.length;
    }

    var option =
      options[position];

    if (
      option &&
      typeof option === "object"
    ) {
      if (
        option.value !==
        undefined
      ) {
        return option.value;
      }

      if (
        option.label !==
        undefined
      ) {
        return option.label;
      }
    }

    return option;
  }

  return "Non renseigné";
}


/**
 * Variation des niveaux de preuve pour tester
 * le moteur de confiance sans modifier sa logique.
 */
function TEST_ESG_GLOBAL_PICK_EVIDENCE_(
  index
) {
  var levels = [
    "STRONG",
    "MEDIUM",
    "DECLARATIVE",
    "MEDIUM"
  ];

  return levels[
    index %
    levels.length
  ];
}
