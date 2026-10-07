/**
 * ============================================================
 * AFRIGREEN24 — ESG SMART IMPORT
 * Fichier : ESGImportSchema.gs
 * Version : 1.0.0
 * ============================================================
 *
 * Contrat canonique utilisé pour l'import documentaire ESG.
 *
 * RÈGLE :
 * - ESG_QUESTIONS reste la source de vérité ;
 * - ce fichier ne modifie jamais le scoring ESG ;
 * - aucune IA ici ;
 * - aucune génération de rapport ici.
 */


var ESG_IMPORT_STATUS = {
  FOUND: "FOUND",
  TO_CONFIRM: "TO_CONFIRM",
  MISSING: "MISSING"
};


/**
 * Construit automatiquement le schéma d'import
 * depuis la base officielle ESG.
 */
function obtenirSchemaImportESG_() {
  var questions = obtenirQuestionsESG();

  return questions.map(function(question) {
    return {
      questionId:
        question.question_id,

      number:
        question.number,

      pillar:
        question.pillar,

      theme:
        question.theme,

      subtheme:
        question.subtheme,

      question:
        question.question_text,

      responseType:
        question.response_type,

      canonicalValues: [
        0,
        1,
        2,
        3,
        4,
        5,
        "NA",
        "UNK",
        "WIP"
      ],

      critical:
        question.critical === true,

      evidenceRequired:
        question.evidence_required === true,

      evidenceExamples:
        question.accepted_evidence_examples || [],

      standard:
        question.primary_standard || "",

      indicator:
        question.associated_indicator || null
    };
  });
}


/**
 * Schéma du profil organisationnel.
 *
 * Les champs profil sont séparés des 50 questions ESG.
 */
function obtenirSchemaImportProfilESG_() {
  return obtenirChampsProfilESG()
    .map(function(field) {
      return {
        fieldId:
          field.id,

        label:
          field.label,

        type:
          field.type,

        required:
          field.required === true,

        canonicalValues:
          field.options
            ? field.options.slice()
            : null
      };
    });
}


/**
 * Retourne le contrat complet attendu par
 * l'import documentaire ESG.
 */
function obtenirContratImportESG() {
  return {
    success: true,

    version:
      ESG_CONFIG.version,

    profile:
      obtenirSchemaImportProfilESG_(),

    questions:
      obtenirSchemaImportESG_(),

    statuses: [
      ESG_IMPORT_STATUS.FOUND,
      ESG_IMPORT_STATUS.TO_CONFIRM,
      ESG_IMPORT_STATUS.MISSING
    ],

    maturityScale:
      obtenirOptionsMaturiteESG(true)
  };
}


/**
 * Vérifie qu'un ID correspond bien à
 * une question ESG officielle.
 */
function estQuestionImportESGValide_(questionId) {
  return obtenirQuestionESGParId(
    String(questionId || "").trim()
  ) !== null;
}


/**
 * Vérifie qu'une valeur est déjà canonique.
 */
function estValeurCanoniqueImportESG_(value) {
  if (
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5
  ) {
    return true;
  }

  return (
    value === "NA" ||
    value === "UNK" ||
    value === "WIP"
  );
}


/**
 * ============================================================
 * TEST LOCAL
 * AUCUN APPEL HUMBLEOS
 * AUCUN NEURON CONSOMMÉ
 * ============================================================
 */
function TEST_ESG_IMPORT_SCHEMA_LOCAL() {
  var contract =
    obtenirContratImportESG();

  var errors = [];

  if (
    !contract.questions ||
    contract.questions.length !== 50
  ) {
    errors.push(
      "Le schéma doit contenir exactement 50 questions."
    );
  }

  var counts = {
    E: 0,
    S: 0,
    G: 0,
    R: 0
  };

  var ids = {};

  contract.questions.forEach(function(question) {
    if (!question.questionId) {
      errors.push(
        "Question sans questionId."
      );
      return;
    }

    if (ids[question.questionId]) {
      errors.push(
        "ID dupliqué : " +
        question.questionId
      );
    }

    ids[question.questionId] = true;

    if (
      counts.hasOwnProperty(
        question.pillar
      )
    ) {
      counts[question.pillar]++;
    } else {
      errors.push(
        "Pilier invalide : " +
        question.pillar
      );
    }

    var expectedValues = [
      0, 1, 2, 3, 4, 5,
      "NA", "UNK", "WIP"
    ];

    expectedValues.forEach(function(value) {
      if (
        question.canonicalValues.indexOf(value) === -1
      ) {
        errors.push(
          question.questionId +
          " : valeur canonique absente : " +
          value
        );
      }
    });
  });

  if (counts.E !== 15) {
    errors.push(
      "E attendu=15 obtenu=" +
      counts.E
    );
  }

  if (counts.S !== 15) {
    errors.push(
      "S attendu=15 obtenu=" +
      counts.S
    );
  }

  if (counts.G !== 15) {
    errors.push(
      "G attendu=15 obtenu=" +
      counts.G
    );
  }

  if (counts.R !== 5) {
    errors.push(
      "R attendu=5 obtenu=" +
      counts.R
    );
  }

  var canonicalTests = [
    0, 1, 2, 3, 4, 5,
    "NA", "UNK", "WIP"
  ];

  canonicalTests.forEach(function(value) {
    if (
      !estValeurCanoniqueImportESG_(value)
    ) {
      errors.push(
        "Valeur canonique rejetée : " +
        value
      );
    }
  });

  if (
    estValeurCanoniqueImportESG_(6)
  ) {
    errors.push(
      "La valeur 6 ne doit pas être acceptée."
    );
  }

  if (
    estValeurCanoniqueImportESG_("OUI")
  ) {
    errors.push(
      "OUI ne doit pas être considéré comme canonique."
    );
  }

  var result = {
    success:
      errors.length === 0,

    questions:
      contract.questions.length,

    profileFields:
      contract.profile.length,

    pillars:
      counts,

    canonicalValues:
      canonicalTests,

    errors:
      errors
  };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  if (errors.length > 0) {
    throw new Error(
      "TEST ESG IMPORT SCHEMA ÉCHOUÉ : " +
      errors.join(" | ")
    );
  }

  Logger.log(
    "========================================"
  );

  Logger.log(
    "✅ ESG IMPORT SCHEMA VALIDÉ"
  );

  Logger.log(
    "Questions : " +
    contract.questions.length
  );

  Logger.log(
    "E=" + counts.E +
    " S=" + counts.S +
    " G=" + counts.G +
    " R=" + counts.R
  );

  Logger.log(
    "========================================"
  );

  return result;
}