function TEST_ESG_IMPORT_HUMBLEOS_REEL() {
  var sourceText = [
    "EcoNova dispose d'une politique environnementale formalisée et signée par la direction.",
    "",
    "L'organisation mesure chaque mois sa consommation énergétique à partir des factures et conserve un tableau de suivi.",
    "",
    "Un registre des accidents du travail est maintenu par le responsable RH.",
    "",
    "L'organisation ne dispose pas encore d'un système formalisé de reporting ESG."
  ].join("\n");

  var definitions = construireDefinitionsChampsESG_();

  Logger.log("========================================");
  Logger.log("TEST ESG HUMBLEOS RÉEL");
  Logger.log("Definitions : " + definitions.length);
  Logger.log("========================================");

  var result = appelerHumbleOS_(
    "/extract-esg",
    "post",
    {
      sourceText: sourceText,
      fieldDefinitions: definitions
    }
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  if (!result) {
    throw new Error(
      "Aucune réponse retournée par HumbleOS."
    );
  }

  if (result.success !== true) {
    throw new Error(
      "HumbleOS a retourné success=false."
    );
  }

  if (
    !result.content ||
    !result.content.fields
  ) {
    throw new Error(
      "La réponse HumbleOS ne contient pas content.fields."
    );
  }

  var finalResult =
    construireResultatImportESG_(
      result.content.fields,
      sourceText,
      "TEST_ESG_APPS_SCRIPT.txt"
    );

  Logger.log("========================================");
  Logger.log("RÉSULTAT APRÈS FACT GUARD");
  Logger.log("========================================");

  Logger.log(
    JSON.stringify(
      finalResult,
      null,
      2
    )
  );

  Logger.log("========================================");
  Logger.log(
    "FOUND : " +
    finalResult.analysis.found
  );
  Logger.log(
    "TO_CONFIRM : " +
    finalResult.analysis.toConfirm
  );
  Logger.log(
    "MISSING : " +
    finalResult.analysis.missing
  );
  Logger.log("========================================");

  return finalResult;
}

function TEST_ESG_ANTI_SURINTERPRETATION_REEL() {
  var cas = [
    {
      name: "ABSENCE",
      sourceText:
        "Nous n'avons aucun système de reporting ESG.",
      expected: 0
    },
    {
      name: "EN_COURS",
      sourceText:
        "Un système de reporting ESG est actuellement en cours de mise en place.",
      expected: "WIP"
    },
    {
      name: "FORMALISE",
      sourceText:
        "Notre procédure de reporting ESG est formalisée, documentée et approuvée par la direction.",
      expected: 3
    },
    {
      name: "MESURE",
      sourceText:
        "Les indicateurs ESG sont suivis trimestriellement dans un tableau de bord utilisé par la direction.",
      expected: 4
    }
  ];

  var schema =
    obtenirSchemaImportESG_();

  var question =
    schema.filter(function(q) {
      return q.questionId === "G-REPORT-001";
    })[0];

  if (!question) {
    throw new Error(
      "Question G-REPORT-001 introuvable dans le schéma ESG."
    );
  }

  var definitions =
    construireDefinitionsChampsESG_()
      .filter(function(fd) {
        return fd.path === "question.G-REPORT-001";
      });

  if (definitions.length !== 1) {
    throw new Error(
      "Définition HumbleOS de G-REPORT-001 introuvable."
    );
  }

  var erreurs = [];

  cas.forEach(function(test, index) {
    Logger.log(
      "========================================"
    );

    Logger.log(
      "TEST " +
      (index + 1) +
      " — " +
      test.name
    );

    Logger.log(
      "SOURCE : " +
      test.sourceText
    );


    var result =
      appelerHumbleOS_(
        "/extract-esg",
        "post",
        {
          sourceText:
            test.sourceText,

          fieldDefinitions:
            definitions
        }
      );


    if (
      !result ||
      !result.content ||
      !result.content.fields
    ) {
      throw new Error(
        "Réponse HumbleOS invalide pour " +
        test.name
      );
    }


    var raw =
      result.content.fields[
        "question.G-REPORT-001"
      ] || {};


    var finalResult =
      construireChampImportESG_(
        raw,
        test.sourceText,
        question,
        true
      );


    var actual =
      finalResult.canonicalValue;


    var ok =
      actual === test.expected;


    Logger.log(
      JSON.stringify({
        test:
          index + 1,

        name:
          test.name,

        rawValue:
          raw.value,

        confidence:
          raw.confidence,

        evidence:
          raw.evidence,

        canonicalValue:
          actual,

        status:
          finalResult.status,

        expected:
          test.expected,

        ok:
          ok
      })
    );


    if (!ok) {
      erreurs.push({
        test:
          index + 1,

        name:
          test.name,

        expected:
          test.expected,

        actual:
          actual,

        raw:
          raw,

        finalResult:
          finalResult
      });
    }

  });


  Logger.log(
    "========================================"
  );

  Logger.log(
    "TESTS : " +
    cas.length
  );

  Logger.log(
    "OK : " +
    (
      cas.length -
      erreurs.length
    )
  );

  Logger.log(
    "ERREURS : " +
    erreurs.length
  );

  Logger.log(
    "========================================"
  );


  if (erreurs.length) {

    Logger.log(
      JSON.stringify(
        erreurs,
        null,
        2
      )
    );

    throw new Error(
      "TEST ESG ANTI-SURINTERPRÉTATION ÉCHOUÉ : " +
      erreurs.length +
      " erreur(s)."
    );
  }


  Logger.log(
    "✅ ESG ANTI-SURINTERPRÉTATION VALIDÉ"
  );


  return {
    success: true,
    tests: cas.length,
    ok: cas.length,
    errors: []
  };
}

function TEST_ESG_COMPLET_END_TO_END() {
  var started = Date.now();

  Logger.log("========================================");
  Logger.log("ESG E2E — DÉMARRAGE");
  Logger.log("========================================");


  /*
   * ============================================================
   * 1/8 — VALIDATION SCHÉMA
   * ============================================================
   */
  Logger.log("ESG E2E 1/8 — Validation du schéma");

  var contrat =
    obtenirContratImportESG();

  esgE2eAssert_(
    contrat &&
    Array.isArray(contrat.questions) &&
    contrat.questions.length === 50,
    "Le schéma ESG doit contenir exactement 50 questions."
  );

  esgE2eAssert_(
    contrat &&
    Array.isArray(contrat.profile) &&
    contrat.profile.length === 15,
    "Le profil ESG doit contenir exactement 15 champs."
  );


  /*
   * ============================================================
   * 2/8 — FIELD DEFINITIONS
   * ============================================================
   */
  Logger.log("ESG E2E 2/8 — Construction des 65 fieldDefinitions");

  var definitions =
    construireDefinitionsChampsESG_();

  esgE2eAssert_(
    Array.isArray(definitions),
    "fieldDefinitions n'est pas un tableau."
  );

  esgE2eAssert_(
    definitions.length === 65,
    "65 fieldDefinitions attendues, obtenu : " +
    definitions.length
  );


  /*
   * ============================================================
   * 3/8 — DOCUMENT SOURCE DE TEST
   * ============================================================
   *
   * On mélange :
   * - informations profil ;
   * - maturité environnementale ;
   * - social ;
   * - gouvernance ;
   * - absence explicite ;
   * - WIP ;
   * - informations volontairement absentes.
   */
  Logger.log("ESG E2E 3/8 — Construction du document source");

  var sourceText = [
    "EcoNova est une organisation active dans les solutions environnementales.",
    "",
    "EcoNova dispose d'une politique environnementale formalisée, documentée et signée par la direction.",
    "",
    "L'organisation mesure chaque mois sa consommation énergétique à partir des factures et conserve un tableau de suivi utilisé par la direction.",
    "",
    "Un registre des accidents du travail est maintenu et mis à jour par le responsable des ressources humaines.",
    "",
    "L'organisation ne dispose d'aucun système formalisé de reporting ESG.",
    "",
    "Un dispositif de collecte des données sociales est actuellement en cours de mise en place.",
    "",
    "La direction examine trimestriellement plusieurs indicateurs environnementaux dans un tableau de bord.",
    "",
    "Aucune information n'est fournie dans ce document concernant le chiffre d'affaires annuel, le nombre de salariés ou l'année de création."
  ].join("\n");


  /*
   * ============================================================
   * 4/8 — HUMBLEOS / WORKERS AI
   * ============================================================
   */
  Logger.log("ESG E2E 4/8 — Extraction réelle HumbleOS");

  var response =
    appelerHumbleOS_(
      "/extract-esg",
      "post",
      {
        sourceText:
          sourceText,

        fieldDefinitions:
          definitions
      }
    );


  esgE2eAssert_(
    response &&
    response.success === true,
    "HumbleOS n'a pas retourné success=true."
  );

  esgE2eAssert_(
    response.content &&
    response.content.fields &&
    typeof response.content.fields === "object",
    "HumbleOS n'a pas retourné content.fields."
  );


  var rawFields =
    response.content.fields;


  /*
   * ============================================================
   * 5/8 — FACT GUARD + NORMALISATION
   * ============================================================
   */
  Logger.log("ESG E2E 5/8 — Fact Guard + normalisation canonique");

  var finalResult =
    construireResultatImportESG_(
      rawFields,
      sourceText,
      "TEST_ESG_COMPLET.txt"
    );


  esgE2eAssert_(
    finalResult &&
    finalResult.profile &&
    finalResult.questions &&
    finalResult.analysis,
    "Résultat ESG final incomplet."
  );


  /*
   * ============================================================
   * 6/8 — CONTRÔLES MÉTIER CIBLÉS
   * ============================================================
   */
  Logger.log("ESG E2E 6/8 — Vérification des faits attendus");

  /*
   * Organisation
   */
  var organisation =
    finalResult.profile.organizationName;

  esgE2eAssert_(
    organisation &&
    organisation.status === "FOUND",
    "organizationName devrait être FOUND."
  );

  esgE2eAssert_(
    String(
      organisation.canonicalValue ||
      organisation.value ||
      ""
    ).toLowerCase()
      .indexOf("econova") !== -1,
    "EcoNova n'a pas été reconnu comme organisation."
  );


  /*
   * Politique environnementale formalisée
   * → niveau 3 attendu.
   */
  esgE2eAssertCanonical_(
    finalResult,
    "E-POL-001",
    3
  );


  /*
   * Mesure énergétique mensuelle + tableau de suivi
   * → niveau 4 attendu.
   */
  esgE2eAssertCanonical_(
    finalResult,
    "E-ENER-001",
    4
  );


  /*
   * Absence explicite de reporting ESG.
   * → niveau 0 attendu, PAS WIP.
   */
  esgE2eAssertCanonical_(
    finalResult,
    "G-REPORT-001",
    0
  );


  /*
   * ============================================================
   * 7/8 — ANTI-HALLUCINATION
   * ============================================================
   */
  Logger.log("ESG E2E 7/8 — Contrôles anti-invention");

  /*
   * Les champs volontairement absents ne doivent
   * jamais devenir FOUND sans preuve.
   */
  [
    "employeeCount",
    "annualRevenueOrBudget",
    "creationYear"
  ].forEach(function(fieldId) {
    var item =
      finalResult.profile[fieldId];

    if (!item) {
      return;
    }

    esgE2eAssert_(
      item.status !== "FOUND",
      fieldId +
      " ne doit pas être FOUND : donnée absente du document."
    );

    if (
      item.status === "FOUND" ||
      item.status === "TO_CONFIRM"
    ) {
      esgE2eAssert_(
        !item.evidence ||
        esgE2eEvidenceDansSource_(
          item.evidence,
          sourceText
        ),
        "Evidence inventée pour " +
        fieldId
      );
    }
  });


  /*
   * Vérification générale :
   * tout FOUND doit avoir une preuve réellement présente
   * dans le document source.
   */
  Object.keys(
    finalResult.questions || {}
  ).forEach(function(questionId) {
    var item =
      finalResult.questions[
        questionId
      ];

    if (
      !item ||
      item.status !== "FOUND"
    ) {
      return;
    }

    esgE2eAssert_(
      !!String(
        item.evidence || ""
      ).trim(),
      questionId +
      " est FOUND sans evidence."
    );

    esgE2eAssert_(
      esgE2eEvidenceDansSource_(
        item.evidence,
        sourceText
      ),
      questionId +
      " contient une evidence absente du DOCUMENT_SOURCE."
    );

    esgE2eAssert_(
      estValeurCanoniqueImportESG_(
        item.canonicalValue
      ),
      questionId +
      " contient une valeur non canonique : " +
      item.canonicalValue
    );
  });


  /*
   * Vérification des volumes.
   */
  var total =
    Number(
      finalResult.analysis.found || 0
    ) +
    Number(
      finalResult.analysis.toConfirm || 0
    ) +
    Number(
      finalResult.analysis.missing || 0
    );

  esgE2eAssert_(
    total === 65,
    "FOUND + TO_CONFIRM + MISSING doit être égal à 65. Obtenu : " +
    total
  );


  /*
   * ============================================================
   * 8/8 — RÉSUMÉ FINAL
   * ============================================================
   */
  Logger.log("ESG E2E 8/8 — Résultat final");

  var summary = {
    ok: true,

    definitions:
      definitions.length,

    profileFields:
      contrat.profile.length,

    questions:
      contrat.questions.length,

    extraction: {
      model:
        response.model ||
        (
          response.content &&
          response.content.model
        ) ||
        "",

      durationSeconds:
        response.durationSeconds ||
        null
    },

    analysis: {
      found:
        finalResult.analysis.found,

      toConfirm:
        finalResult.analysis.toConfirm,

      missing:
        finalResult.analysis.missing,

      total:
        total
    },

    verified: {
      organizationName:
        organisation.status,

      environmentalPolicy:
        finalResult
          .questions[
            "E-POL-001"
          ]
          .canonicalValue,

      energyMonitoring:
        finalResult
          .questions[
            "E-ENER-001"
          ]
          .canonicalValue,

      esgReporting:
        finalResult
          .questions[
            "G-REPORT-001"
          ]
          .canonicalValue
    },

    durationMs:
      Date.now() -
      started
  };


  Logger.log("========================================");

  Logger.log(
    JSON.stringify(
      summary,
      null,
      2
    )
  );

  Logger.log("========================================");
  Logger.log("✅ ESG E2E — VALIDÉ");
  Logger.log("========================================");


  return summary;
}


/**
 * ============================================================
 * ASSERTIONS
 * ============================================================
 */

function esgE2eAssert_(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      "ESG E2E : " +
      message
    );
  }
}


function esgE2eAssertCanonical_(
  finalResult,
  questionId,
  expectedValue
) {
  var item =
    finalResult &&
    finalResult.questions
      ? finalResult.questions[
          questionId
        ]
      : null;

  esgE2eAssert_(
    !!item,
    questionId +
    " absent du résultat."
  );

  esgE2eAssert_(
    item.status === "FOUND",
    questionId +
    " devrait être FOUND mais est " +
    item.status +
    "."
  );

  esgE2eAssert_(
    item.canonicalValue ===
      expectedValue,
    questionId +
    " attendu=" +
    expectedValue +
    " obtenu=" +
    item.canonicalValue
  );

  esgE2eAssert_(
    !!String(
      item.evidence || ""
    ).trim(),
    questionId +
    " ne contient aucune evidence."
  );
}


function esgE2eEvidenceDansSource_(
  evidence,
  sourceText
) {
  var e =
    String(
      evidence || ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  var s =
    String(
      sourceText || ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return (
    !!e &&
    !!s &&
    s.indexOf(e) !== -1
  );
}