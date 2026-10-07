function TEST_ESG_IMPORT_PIPELINE_LOCAL() {
  var sourceText = [
    "EcoNova dispose d'une politique environnementale formalisée et signée par la direction.",
    "L'organisation suit régulièrement ses indicateurs environnementaux dans un tableau de bord.",
    "Un registre des accidents du travail est maintenu par le responsable RH."
  ].join("\n\n");

  var tests = [
    {
      name: "FOUND — valeur canonique + preuve + confiance forte",
      raw: {
        value: "Défini",
        confidence: 0.95,
        evidence: "EcoNova dispose d'une politique environnementale formalisée et signée par la direction."
      },
      definition: {},
      estQuestion: true,
      expectedStatus: "FOUND",
      expectedCanonical: 3
    },

    {
      name: "TO_CONFIRM — confiance trop faible",
      raw: {
        value: "Mesuré et piloté",
        confidence: 0.61,
        evidence: "L'organisation suit régulièrement ses indicateurs environnementaux dans un tableau de bord."
      },
      definition: {},
      estQuestion: true,
      expectedStatus: "TO_CONFIRM",
      expectedCanonical: 4
    },

    {
      name: "TO_CONFIRM — réponse vague non canonique",
      raw: {
        value: "Oui",
        confidence: 0.99,
        evidence: "EcoNova dispose d'une politique environnementale formalisée et signée par la direction."
      },
      definition: {},
      estQuestion: true,
      expectedStatus: "TO_CONFIRM",
      expectedCanonical: ""
    },

    {
      name: "TO_CONFIRM — evidence absente du document",
      raw: {
        value: "Défini",
        confidence: 0.96,
        evidence: "Une politique carbone certifiée ISO 14001 est appliquée."
      },
      definition: {},
      estQuestion: true,
      expectedStatus: "TO_CONFIRM",
      expectedCanonical: ""
    },

    {
      name: "MISSING — champ absent",
      raw: {},
      definition: {},
      estQuestion: true,
      expectedStatus: "MISSING",
      expectedCanonical: ""
    },

    {
      name: "MISSING — valeur vide",
      raw: {
        value: "",
        confidence: 0.9,
        evidence: ""
      },
      definition: {},
      estQuestion: true,
      expectedStatus: "MISSING",
      expectedCanonical: ""
    },

    {
      name: "FOUND — WIP",
      raw: {
        value: "En cours de mise en place",
        confidence: 0.91,
        evidence: "Un registre des accidents du travail est maintenu par le responsable RH."
      },
      definition: {},
      estQuestion: true,
      expectedStatus: "FOUND",
      expectedCanonical: "WIP"
    }
  ];

  var erreurs = [];
  var ok = 0;

  tests.forEach(function(test, index) {
    var result = construireChampImportESG_(
      test.raw,
      sourceText,
      test.definition,
      test.estQuestion
    );

    var statusOk =
      result.status === test.expectedStatus;

    var canonicalOk =
      result.canonicalValue === test.expectedCanonical;

    var success =
      statusOk && canonicalOk;

    if (success) {
      ok++;
    } else {
      erreurs.push({
        test: index + 1,
        name: test.name,
        expectedStatus: test.expectedStatus,
        actualStatus: result.status,
        expectedCanonical: test.expectedCanonical,
        actualCanonical: result.canonicalValue
      });
    }

    Logger.log(JSON.stringify({
      test: index + 1,
      name: test.name,
      status: result.status,
      canonicalValue: result.canonicalValue,
      confidence: result.confidence,
      ok: success
    }));
  });

  Logger.log("========================================");
  Logger.log("TESTS : " + tests.length);
  Logger.log("OK : " + ok);
  Logger.log("ERREURS : " + erreurs.length);
  Logger.log("========================================");

  if (erreurs.length > 0) {
    Logger.log(JSON.stringify(erreurs, null, 2));
    throw new Error(
      "TEST ESG IMPORT PIPELINE ÉCHOUÉ : " +
      erreurs.length +
      " erreur(s)."
    );
  }

  Logger.log("✅ PIPELINE LOCAL ESG VALIDÉ");

  return {
    success: true,
    tests: tests.length,
    ok: ok,
    errors: []
  };
}