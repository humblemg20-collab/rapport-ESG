/**
 * AfriGreen24 — ESG Intelligence Score & Report
 * Moteur avancé d’alertes critiques ESG
 * Version 1.0.0
 *
 * Dépendances :
 * - ESGQuestions.gs
 * - ESGScoring.gs
 */


/**
 * Catalogue officiel des règles critiques ESG.
 */
var ESG_CRITICAL_RULES = {

  "E-POLL-001": {
    code: "ENV-POLLUTION-MAJEURE",
    title: "Risque de pollution majeur",
    pillar: "E",
    severity: "HIGH",
    triggerMaxScore: 20,
    penalty: 15,
    cap: 60,
    humanReview: true,

    message:
      "L’organisation ne démontre pas de dispositif suffisant pour identifier, prévenir ou traiter les risques de pollution.",

    immediateAction:
      "Cartographier immédiatement les sources de pollution et mettre en place des mesures de prévention et d’urgence.",

    evidenceRequired: [
      "registre des incidents environnementaux",
      "analyses de rejets",
      "procédure d’urgence",
      "permis ou autorisations",
      "plan d’action correctif"
    ]
  },


  "E-BIOD-001": {
    code: "ENV-BIODIVERSITE-CRITIQUE",
    title: "Risque biodiversité ou habitat sensible",
    pillar: "E",
    severity: "CRITICAL",
    triggerMaxScore: 20,
    penalty: 15,
    cap: 40,
    humanReview: true,

    message:
      "Les impacts possibles sur les habitats, forêts, terres ou zones sensibles ne sont pas suffisamment évalués ou maîtrisés.",

    immediateAction:
      "Vérifier la localisation des activités et réaliser une première analyse des risques biodiversité.",

    evidenceRequired: [
      "carte des sites",
      "étude environnementale",
      "analyse biodiversité",
      "plan de gestion",
      "autorisation environnementale"
    ]
  },


  "S-OHS-001": {
    code: "SOC-SST-ABSENCE-SYSTEME",
    title: "Absence de système de santé et sécurité",
    pillar: "S",
    severity: "HIGH",
    triggerMaxScore: 20,
    penalty: 12,
    cap: 55,
    humanReview: true,

    message:
      "L’organisation ne dispose pas d’un système suffisant de santé et sécurité au travail.",

    immediateAction:
      "Évaluer les risques professionnels, mettre en place les mesures de prévention prioritaires et désigner un responsable SST.",

    evidenceRequired: [
      "évaluation des risques",
      "procédure SST",
      "registre EPI",
      "plan d’urgence",
      "registre de formation"
    ]
  },


  "S-OHS-002": {
    code: "SOC-ACCIDENTS-NON-SUIVIS",
    title: "Accidents et incidents non suivis",
    pillar: "S",
    severity: "HIGH",
    triggerMaxScore: 20,
    penalty: 15,
    cap: 55,
    humanReview: true,

    message:
      "Les accidents, quasi-accidents et incidents professionnels ne sont pas correctement enregistrés ou analysés.",

    immediateAction:
      "Ouvrir immédiatement un registre des accidents et analyser les causes de chaque incident.",

    evidenceRequired: [
      "registre des accidents",
      "déclarations d’incidents",
      "rapports d’enquête",
      "plans correctifs"
    ]
  },


  "S-HR-001": {
    code: "SOC-DROITS-HUMAINS",
    title: "Risques liés aux droits humains",
    pillar: "S",
    severity: "HIGH",
    triggerMaxScore: 20,
    penalty: 12,
    cap: 55,
    humanReview: true,

    message:
      "Les risques liés aux droits humains ne sont pas suffisamment identifiés ou gérés.",

    immediateAction:
      "Identifier les groupes potentiellement affectés et cartographier les principaux risques droits humains.",

    evidenceRequired: [
      "cartographie des risques",
      "politique droits humains",
      "clauses contractuelles",
      "audit social",
      "plan de remédiation"
    ]
  },


  "S-HR-002": {
    code: "SOC-TRAVAIL-ENFANTS-FORCE",
    title: "Risque de travail des enfants ou de travail forcé",
    pillar: "S",
    severity: "CRITICAL",
    triggerMaxScore: 20,
    penalty: 20,
    cap: 35,
    humanReview: true,

    message:
      "Aucune mesure suffisante n’est démontrée pour prévenir le travail des enfants et le travail forcé.",

    immediateAction:
      "Mettre immédiatement en place une interdiction formelle, des contrôles d’âge, des clauses fournisseurs et un mécanisme de remédiation.",

    evidenceRequired: [
      "politique formelle",
      "vérification d’âge",
      "contrats de travail",
      "clauses fournisseurs",
      "audit social",
      "registre de remédiation"
    ]
  },


  "S-GRM-001": {
    code: "SOC-ABSENCE-MECANISME-PLAINTE",
    title: "Absence de mécanisme de plainte",
    pillar: "S",
    severity: "HIGH",
    triggerMaxScore: 20,
    penalty: 8,
    cap: 65,
    humanReview: false,

    message:
      "Les travailleurs, clients, fournisseurs ou communautés ne disposent pas d’un mécanisme de plainte suffisamment accessible.",

    immediateAction:
      "Créer un canal simple, confidentiel et accessible avec un registre et un délai de traitement.",

    evidenceRequired: [
      "procédure de plainte",
      "registre des plaintes",
      "canal de signalement",
      "rapport de résolution"
    ]
  },


  "S-SUP-001": {
    code: "SOC-FOURNISSEURS-RISQUES",
    title: "Risques sociaux dans la chaîne d’approvisionnement",
    pillar: "S",
    severity: "HIGH",
    triggerMaxScore: 20,
    penalty: 10,
    cap: 60,
    humanReview: true,

    message:
      "Les fournisseurs ne sont pas suffisamment évalués sur les critères sociaux et les droits humains.",

    immediateAction:
      "Identifier les fournisseurs critiques et intégrer des clauses sociales minimales dans les contrats.",

    evidenceRequired: [
      "questionnaire fournisseur",
      "clauses sociales",
      "audit fournisseur",
      "plan correctif"
    ]
  },


  "G-LEGAL-001": {
    code: "GOV-STRUCTURE-JURIDIQUE",
    title: "Structure juridique non sécurisée",
    pillar: "G",
    severity: "CRITICAL",
    triggerMaxScore: 20,
    penalty: 20,
    cap: 35,
    humanReview: true,

    message:
      "La structure juridique, les statuts, licences ou autorisations essentielles ne sont pas suffisamment démontrés.",

    immediateAction:
      "Vérifier immédiatement l’existence légale, les statuts, les licences et les autorisations applicables.",

    evidenceRequired: [
      "statuts",
      "registre de commerce",
      "licence d’activité",
      "autorisation sectorielle",
      "preuve d’enregistrement"
    ]
  },


  "G-ABC-001": {
    code: "GOV-CORRUPTION-INTEGRITE",
    title: "Risque de corruption ou de fraude",
    pillar: "G",
    severity: "CRITICAL",
    triggerMaxScore: 20,
    penalty: 20,
    cap: 35,
    humanReview: true,

    message:
      "Le dispositif de prévention de la corruption, de la fraude et des conflits d’intérêts est insuffisant.",

    immediateAction:
      "Adopter immédiatement des règles anti-corruption et créer des registres de conflits d’intérêts et de cadeaux.",

    evidenceRequired: [
      "politique anti-corruption",
      "code de conduite",
      "registre cadeaux",
      "déclarations d’intérêts",
      "formations"
    ]
  },


  "G-COMP-001": {
    code: "GOV-NON-CONFORMITE-LEGALE",
    title: "Risque de non-conformité légale",
    pillar: "G",
    severity: "CRITICAL",
    triggerMaxScore: 20,
    penalty: 20,
    cap: 35,
    humanReview: true,

    message:
      "Les obligations légales, fiscales, sociales ou réglementaires ne sont pas suffisamment suivies ou documentées.",

    immediateAction:
      "Créer immédiatement un registre des obligations, des responsables et des échéances.",

    evidenceRequired: [
      "registre de conformité",
      "déclarations fiscales",
      "preuves de paiement",
      "licences",
      "certificats sociaux"
    ]
  },


  "G-DATA-001": {
    code: "GOV-PROTECTION-DONNEES",
    title: "Risque de violation des données personnelles",
    pillar: "G",
    severity: "HIGH",
    triggerMaxScore: 20,
    penalty: 10,
    cap: 55,
    humanReview: true,

    message:
      "Les données personnelles des employés, clients, partenaires ou bénéficiaires ne sont pas suffisamment protégées.",

    immediateAction:
      "Identifier les données sensibles, limiter les accès et mettre en place sauvegardes, consentement et gestion des incidents.",

    evidenceRequired: [
      "politique de confidentialité",
      "registre des traitements",
      "contrôles d’accès",
      "sauvegardes",
      "procédure d’incident"
    ]
  }
};


/**
 * Analyse les réponses et retourne les alertes avancées.
 *
 * @param {Object} reponses
 * @return {Object}
 */
function analyserAlertesCritiquesESG(
  reponses
) {
  reponses = reponses || {};

  var alertes = [];
  var questions =
    obtenirQuestionsESG();

  questions.forEach(
    function(question) {
      var regle =
        ESG_CRITICAL_RULES[
          question.question_id
        ];

      if (!regle) {
        return;
      }

      var reponseBrute =
        reponses[
          question.question_id
        ];

      var valeur =
        extraireValeurReponseESG_(
          reponseBrute
        );

      if (
        valeur === "NA"
      ) {
        return;
      }

      var score =
        convertirValeurEnScoreESG_(
          valeur
        );

      if (
        score === null
      ) {
        return;
      }

      if (
        score <=
        regle.triggerMaxScore
      ) {
        alertes.push(
          construireAlerteESG_(
            question,
            regle,
            valeur,
            score,
            reponseBrute
          )
        );
      }
    }
  );

  alertes.sort(
    function(a, b) {
      if (
        b.severityWeight !==
        a.severityWeight
      ) {
        return (
          b.severityWeight -
          a.severityWeight
        );
      }

      return (
        a.score -
        b.score
      );
    }
  );

  var resume =
    construireResumeAlertesESG_(
      alertes
    );

  return {
    success: true,

    total:
      alertes.length,

    resume:
      resume,

    alertes:
      alertes,

    niveauGlobal:
      determinerNiveauGlobalAlertesESG_(
        alertes
      ),

    validationHumaineRequise:
      alertes.some(
        function(alerte) {
          return (
            alerte
              .validationHumaineRecommandee ===
            true
          );
        }
      )
  };
}


/**
 * Construit une alerte détaillée.
 */
function construireAlerteESG_(
  question,
  regle,
  valeur,
  score,
  reponseBrute
) {
  var niveauPreuve =
    extraireNiveauPreuveESG_(
      reponseBrute
    );

  var commentaire =
    extraireCommentaireReponseESG_(
      reponseBrute
    );

  return {
    alertId:
      creerIdentifiantAlerteESG_(
        regle.code
      ),

    ruleCode:
      regle.code,

    questionId:
      question.question_id,

    questionNumber:
      question.number,

    pillar:
      regle.pillar,

    pillarLabel:
      ESG_CONFIG
        .pillarLabels[
          regle.pillar
        ],

    theme:
      question.theme,

    title:
      regle.title,

    severity:
      regle.severity,

    severityWeight:
      obtenirPoidsGraviteESG_(
        regle.severity
      ),

    value:
      valeur,

    score:
      score,

    penalty:
      regle.penalty,

    cap:
      regle.cap,

    message:
      regle.message,

    immediateAction:
      regle.immediateAction,

    evidenceRequired:
      regle.evidenceRequired,

    evidenceLevel:
      niveauPreuve,

    userComment:
      commentaire,

    validationHumaineRecommandee:
      regle.humanReview === true,

    status:
      "OPEN",

    createdAt:
      new Date().toISOString()
  };
}


/**
 * Identifiant unique d’alerte.
 */
function creerIdentifiantAlerteESG_(
  code
) {
  var date =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyyMMddHHmmss"
    );

  var suffixe =
    Math.floor(
      Math.random() * 9000
    ) + 1000;

  return (
    code +
    "-" +
    date +
    "-" +
    suffixe
  );
}


/**
 * Poids de gravité pour le tri.
 */
function obtenirPoidsGraviteESG_(
  gravite
) {
  var poids = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  };

  return poids[
    String(
      gravite || ""
    ).toUpperCase()
  ] || 0;
}


/**
 * Résumé des alertes.
 */
function construireResumeAlertesESG_(
  alertes
) {
  var resume = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,

    environnement: 0,
    social: 0,
    gouvernance: 0
  };

  alertes.forEach(
    function(alerte) {
      resume.total++;

      if (
        alerte.severity ===
        "CRITICAL"
      ) {
        resume.critical++;
      }

      if (
        alerte.severity ===
        "HIGH"
      ) {
        resume.high++;
      }

      if (
        alerte.severity ===
        "MEDIUM"
      ) {
        resume.medium++;
      }

      if (
        alerte.severity ===
        "LOW"
      ) {
        resume.low++;
      }

      if (
        alerte.pillar ===
        "E"
      ) {
        resume.environnement++;
      }

      if (
        alerte.pillar ===
        "S"
      ) {
        resume.social++;
      }

      if (
        alerte.pillar ===
        "G"
      ) {
        resume.gouvernance++;
      }
    }
  );

  return resume;
}


/**
 * Niveau global issu des alertes.
 */
function determinerNiveauGlobalAlertesESG_(
  alertes
) {
  var nombreCritiques =
    alertes.filter(
      function(alerte) {
        return (
          alerte.severity ===
          "CRITICAL"
        );
      }
    ).length;

  var nombreElevees =
    alertes.filter(
      function(alerte) {
        return (
          alerte.severity ===
          "HIGH"
        );
      }
    ).length;

  if (
    nombreCritiques >= 2
  ) {
    return {
      code:
        "EXTREME",

      label:
        "Risque ESG extrême",

      recommendation:
        "Suspendre toute communication positive non vérifiée et lancer une revue humaine immédiate."
    };
  }

  if (
    nombreCritiques === 1
  ) {
    return {
      code:
        "CRITICAL",

      label:
        "Risque ESG critique",

      recommendation:
        "Traiter immédiatement l’alerte critique avant toute demande de financement ou publication ESG."
    };
  }

  if (
    nombreElevees >= 3
  ) {
    return {
      code:
        "HIGH",

      label:
        "Risque ESG élevé",

      recommendation:
        "Mettre en place un plan correctif prioritaire sous trois mois."
    };
  }

  if (
    nombreElevees > 0
  ) {
    return {
      code:
        "MODERATE",

      label:
        "Risque ESG modéré",

      recommendation:
        "Traiter les alertes élevées et renforcer la documentation."
    };
  }

  return {
    code:
      "CONTROLLED",

    label:
      "Aucune alerte critique détectée",

    recommendation:
      "Maintenir la surveillance et renforcer les preuves disponibles."
  };
}


/**
 * Applique les règles avancées aux scores des piliers.
 *
 * Cette fonction peut être appelée après calculerScoreESG().
 */
function appliquerAlertesAvanceesAuxScoresESG(
  diagnostic,
  analyseAlertes
) {
  if (
    !diagnostic ||
    diagnostic.success !== true
  ) {
    throw new Error(
      "Diagnostic ESG invalide."
    );
  }

  if (
    !analyseAlertes ||
    analyseAlertes.success !== true
  ) {
    throw new Error(
      "Analyse des alertes invalide."
    );
  }

  var piliers =
    diagnostic.piliers;

  var ajustements = {
    E: {
      penalty: 0,
      cap: 100
    },

    S: {
      penalty: 0,
      cap: 100
    },

    G: {
      penalty: 0,
      cap: 100
    },

    R: {
      penalty: 0,
      cap: 100
    }
  };


  analyseAlertes.alertes.forEach(
    function(alerte) {
      var ajustement =
        ajustements[
          alerte.pillar
        ];

      if (!ajustement) {
        return;
      }

      ajustement.penalty +=
        Number(
          alerte.penalty || 0
        );

      ajustement.cap =
        Math.min(
          ajustement.cap,
          Number(
            alerte.cap || 100
          )
        );
    }
  );


  Object.keys(
    ajustements
  ).forEach(
    function(codePilier) {
      var pilier =
        piliers[
          codePilier
        ];

      if (!pilier) {
        return;
      }

      var ajustement =
        ajustements[
          codePilier
        ];

      var score =
        pilier.scoreBrut -
        ajustement.penalty;

      score =
        Math.max(
          0,
          score
        );

      score =
        Math.min(
          score,
          ajustement.cap
        );

      pilier.penaliteAvancee =
        ajustement.penalty;

      pilier.plafondAvance =
        ajustement.cap;

      pilier.scoreAjuste =
        arrondirScoreESG_(
          score
        );
    }
  );


  diagnostic.scores
    .environnement =
      piliers.E.scoreAjuste;

  diagnostic.scores
    .social =
      piliers.S.scoreAjuste;

  diagnostic.scores
    .gouvernance =
      piliers.G.scoreAjuste;

  diagnostic.scores
    .readiness =
      piliers.R.scoreAjuste;


  diagnostic.scores
    .globalAjuste =
      calculerScoreGlobalESG_(
        piliers,
        true
      );


  diagnostic.maturite =
    determinerMaturiteESG_(
      diagnostic.scores
        .globalAjuste
    );


  diagnostic.risque =
    determinerNiveauRisqueESG_(
      diagnostic.scores
        .globalAjuste,
      analyseAlertes.alertes,
      diagnostic.scores
        .qualiteDonnees
    );


  diagnostic.alertesAvancees =
    analyseAlertes.alertes;

  diagnostic.resumeAlertes =
    analyseAlertes.resume;

  diagnostic.niveauAlertes =
    analyseAlertes.niveauGlobal;

  diagnostic
    .validationHumaineRequise =
      analyseAlertes
        .validationHumaineRequise;


  return diagnostic;
}


/**
 * Fonction centrale recommandée.
 *
 * Elle calcule :
 * - les scores ;
 * - les alertes avancées ;
 * - les scores ajustés ;
 * - le niveau de risque final.
 */
function executerDiagnosticESGComplet(
  reponses
) {
  var diagnostic =
    calculerScoreESG(
      reponses
    );

  var analyseAlertes =
    analyserAlertesCritiquesESG(
      reponses
    );

  return appliquerAlertesAvanceesAuxScoresESG(
    diagnostic,
    analyseAlertes
  );
}


/**
 * Test du moteur d’alertes.
 */
function testerAlertesCritiquesESG() {
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
   * Alertes critiques volontaires.
   */

  reponsesTest[
    "S-HR-002"
  ] = {
    value: 0,
    evidenceLevel: "NONE",
    comment:
      "Aucune procédure formelle disponible."
  };

  reponsesTest[
    "G-COMP-001"
  ] = {
    value: 1,
    evidenceLevel: "DECLARATIVE",
    comment:
      "Le suivi réglementaire est informel."
  };

  reponsesTest[
    "E-POLL-001"
  ] = {
    value: 1,
    evidenceLevel: "NONE",
    comment:
      "Aucun registre d’incident."
  };

  reponsesTest[
    "G-DATA-001"
  ] = {
    value: 0,
    evidenceLevel: "NONE",
    comment:
      "Aucune politique de protection des données."
  };


  var resultat =
    executerDiagnosticESGComplet(
      reponsesTest
    );


  Logger.log(
    JSON.stringify(
      {
        success:
          resultat.success,

        scores:
          resultat.scores,

        maturite:
          resultat.maturite,

        risque:
          resultat.risque,

        resumeAlertes:
          resultat.resumeAlertes,

        niveauAlertes:
          resultat.niveauAlertes,

        validationHumaineRequise:
          resultat
            .validationHumaineRequise
      },
      null,
      2
    )
  );


  if (
    !resultat.alertesAvancees ||
    resultat
      .alertesAvancees
      .length === 0
  ) {
    throw new Error(
      "Le test devait générer des alertes critiques."
    );
  }


  return {
    success: true,

    nombreAlertes:
      resultat
        .alertesAvancees
        .length,

    resumeAlertes:
      resultat.resumeAlertes,

    niveauAlertes:
      resultat.niveauAlertes,

    scores:
      resultat.scores
  };
}