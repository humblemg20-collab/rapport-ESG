/**
 * AfriGreen24 — ESG Intelligence Score & Report
 * Moteur de recommandations ESG
 * Version 1.0.0
 *
 * Dépendances :
 * - ESGQuestions.gs
 * - ESGScoring.gs
 * - ESGCriticalAlerts.gs
 */


/**
 * Génère l’analyse stratégique complète :
 * - forces ;
 * - faiblesses ;
 * - priorités ;
 * - recommandations ;
 * - plan d’action 0–3 mois ;
 * - plan d’action 3–6 mois ;
 * - plan d’action 6–24 mois ;
 * - indicateurs recommandés.
 *
 * @param {Object} diagnostic
 * @return {Object}
 */
function genererRecommandationsESG(
  diagnostic
) {
  if (
    !diagnostic ||
    diagnostic.success !== true
  ) {
    throw new Error(
      "Diagnostic ESG invalide."
    );
  }

  var resultatsQuestions =
    diagnostic.resultatsQuestions || [];

  var forces =
    identifierForcesESG_(
      resultatsQuestions
    );

  var faiblesses =
    identifierFaiblessesESG_(
      resultatsQuestions
    );

  var actionsImmediates =
    construirePlanActionESG_(
      diagnostic,
      "IMMEDIATE"
    );

  var actionsCourtTerme =
    construirePlanActionESG_(
      diagnostic,
      "COURT_TERME"
    );

  var actionsStructurelles =
    construirePlanActionESG_(
      diagnostic,
      "STRUCTUREL"
    );

  var indicateurs =
    recommanderIndicateursESG_(
      diagnostic
    );

  var prioritePrincipale =
    determinerPrioritePrincipaleESG_(
      diagnostic,
      faiblesses
    );

  var synthese =
    genererSyntheseStrategiqueESG_(
      diagnostic,
      forces,
      faiblesses,
      prioritePrincipale
    );

  return {
    success: true,

    generatedAt:
      new Date().toISOString(),

    version:
      ESG_CONFIG.version,

    syntheseStrategique:
      synthese,

    prioritePrincipale:
      prioritePrincipale,

    forces:
      forces.slice(0, 8),

    faiblesses:
      faiblesses.slice(0, 10),

    planAction: {
      immediate_0_3_months:
        actionsImmediates,

      short_term_3_6_months:
        actionsCourtTerme,

      structural_6_24_months:
        actionsStructurelles
    },

    indicateursRecommandes:
      indicateurs,

    messageFinanceur:
      genererMessageFinanceurESG_(
        diagnostic
      ),

    conclusion:
      genererConclusionESG_(
        diagnostic,
        prioritePrincipale
      )
  };
}


/**
 * Identifie les forces.
 */
function identifierForcesESG_(
  resultatsQuestions
) {
  var forces = [];

  resultatsQuestions.forEach(
    function(resultat) {
      if (
        resultat.nonApplicable === true ||
        resultat.reponseManquante === true
      ) {
        return;
      }

      if (
        resultat.score < 80
      ) {
        return;
      }

      var question =
        obtenirQuestionESGParId(
          resultat.questionId
        );

      if (!question) {
        return;
      }

      forces.push({
        questionId:
          resultat.questionId,

        numero:
          resultat.numero,

        pilier:
          resultat.pilier,

        theme:
          resultat.theme,

        score:
          resultat.score,

        poids:
          resultat.poids,

        niveauPreuve:
          resultat.niveauPreuve,

        titre:
          "Dispositif solide en " +
          resultat.theme,

        description:
          construireDescriptionForceESG_(
            resultat,
            question
          )
      });
    }
  );

  forces.sort(
    function(a, b) {
      if (
        b.score !== a.score
      ) {
        return b.score - a.score;
      }

      return b.poids - a.poids;
    }
  );

  return forces;
}


/**
 * Description d’une force.
 */
function construireDescriptionForceESG_(
  resultat,
  question
) {
  var texte =
    "L’organisation présente un niveau de maturité élevé concernant « " +
    question.subtheme +
    " ».";

  if (
    resultat.niveauPreuve ===
    "STRONG"
  ) {
    texte +=
      " Cette performance est soutenue par des preuves fortes.";
  } else if (
    resultat.niveauPreuve ===
    "MEDIUM"
  ) {
    texte +=
      " Des preuves existent, mais leur traçabilité peut encore être renforcée.";
  } else {
    texte +=
      " La pratique doit être mieux documentée afin d’être pleinement démontrable.";
  }

  return texte;
}


/**
 * Identifie les faiblesses.
 */
function identifierFaiblessesESG_(
  resultatsQuestions
) {
  var faiblesses = [];

  resultatsQuestions.forEach(
    function(resultat) {
      if (
        resultat.nonApplicable === true
      ) {
        return;
      }

      if (
        resultat.score > 40 &&
        resultat.reponseManquante !== true
      ) {
        return;
      }

      var question =
        obtenirQuestionESGParId(
          resultat.questionId
        );

      if (!question) {
        return;
      }

      var niveau =
        determinerNiveauFaiblesseESG_(
          resultat,
          question
        );

      faiblesses.push({
        questionId:
          resultat.questionId,

        numero:
          resultat.numero,

        pilier:
          resultat.pilier,

        theme:
          resultat.theme,

        subtheme:
          resultat.subtheme,

        score:
          resultat.score,

        poids:
          resultat.poids,

        critique:
          question.critical === true,

        niveau:
          niveau.code,

        niveauLabel:
          niveau.label,

        titre:
          niveau.label +
          " — " +
          resultat.theme,

        risque:
          question.risk_evaluated,

        recommandation:
          obtenirRecommandationImmediateESG_(
            question
          ),

        preuvesAttendues:
          question.accepted_evidence_examples ||
          []
      });
    }
  );

  faiblesses.sort(
    function(a, b) {
      var scoreA =
        calculerPoidsPrioriteFaiblesseESG_(
          a
        );

      var scoreB =
        calculerPoidsPrioriteFaiblesseESG_(
          b
        );

      return scoreB - scoreA;
    }
  );

  return faiblesses;
}


/**
 * Niveau de faiblesse.
 */
function determinerNiveauFaiblesseESG_(
  resultat,
  question
) {
  if (
    question.critical === true &&
    resultat.score <= 20
  ) {
    return {
      code: "CRITIQUE",
      label: "Faiblesse critique"
    };
  }

  if (
    resultat.reponseManquante === true
  ) {
    return {
      code: "DONNEE_MANQUANTE",
      label: "Donnée manquante"
    };
  }

  if (
    resultat.score <= 20
  ) {
    return {
      code: "URGENT",
      label: "Faiblesse urgente"
    };
  }

  return {
    code: "PRIORITAIRE",
    label: "Faiblesse prioritaire"
  };
}


/**
 * Calcule le poids d’une faiblesse.
 */
function calculerPoidsPrioriteFaiblesseESG_(
  faiblesse
) {
  var score =
    100 -
    Number(
      faiblesse.score || 0
    );

  score +=
    Number(
      faiblesse.poids || 0
    ) * 10;

  if (
    faiblesse.critique === true
  ) {
    score += 100;
  }

  if (
    faiblesse.niveau ===
    "DONNEE_MANQUANTE"
  ) {
    score += 20;
  }

  return score;
}


/**
 * Crée un plan d’action par horizon.
 */
function construirePlanActionESG_(
  diagnostic,
  horizon
) {
  var questionsPrioritaires =
    construireListeQuestionsPrioritairesESG_(
      diagnostic
    );

  var actions = [];

  questionsPrioritaires.forEach(
    function(element) {
      var question =
        element.question;

      var resultat =
        element.resultat;

      var recommandation =
        obtenirRecommandationParHorizonESG_(
          question,
          horizon
        );

      if (!recommandation) {
        return;
      }

      if (
        !doitInclureActionSelonHorizonESG_(
          question,
          resultat,
          horizon
        )
      ) {
        return;
      }

      actions.push({
        actionId:
          horizon +
          "-" +
          question.question_id,

        questionId:
          question.question_id,

        pilier:
          question.pillar,

        theme:
          question.theme,

        horizon:
          horizon,

        criticite:
          question.critical === true
            ? "CRITIQUE"
            : resultat.score <= 20
              ? "ELEVEE"
              : "MODEREE",

        scoreActuel:
          resultat.score,

        action:
          recommandation,

        responsableSuggere:
          suggererResponsableESG_(
            question
          ),

        echeanceSuggeree:
          suggererEcheanceESG_(
            horizon,
            question.critical
          ),

        preuveDeRealisation:
          obtenirPremierePreuveESG_(
            question
          ),

        indicateurDeSuivi:
          question.associated_indicator ||
          suggererIndicateurGeneriqueESG_(
            question
          )
      });
    }
  );

  actions.sort(
    function(a, b) {
      if (
        a.criticite === "CRITIQUE" &&
        b.criticite !== "CRITIQUE"
      ) {
        return -1;
      }

      if (
        b.criticite === "CRITIQUE" &&
        a.criticite !== "CRITIQUE"
      ) {
        return 1;
      }

      return (
        a.scoreActuel -
        b.scoreActuel
      );
    }
  );

  return actions.slice(
    0,
    horizon === "IMMEDIATE"
      ? 8
      : 10
  );
}


/**
 * Construit la liste prioritaire complète.
 */
function construireListeQuestionsPrioritairesESG_(
  diagnostic
) {
  var liste = [];

  var resultats =
    diagnostic.resultatsQuestions ||
    [];

  resultats.forEach(
    function(resultat) {
      if (
        resultat.nonApplicable === true
      ) {
        return;
      }

      if (
        resultat.score > 60 &&
        resultat.reponseManquante !== true
      ) {
        return;
      }

      var question =
        obtenirQuestionESGParId(
          resultat.questionId
        );

      if (!question) {
        return;
      }

      liste.push({
        question:
          question,

        resultat:
          resultat,

        poidsPriorite:
          calculerPoidsPrioriteQuestionESG_(
            question,
            resultat
          )
      });
    }
  );

  liste.sort(
    function(a, b) {
      return (
        b.poidsPriorite -
        a.poidsPriorite
      );
    }
  );

  return liste;
}


/**
 * Poids de priorité d’une question.
 */
function calculerPoidsPrioriteQuestionESG_(
  question,
  resultat
) {
  var poids =
    100 -
    Number(
      resultat.score || 0
    );

  poids +=
    Number(
      question.weight || 0
    ) * 10;

  if (
    question.critical === true
  ) {
    poids += 100;
  }

  if (
    resultat.reponseManquante === true
  ) {
    poids += 25;
  }

  if (
    resultat.scorePreuve < 20
  ) {
    poids += 10;
  }

  return poids;
}


/**
 * Sélectionne la recommandation selon l’horizon.
 */
function obtenirRecommandationParHorizonESG_(
  question,
  horizon
) {
  var recommandations =
    question.recommendations || {};

  var liste = [];

  if (
    horizon === "IMMEDIATE"
  ) {
    liste =
      recommandations.immediate ||
      [];
  }

  if (
    horizon === "COURT_TERME"
  ) {
    liste =
      recommandations
        .short_term_3_6_months ||
      [];
  }

  if (
    horizon === "STRUCTUREL"
  ) {
    liste =
      recommandations
        .structural_6_24_months ||
      [];
  }

  return liste.length > 0
    ? liste[0]
    : null;
}


/**
 * Détermine si une action appartient à un horizon.
 */
function doitInclureActionSelonHorizonESG_(
  question,
  resultat,
  horizon
) {
  if (
    horizon === "IMMEDIATE"
  ) {
    return (
      question.critical === true &&
      resultat.score <= 40
    ) ||
    resultat.score <= 20 ||
    resultat.reponseManquante === true;
  }

  if (
    horizon === "COURT_TERME"
  ) {
    return (
      resultat.score <= 40
    );
  }

  if (
    horizon === "STRUCTUREL"
  ) {
    return (
      resultat.score <= 60
    );
  }

  return false;
}


/**
 * Responsable recommandé.
 */
function suggererResponsableESG_(
  question
) {
  var responsables = {
    E:
      "Responsable opérations, environnement ou direction générale",

    S:
      "Responsable RH, SST ou direction générale",

    G:
      "Direction générale, conseil ou responsable conformité",

    R:
      "Responsable ESG, reporting ou direction générale"
  };

  if (
    question.theme ===
    "Données et cybersécurité"
  ) {
    return (
      "Responsable informatique, protection des données ou direction générale"
    );
  }

  if (
    question.theme ===
    "Santé et sécurité"
  ) {
    return (
      "Responsable SST, responsable opérationnel ou direction générale"
    );
  }

  if (
    question.theme ===
    "Éthique et intégrité"
  ) {
    return (
      "Direction générale, responsable conformité ou organe de gouvernance"
    );
  }

  return responsables[
    question.pillar
  ] || "Direction générale";
}


/**
 * Échéance recommandée.
 */
function suggererEcheanceESG_(
  horizon,
  critique
) {
  if (
    horizon === "IMMEDIATE"
  ) {
    return critique
      ? "Sous 30 jours"
      : "Sous 90 jours";
  }

  if (
    horizon === "COURT_TERME"
  ) {
    return "Entre 3 et 6 mois";
  }

  return "Entre 6 et 24 mois";
}


/**
 * Première preuve attendue.
 */
function obtenirPremierePreuveESG_(
  question
) {
  var preuves =
    question
      .accepted_evidence_examples ||
    [];

  return preuves.length > 0
    ? preuves[0]
    : "Document, registre ou rapport de suivi";
}


/**
 * Recommandation immédiate.
 */
function obtenirRecommandationImmediateESG_(
  question
) {
  var recommandations =
    question.recommendations &&
    question.recommendations.immediate
      ? question.recommendations.immediate
      : [];

  return recommandations.length > 0
    ? recommandations[0]
    : "Mettre en place un plan d’amélioration.";
}


/**
 * Indicateur générique.
 */
function suggererIndicateurGeneriqueESG_(
  question
) {
  return (
    "Taux de mise en œuvre des actions liées au thème " +
    question.theme
  );
}


/**
 * Recommande les indicateurs ESG.
 */
function recommanderIndicateursESG_(
  diagnostic
) {
  var indicateurs = [];
  var dejaAjoutes = {};

  var prioritaires =
    construireListeQuestionsPrioritairesESG_(
      diagnostic
    );

  prioritaires.forEach(
    function(element) {
      var question =
        element.question;

      var indicatorId =
        question.associated_indicator;

      if (!indicatorId) {
        return;
      }

      if (
        dejaAjoutes[
          indicatorId
        ]
      ) {
        return;
      }

      dejaAjoutes[
        indicatorId
      ] = true;

      indicateurs.push(
        construireIndicateurESG_(
          indicatorId,
          question
        )
      );
    }
  );

  ajouterIndicateursSocleESG_(
    indicateurs,
    dejaAjoutes
  );

  return indicateurs.slice(
    0,
    12
  );
}


/**
 * Construit un indicateur.
 */
function construireIndicateurESG_(
  indicatorId,
  question
) {
  var catalogue = {
    "E-GHG-001": {
      label:
        "Émissions directes de GES",
      unit:
        "tCO2e",
      frequency:
        "Annuelle"
    },

    "E-ENE-001": {
      label:
        "Consommation énergétique totale",
      unit:
        "kWh ou GJ",
      frequency:
        "Mensuelle"
    },

    "E-ENE-002": {
      label:
        "Part d’énergie renouvelable",
      unit:
        "%",
      frequency:
        "Annuelle"
    },

    "E-WAT-001": {
      label:
        "Consommation d’eau",
      unit:
        "m³",
      frequency:
        "Mensuelle"
    },

    "E-WST-001": {
      label:
        "Déchets produits",
      unit:
        "kg ou tonnes",
      frequency:
        "Mensuelle"
    },

    "S-OHS-001": {
      label:
        "Taux de fréquence des accidents",
      unit:
        "Taux",
      frequency:
        "Mensuelle ou annuelle"
    },

    "S-TRN-001": {
      label:
        "Heures de formation par collaborateur",
      unit:
        "Heures",
      frequency:
        "Trimestrielle"
    },

    "S-GEN-001": {
      label:
        "Part des femmes dans l’effectif",
      unit:
        "%",
      frequency:
        "Annuelle"
    },

    "S-GRM-001": {
      label:
        "Taux de résolution des plaintes",
      unit:
        "%",
      frequency:
        "Trimestrielle"
    },

    "S-LOC-001": {
      label:
        "Part des emplois locaux",
      unit:
        "%",
      frequency:
        "Annuelle"
    },

    "G-ABC-001": {
      label:
        "Incidents de corruption confirmés",
      unit:
        "Nombre",
      frequency:
        "Trimestrielle"
    },

    "G-DATA-001": {
      label:
        "Incidents de données personnelles",
      unit:
        "Nombre",
      frequency:
        "Trimestrielle"
    },

    "R-PROOF-001": {
      label:
        "Taux de disponibilité des preuves",
      unit:
        "%",
      frequency:
        "Par diagnostic"
    },

    "R-DATA-001": {
      label:
        "Taux de complétude des données ESG",
      unit:
        "%",
      frequency:
        "Par diagnostic"
    },

    "R-TARG-001": {
      label:
        "Taux d’atteinte des objectifs ESG",
      unit:
        "%",
      frequency:
        "Annuelle"
    }
  };

  var base =
    catalogue[
      indicatorId
    ] || {
      label:
        "Indicateur lié au thème " +
        question.theme,

      unit:
        "À définir",

      frequency:
        "Trimestrielle"
    };

  return {
    indicatorId:
      indicatorId,

    pillar:
      question.pillar,

    label:
      base.label,

    unit:
      base.unit,

    frequency:
      base.frequency,

    theme:
      question.theme,

    responsible:
      suggererResponsableESG_(
        question
      )
  };
}


/**
 * Ajoute les indicateurs obligatoires du socle.
 */
function ajouterIndicateursSocleESG_(
  indicateurs,
  dejaAjoutes
) {
  var socle = [
    {
      indicatorId:
        "R-PROOF-001",

      pillar:
        "R",

      label:
        "Taux de disponibilité des preuves",

      unit:
        "%",

      frequency:
        "Par diagnostic",

      theme:
        "ESG Readiness",

      responsible:
        "Responsable ESG ou direction générale"
    },

    {
      indicatorId:
        "R-DATA-001",

      pillar:
        "R",

      label:
        "Taux de complétude des données ESG",

      unit:
        "%",

      frequency:
        "Par diagnostic",

      theme:
        "ESG Readiness",

      responsible:
        "Responsable reporting ou direction générale"
    }
  ];

  socle.forEach(
    function(indicateur) {
      if (
        dejaAjoutes[
          indicateur.indicatorId
        ]
      ) {
        return;
      }

      dejaAjoutes[
        indicateur.indicatorId
      ] = true;

      indicateurs.push(
        indicateur
      );
    }
  );
}


/**
 * Détermine la priorité principale.
 */
function determinerPrioritePrincipaleESG_(
  diagnostic,
  faiblesses
) {
  var alertes =
    diagnostic.alertesAvancees ||
    diagnostic.alertesCritiques ||
    [];

  if (
    alertes.length > 0
  ) {
    var alerte =
      alertes[0];

    return {
      code:
        alerte.ruleCode ||
        alerte.code ||
        "ALERTE_CRITIQUE",

      pillar:
        alerte.pillar ||
        alerte.pilier,

      title:
        alerte.title ||
        "Traiter une alerte ESG critique",

      description:
        alerte.message,

      action:
        alerte.immediateAction ||
        alerte.recommandation,

      urgency:
        "IMMEDIATE"
    };
  }

  if (
    faiblesses.length > 0
  ) {
    var faiblesse =
      faiblesses[0];

    return {
      code:
        faiblesse.questionId,

      pillar:
        faiblesse.pilier,

      title:
        faiblesse.titre,

      description:
        faiblesse.risque,

      action:
        faiblesse.recommandation,

      urgency:
        faiblesse.critique === true
          ? "IMMEDIATE"
          : "PRIORITAIRE"
    };
  }

  return {
    code:
      "CONTINUOUS_IMPROVEMENT",

    pillar:
      "R",

    title:
      "Maintenir l’amélioration continue",

    description:
      "Aucune faiblesse majeure n’a été détectée.",

    action:
      "Maintenir le suivi des indicateurs, des preuves et des objectifs ESG.",

    urgency:
      "MAINTENANCE"
  };
}


/**
 * Génère la synthèse stratégique.
 */
function genererSyntheseStrategiqueESG_(
  diagnostic,
  forces,
  faiblesses,
  priorite
) {
  var score =
    diagnostic.scores
      .globalAjuste;

  var maturite =
    diagnostic.maturite
      .label;

  var risque =
    diagnostic.risque
      .label;

  var texte =
    "L’organisation obtient un score ESG ajusté de " +
    score +
    "/100, correspondant au niveau « " +
    maturite +
    " ». ";

  texte +=
    "Le niveau de risque est évalué comme « " +
    risque +
    " ». ";

  if (
    forces.length > 0
  ) {
    texte +=
      "Les principaux points forts concernent notamment " +
      construireListeThemesESG_(
        forces,
        3
      ) +
      ". ";
  } else {
    texte +=
      "Aucun domaine suffisamment mature et documenté n’a encore été identifié comme une force majeure. ";
  }

  if (
    faiblesses.length > 0
  ) {
    texte +=
      "Les efforts doivent prioritairement porter sur " +
      construireListeThemesESG_(
        faiblesses,
        3
      ) +
      ". ";
  }

  texte +=
    "La priorité immédiate recommandée est : " +
    priorite.action;

  return texte;
}


/**
 * Construit une liste textuelle de thèmes.
 */
function construireListeThemesESG_(
  elements,
  limite
) {
  var themes = [];
  var dejaVus = {};

  elements.forEach(
    function(element) {
      var theme =
        element.theme;

      if (
        !theme ||
        dejaVus[theme]
      ) {
        return;
      }

      dejaVus[theme] = true;
      themes.push(theme);
    }
  );

  themes =
    themes.slice(
      0,
      limite
    );

  if (
    themes.length === 0
  ) {
    return "les domaines ESG prioritaires";
  }

  if (
    themes.length === 1
  ) {
    return themes[0];
  }

  var dernier =
    themes.pop();

  return (
    themes.join(", ") +
    " et " +
    dernier
  );
}


/**
 * Message destiné à un financeur.
 */
function genererMessageFinanceurESG_(
  diagnostic
) {
  var score =
    diagnostic.scores
      .globalAjuste;

  var confiance =
    diagnostic.scores
      .niveauConfiance;

  var alertes =
    diagnostic
      .nombreAlertesCritiques ||
    (
      diagnostic.alertesAvancees
        ? diagnostic.alertesAvancees.length
        : 0
    );

  var message =
    "Le diagnostic AfriGreen24 indique un score ESG ajusté de " +
    score +
    "/100 avec un niveau de confiance de " +
    confiance +
    "/100. ";

  if (
    alertes > 0
  ) {
    message +=
      alertes +
      " alerte(s) critique(s) ou élevée(s) nécessite(nt) un traitement et une revue documentaire avant une due diligence approfondie.";
  } else {
    message +=
      "Aucune alerte critique majeure n’a été détectée sur la base des informations déclarées.";
  }

  return message;
}


/**
 * Conclusion du rapport.
 */
function genererConclusionESG_(
  diagnostic,
  priorite
) {
  return (
    "Le diagnostic ESG constitue une photographie de la maturité de l’organisation à la date de l’évaluation. " +
    "La performance devra être renforcée par des preuves, des données fiables et un suivi régulier. " +
    "L’action prioritaire consiste à : " +
    priorite.action +
    " Le score ne constitue ni une certification, ni une garantie de financement."
  );
}


/**
 * Fonction centrale :
 * diagnostic + recommandations.
 */
function executerDiagnosticEtRecommandationsESG(
  reponses
) {
  var diagnostic =
    executerDiagnosticESGComplet(
      reponses
    );

  var recommandations =
    genererRecommandationsESG(
      diagnostic
    );

  return {
    success: true,

    diagnostic:
      diagnostic,

    recommandations:
      recommandations
  };
}


/**
 * Test automatique.
 */
function testerRecommandationsESG() {
  var reponsesTest = {};

  obtenirQuestionsESG()
    .forEach(
      function(question) {
        reponsesTest[
          question.question_id
        ] = {
          value: 3,
          evidenceLevel: "MEDIUM",
          comment:
            "Réponse automatique de test."
        };
      }
    );


  /*
   * Points forts volontaires.
   */

  reponsesTest[
    "E-ENER-001"
  ] = {
    value: 5,
    evidenceLevel: "STRONG"
  };

  reponsesTest[
    "S-TRN-001"
  ] = {
    value: 4,
    evidenceLevel: "STRONG"
  };

  reponsesTest[
    "G-FIN-001"
  ] = {
    value: 4,
    evidenceLevel: "MEDIUM"
  };


  /*
   * Faiblesses et alertes volontaires.
   */

  reponsesTest[
    "S-HR-002"
  ] = {
    value: 0,
    evidenceLevel: "NONE"
  };

  reponsesTest[
    "G-COMP-001"
  ] = {
    value: 1,
    evidenceLevel: "DECLARATIVE"
  };

  reponsesTest[
    "R-PROOF-001"
  ] = {
    value: 1,
    evidenceLevel: "NONE"
  };

  reponsesTest[
    "E-WATER-001"
  ] = {
    value: 2,
    evidenceLevel: "DECLARATIVE"
  };


  var resultat =
    executerDiagnosticEtRecommandationsESG(
      reponsesTest
    );


  Logger.log(
    JSON.stringify(
      {
        success:
          resultat.success,

        scoreGlobal:
          resultat
            .diagnostic
            .scores
            .globalAjuste,

        prioritePrincipale:
          resultat
            .recommandations
            .prioritePrincipale,

        nombreForces:
          resultat
            .recommandations
            .forces
            .length,

        nombreFaiblesses:
          resultat
            .recommandations
            .faiblesses
            .length,

        planAction:
          {
            immediate:
              resultat
                .recommandations
                .planAction
                .immediate_0_3_months
                .length,

            shortTerm:
              resultat
                .recommandations
                .planAction
                .short_term_3_6_months
                .length,

            structural:
              resultat
                .recommandations
                .planAction
                .structural_6_24_months
                .length
          },

        nombreIndicateurs:
          resultat
            .recommandations
            .indicateursRecommandes
            .length
      },
      null,
      2
    )
  );


  if (
    resultat.success !== true
  ) {
    throw new Error(
      "Le moteur de recommandations a échoué."
    );
  }


  if (
    !resultat
      .recommandations
      .prioritePrincipale
  ) {
    throw new Error(
      "La priorité principale est absente."
    );
  }


  return {
    success: true,

    scoreGlobal:
      resultat
        .diagnostic
        .scores
        .globalAjuste,

    prioritePrincipale:
      resultat
        .recommandations
        .prioritePrincipale,

    forces:
      resultat
        .recommandations
        .forces.length,

    faiblesses:
      resultat
        .recommandations
        .faiblesses.length,

    actionsImmediates:
      resultat
        .recommandations
        .planAction
        .immediate_0_3_months
        .length,

    indicateurs:
      resultat
        .recommandations
        .indicateursRecommandes
        .length
  };
}