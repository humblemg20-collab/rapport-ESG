/**
 * AfriGreen24 — ESG Intelligence Score & Report
 * Moteur de scoring ESG
 * Version 1.0.0
 *
 * Dépendance :
 * ESGQuestions.gs
 */


/**
 * Calcule l’ensemble du diagnostic ESG.
 *
 * Format accepté :
 *
 * {
 *   "E-POL-001": 3,
 *
 *   "E-GHG-001": {
 *     value: 2,
 *     evidenceLevel: "MEDIUM",
 *     comment: "Calcul partiel disponible"
 *   },
 *
 *   "E-WATER-001": "NA",
 *   "G-DATA-001": "WIP"
 * }
 *
 * @param {Object} reponses
 * @return {Object}
 */
function calculerScoreESG(reponses) {
  reponses = reponses || {};

  var questions =
    obtenirQuestionsESG();

  if (
    !questions ||
    questions.length === 0
  ) {
    throw new Error(
      "Aucune question ESG disponible."
    );
  }

  var resultatsQuestions = [];

  var resultatsPiliers = {
    E: creerResultatPilierESGVide_("E"),
    S: creerResultatPilierESGVide_("S"),
    G: creerResultatPilierESGVide_("G"),
    R: creerResultatPilierESGVide_("R")
  };

  var alertesCritiques = [];
  var donneesManquantes = [];
  var recommandationsPrioritaires = [];

  questions.forEach(
    function(question) {
      var reponseBrute =
        reponses[
          question.question_id
        ];

      var analyse =
        analyserReponseQuestionESG_(
          question,
          reponseBrute
        );

      resultatsQuestions.push(
        analyse
      );

      var pilier =
        resultatsPiliers[
          question.pillar
        ];

      pilier.nombreQuestions++;

      if (
        analyse.nonApplicable === true
      ) {
        pilier.nombreNonApplicables++;
        return;
      }

      pilier.poidsApplicable +=
        question.weight;

      pilier.scorePondere +=
        analyse.score *
        question.weight;

      pilier.scoreMaximumPondere +=
        100 *
        question.weight;

      if (
        analyse.reponseManquante === true
      ) {
        pilier.nombreManquantes++;

        donneesManquantes.push({
          questionId:
            question.question_id,

          numero:
            question.number,

          pilier:
            question.pillar,

          question:
            question.question_text
        });
      } else {
        pilier.nombreRepondues++;
      }

      if (
        analyse.score <= 40
      ) {
        pilier.nombreFaibles++;

        recommandationsPrioritaires.push(
          creerPrioriteESG_(
            question,
            analyse
          )
        );
      }

      if (
        analyse.alerteCritique
      ) {
        alertesCritiques.push(
          analyse.alerteCritique
        );

        pilier.nombreAlertesCritiques++;
      }

      pilier.scorePreuvesPondere +=
        analyse.scorePreuve *
        question.weight;

      pilier.poidsPreuves +=
        question.weight;
    }
  );


  finaliserResultatPilierESG_(
    resultatsPiliers.E
  );

  finaliserResultatPilierESG_(
    resultatsPiliers.S
  );

  finaliserResultatPilierESG_(
    resultatsPiliers.G
  );

  finaliserResultatPilierESG_(
    resultatsPiliers.R
  );


  appliquerAjustementsCritiquesESG_(
    resultatsPiliers,
    alertesCritiques
  );


  var scoreGlobalBrut =
    calculerScoreGlobalESG_(
      resultatsPiliers,
      false
    );

  var scoreGlobalAjuste =
    calculerScoreGlobalESG_(
      resultatsPiliers,
      true
    );


  var scorePreuves =
    calculerScorePreuvesGlobalESG_(
      resultatsPiliers
    );


  var qualiteDonnees =
    calculerQualiteDonneesESG_(
      resultatsQuestions
    );


  var niveauConfiance =
    calculerNiveauConfianceESG_(
      scorePreuves,
      qualiteDonnees
    );


  var maturite =
    determinerMaturiteESG_(
      scoreGlobalAjuste
    );


  var risque =
    determinerNiveauRisqueESG_(
      scoreGlobalAjuste,
      alertesCritiques,
      qualiteDonnees
    );


  recommandationsPrioritaires.sort(
    function(a, b) {
      if (
        b.prioriteNumerique !==
        a.prioriteNumerique
      ) {
        return (
          b.prioriteNumerique -
          a.prioriteNumerique
        );
      }

      return (
        a.score -
        b.score
      );
    }
  );


  var prioritesFinales =
    recommandationsPrioritaires
      .slice(0, 10)
      .map(
        function(priorite) {
          delete priorite.prioriteNumerique;
          return priorite;
        }
      );


  return {
    success: true,

    generatedAt:
      new Date().toISOString(),

    version:
      ESG_CONFIG.version,

    scores: {
      environnement:
        resultatsPiliers.E.scoreAjuste,

      social:
        resultatsPiliers.S.scoreAjuste,

      gouvernance:
        resultatsPiliers.G.scoreAjuste,

      readiness:
        resultatsPiliers.R.scoreAjuste,

      globalBrut:
        scoreGlobalBrut,

      globalAjuste:
        scoreGlobalAjuste,

      preuves:
        scorePreuves,

      qualiteDonnees:
        qualiteDonnees,

      niveauConfiance:
        niveauConfiance
    },

    maturite:
      maturite,

    risque:
      risque,

    piliers:
      resultatsPiliers,

    alertesCritiques:
      alertesCritiques,

    nombreAlertesCritiques:
      alertesCritiques.length,

    donneesManquantes:
      donneesManquantes,

    nombreDonneesManquantes:
      donneesManquantes.length,

    priorites:
      prioritesFinales,

    resultatsQuestions:
      resultatsQuestions
  };
}


/**
 * Crée la structure vide d’un pilier ESG.
 */
function creerResultatPilierESGVide_(
  codePilier
) {
  return {
    code:
      codePilier,

    label:
      ESG_CONFIG.pillarLabels[
        codePilier
      ],

    nombreQuestions:
      0,

    nombreRepondues:
      0,

    nombreManquantes:
      0,

    nombreNonApplicables:
      0,

    nombreFaibles:
      0,

    nombreAlertesCritiques:
      0,

    poidsApplicable:
      0,

    scorePondere:
      0,

    scoreMaximumPondere:
      0,

    scoreBrut:
      0,

    penalite:
      0,

    plafond:
      100,

    scoreAjuste:
      0,

    scorePreuvesPondere:
      0,

    poidsPreuves:
      0,

    scorePreuves:
      0
  };
}


/**
 * Analyse une réponse individuelle.
 */
function analyserReponseQuestionESG_(
  question,
  reponseBrute
) {
  var valeur =
    extraireValeurReponseESG_(
      reponseBrute
    );

  var niveauPreuve =
    extraireNiveauPreuveESG_(
      reponseBrute
    );

  var commentaire =
    extraireCommentaireReponseESG_(
      reponseBrute
    );

  var nonApplicable =
    valeur === "NA";

  var reponseManquante =
    valeur === null ||
    valeur === undefined ||
    valeur === "" ||
    valeur === "UNK";

  var score =
    convertirValeurEnScoreESG_(
      valeur
    );

  var scorePreuve =
    calculerScorePreuveESG_(
      niveauPreuve
    );

  var alerteCritique =
    detecterAlerteCritiqueSimpleESG_(
      question,
      valeur,
      score
    );

  return {
    questionId:
      question.question_id,

    numero:
      question.number,

    pilier:
      question.pillar,

    theme:
      question.theme,

    subtheme:
      question.subtheme,

    question:
      question.question_text,

    valeur:
      valeur,

    score:
      score,

    poids:
      question.weight,

    scorePondere:
      nonApplicable
        ? null
        : arrondirScoreESG_(
            score *
            question.weight
          ),

    critique:
      question.critical === true,

    nonApplicable:
      nonApplicable,

    reponseManquante:
      reponseManquante,

    niveauPreuve:
      niveauPreuve,

    scorePreuve:
      scorePreuve,

    commentaire:
      commentaire,

    alerteCritique:
      alerteCritique
  };
}


/**
 * Extrait la valeur principale.
 */
function extraireValeurReponseESG_(
  reponseBrute
) {
  if (
    reponseBrute === null ||
    reponseBrute === undefined
  ) {
    return null;
  }

  if (
    typeof reponseBrute ===
    "object"
  ) {
    if (
      reponseBrute.value ===
      undefined
    ) {
      return null;
    }

    return normaliserValeurESG_(
      reponseBrute.value
    );
  }

  return normaliserValeurESG_(
    reponseBrute
  );
}


/**
 * Normalise les valeurs provenant du formulaire.
 */
function normaliserValeurESG_(
  valeur
) {
  if (
    valeur === null ||
    valeur === undefined ||
    valeur === ""
  ) {
    return null;
  }

  if (
    typeof valeur === "number"
  ) {
    return valeur;
  }

  var texte =
    String(valeur)
      .trim()
      .toUpperCase();

  if (
    texte === "NA" ||
    texte === "N/A" ||
    texte === "NON APPLICABLE"
  ) {
    return "NA";
  }

  if (
    texte === "UNK" ||
    texte === "INCONNU" ||
    texte === "INFORMATION INCONNUE"
  ) {
    return "UNK";
  }

  if (
    texte === "WIP" ||
    texte === "EN COURS"
  ) {
    return "WIP";
  }

  var nombre =
    Number(
      String(valeur)
        .replace(",", ".")
    );

  if (!isNaN(nombre)) {
    return nombre;
  }

  return texte;
}


/**
 * Convertit la réponse en score sur 100.
 */
function convertirValeurEnScoreESG_(
  valeur
) {
  if (
    valeur === null ||
    valeur === undefined ||
    valeur === "" ||
    valeur === "UNK"
  ) {
    return 0;
  }

  if (
    valeur === "NA"
  ) {
    return null;
  }

  if (
    valeur === "WIP"
  ) {
    return 30;
  }

  var nombre =
    Number(valeur);

  if (isNaN(nombre)) {
    return 0;
  }

  if (nombre < 0) {
    nombre = 0;
  }

  if (nombre > 5) {
    nombre = 5;
  }

  return arrondirScoreESG_(
    nombre * 20
  );
}


/**
 * Extrait le niveau de preuve.
 */
function extraireNiveauPreuveESG_(
  reponseBrute
) {
  if (
    !reponseBrute ||
    typeof reponseBrute !==
      "object"
  ) {
    return "NONE";
  }

  var niveau =
    reponseBrute.evidenceLevel ||
    reponseBrute.niveauPreuve ||
    "NONE";

  niveau =
    String(niveau)
      .trim()
      .toUpperCase();

  var niveauxAutorises = {
    STRONG: true,
    MEDIUM: true,
    DECLARATIVE: true,
    NONE: true
  };

  return niveauxAutorises[niveau]
    ? niveau
    : "NONE";
}


/**
 * Extrait le commentaire utilisateur.
 */
function extraireCommentaireReponseESG_(
  reponseBrute
) {
  if (
    !reponseBrute ||
    typeof reponseBrute !==
      "object"
  ) {
    return "";
  }

  return String(
    reponseBrute.comment ||
    reponseBrute.commentaire ||
    ""
  ).trim();
}


/**
 * Calcule le score d’une preuve.
 */
function calculerScorePreuveESG_(
  niveauPreuve
) {
  var scores = {
    STRONG: 100,
    MEDIUM: 60,
    DECLARATIVE: 20,
    NONE: 0
  };

  return scores[niveauPreuve] !==
    undefined
      ? scores[niveauPreuve]
      : 0;
}


/**
 * Détection basique des réponses critiques.
 *
 * Le moteur complet d’alertes sera placé
 * dans ESGCriticalAlerts.gs.
 */
function detecterAlerteCritiqueSimpleESG_(
  question,
  valeur,
  score
) {
  if (
    question.critical !== true
  ) {
    return null;
  }

  if (
    valeur === "NA"
  ) {
    return null;
  }

  if (
    score > 20
  ) {
    return null;
  }

  var gravite =
    question.critical_rule &&
    question.critical_rule.severity
      ? question.critical_rule.severity
      : "high";

  return {
    code:
      "ALERT-" +
      question.question_id,

    questionId:
      question.question_id,

    numero:
      question.number,

    pilier:
      question.pillar,

    theme:
      question.theme,

    gravite:
      gravite,

    score:
      score,

    message:
      creerMessageAlerteCritiqueESG_(
        question,
        score
      ),

    recommandation:
      question.recommendations &&
      question.recommendations.immediate
        ? question
            .recommendations
            .immediate[0]
        : "Mettre en place une action corrective immédiate.",

    validationHumaineRecommandee:
      question.critical_rule
        ? question
            .critical_rule
            .requires_human_review ===
          true
        : true
  };
}


/**
 * Génère le texte d’une alerte.
 */
function creerMessageAlerteCritiqueESG_(
  question,
  score
) {
  if (score === 0) {
    return (
      "Aucun dispositif démontré pour une question critique : " +
      question.question_text
    );
  }

  return (
    "Dispositif très faible ou informel pour une question critique : " +
    question.question_text
  );
}


/**
 * Finalise les scores d’un pilier.
 */
function finaliserResultatPilierESG_(
  pilier
) {
  if (
    pilier.scoreMaximumPondere <= 0
  ) {
    pilier.scoreBrut = 0;
  } else {
    pilier.scoreBrut =
      arrondirScoreESG_(
        (
          pilier.scorePondere /
          pilier.scoreMaximumPondere
        ) *
        100
      );
  }

  if (
    pilier.poidsPreuves <= 0
  ) {
    pilier.scorePreuves = 0;
  } else {
    pilier.scorePreuves =
      arrondirScoreESG_(
        pilier.scorePreuvesPondere /
        pilier.poidsPreuves
      );
  }

  pilier.scoreAjuste =
    pilier.scoreBrut;
}


/**
 * Applique les pénalités et plafonds critiques.
 */
function appliquerAjustementsCritiquesESG_(
  piliers,
  alertes
) {
  alertes.forEach(
    function(alerte) {
      var pilier =
        piliers[
          alerte.pilier
        ];

      if (!pilier) {
        return;
      }

      if (
        alerte.gravite ===
        "critical"
      ) {
        pilier.penalite += 15;

        pilier.plafond =
          Math.min(
            pilier.plafond,
            40
          );
      } else {
        pilier.penalite += 8;

        pilier.plafond =
          Math.min(
            pilier.plafond,
            60
          );
      }
    }
  );

  Object.keys(piliers)
    .forEach(
      function(codePilier) {
        var pilier =
          piliers[
            codePilier
          ];

        var apresPenalite =
          pilier.scoreBrut -
          pilier.penalite;

        apresPenalite =
          Math.max(
            0,
            apresPenalite
          );

        apresPenalite =
          Math.min(
            apresPenalite,
            pilier.plafond
          );

        pilier.scoreAjuste =
          arrondirScoreESG_(
            apresPenalite
          );
      }
    );
}


/**
 * Calcule le score global pondéré.
 */
function calculerScoreGlobalESG_(
  piliers,
  utiliserScoreAjuste
) {
  var total =
    0;

  var poidsTotal =
    0;

  Object.keys(
    ESG_CONFIG.pillarWeights
  ).forEach(
    function(codePilier) {
      var poids =
        ESG_CONFIG
          .pillarWeights[
            codePilier
          ];

      var pilier =
        piliers[
          codePilier
        ];

      if (!pilier) {
        return;
      }

      var score =
        utiliserScoreAjuste
          ? pilier.scoreAjuste
          : pilier.scoreBrut;

      total +=
        score * poids;

      poidsTotal +=
        poids;
    }
  );

  if (poidsTotal <= 0) {
    return 0;
  }

  return arrondirScoreESG_(
    total /
    poidsTotal
  );
}


/**
 * Calcule le score global de preuve.
 */
function calculerScorePreuvesGlobalESG_(
  piliers
) {
  var total =
    0;

  var poidsTotal =
    0;

  Object.keys(
    ESG_CONFIG.pillarWeights
  ).forEach(
    function(codePilier) {
      var poids =
        ESG_CONFIG
          .pillarWeights[
            codePilier
          ];

      var pilier =
        piliers[
          codePilier
        ];

      total +=
        pilier.scorePreuves *
        poids;

      poidsTotal +=
        poids;
    }
  );

  return poidsTotal > 0
    ? arrondirScoreESG_(
        total /
        poidsTotal
      )
    : 0;
}


/**
 * Calcule la qualité minimale des données.
 *
 * V1 :
 * - 60 % complétude ;
 * - 40 % disponibilité des preuves.
 */
function calculerQualiteDonneesESG_(
  resultatsQuestions
) {
  var applicables =
    resultatsQuestions.filter(
      function(resultat) {
        return (
          resultat.nonApplicable !==
          true
        );
      }
    );

  if (
    applicables.length === 0
  ) {
    return 0;
  }

  var repondues =
    applicables.filter(
      function(resultat) {
        return (
          resultat.reponseManquante !==
          true
        );
      }
    ).length;

  var completude =
    (
      repondues /
      applicables.length
    ) *
    100;

  var totalPreuves =
    applicables.reduce(
      function(total, resultat) {
        return (
          total +
          resultat.scorePreuve
        );
      },
      0
    );

  var preuves =
    totalPreuves /
    applicables.length;

  return arrondirScoreESG_(
    completude * 0.60 +
    preuves * 0.40
  );
}


/**
 * Niveau de confiance du diagnostic.
 */
function calculerNiveauConfianceESG_(
  scorePreuves,
  qualiteDonnees
) {
  return arrondirScoreESG_(
    50 +
    0.25 *
      scorePreuves +
    0.25 *
      qualiteDonnees
  );
}


/**
 * Détermine le niveau de maturité.
 */
function determinerMaturiteESG_(
  score
) {
  var seuils =
    ESG_CONFIG
      .maturityThresholds;

  for (
    var index = 0;
    index < seuils.length;
    index++
  ) {
    var seuil =
      seuils[index];

    if (
      score >= seuil.min &&
      score <= seuil.max
    ) {
      return {
        code:
          seuil.code,

        label:
          seuil.label,

        score:
          score
      };
    }
  }

  return {
    code:
      "NON_DETERMINE",

    label:
      "Non déterminé",

    score:
      score
  };
}


/**
 * Détermine le niveau de risque global.
 */
function determinerNiveauRisqueESG_(
  scoreGlobal,
  alertesCritiques,
  qualiteDonnees
) {
  var nombreTresCritiques =
    alertesCritiques.filter(
      function(alerte) {
        return (
          alerte.gravite ===
          "critical"
        );
      }
    ).length;

  if (
    nombreTresCritiques > 0
  ) {
    return {
      code:
        "TRES_ELEVE",

      label:
        "Risque ESG très élevé",

      justification:
        "Au moins une alerte ESG critique a été détectée."
    };
  }

  if (
    alertesCritiques.length > 0 ||
    scoreGlobal <= 35
  ) {
    return {
      code:
        "ELEVE",

      label:
        "Risque ESG élevé",

      justification:
        "Des dispositifs critiques sont absents ou insuffisamment structurés."
    };
  }

  if (
    scoreGlobal <= 60 ||
    qualiteDonnees < 50
  ) {
    return {
      code:
        "MODERE",

      label:
        "Risque ESG modéré",

      justification:
        "L’organisation dispose de pratiques partielles mais doit renforcer son pilotage et ses preuves."
    };
  }

  if (
    scoreGlobal <= 80
  ) {
    return {
      code:
        "MAITRISE",

      label:
        "Risque ESG maîtrisé",

      justification:
        "Les principaux dispositifs sont structurés, avec quelques améliorations nécessaires."
    };
  }

  return {
    code:
      "FAIBLE",

    label:
      "Risque ESG faible",

    justification:
      "Le système ESG est globalement mature, documenté et piloté."
  };
}


/**
 * Crée une priorité d’amélioration.
 */
function creerPrioriteESG_(
  question,
  analyse
) {
  var prioriteNumerique =
    question.critical === true
      ? 100
      : question.weight * 10;

  prioriteNumerique +=
    100 -
    analyse.score;

  return {
    questionId:
      question.question_id,

    numero:
      question.number,

    pilier:
      question.pillar,

    theme:
      question.theme,

    score:
      analyse.score,

    poids:
      question.weight,

    critique:
      question.critical === true,

    niveau:
      analyse.score <= 20
        ? "URGENT"
        : "PRIORITAIRE",

    recommandation:
      question.recommendations &&
      question.recommendations.immediate
        ? question
            .recommendations
            .immediate[0]
        : "Mettre en place un plan d’amélioration.",

    preuveAttendue:
      question
        .accepted_evidence_examples,

    prioriteNumerique:
      prioriteNumerique
  };
}


/**
 * Arrondit un score à deux décimales.
 */
function arrondirScoreESG_(
  valeur
) {
  valeur =
    Number(valeur);

  if (isNaN(valeur)) {
    return 0;
  }

  return (
    Math.round(
      valeur * 100
    ) /
    100
  );
}


/**
 * Test automatique du moteur.
 */
function testerMoteurScoringESG() {
  var reponsesTest = {};

  obtenirQuestionsESG()
    .forEach(
      function(question) {
        reponsesTest[
          question.question_id
        ] = {
          value:
            3,

          evidenceLevel:
            "MEDIUM",

          comment:
            "Réponse automatique de test"
        };
      }
    );


  /*
   * Création volontaire de quelques alertes.
   */

  reponsesTest[
    "S-HR-002"
  ] = {
    value:
      0,

    evidenceLevel:
      "NONE"
  };

  reponsesTest[
    "G-COMP-001"
  ] = {
    value:
      1,

    evidenceLevel:
      "DECLARATIVE"
  };

  reponsesTest[
    "E-BIOD-001"
  ] = {
    value:
      2,

    evidenceLevel:
      "MEDIUM"
  };


  var resultat =
    calculerScoreESG(
      reponsesTest
    );


  Logger.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );


  if (
    resultat.success !== true
  ) {
    throw new Error(
      "Le moteur ESG n’a pas retourné un résultat valide."
    );
  }


  if (
    resultat.scores
      .environnement ===
      undefined ||
    resultat.scores
      .social ===
      undefined ||
    resultat.scores
      .gouvernance ===
      undefined ||
    resultat.scores
      .readiness ===
      undefined
  ) {
    throw new Error(
      "Un ou plusieurs scores ESG sont absents."
    );
  }


  return {
    success:
      true,

    scores:
      resultat.scores,

    maturite:
      resultat.maturite,

    risque:
      resultat.risque,

    nombreAlertes:
      resultat
        .nombreAlertesCritiques,

    nombrePriorites:
      resultat
        .priorites.length
  };
}