/**
 * ==========================================================
 * AFRIGREEN24 — DIAGNOSTIC DE VISIBILITÉ NUMÉRIQUE ESG
 * HUMBLE LABS DIGITAL
 * Version 1.0.0
 * ==========================================================
 *
 * Ce module :
 * - contient les 5 questions numériques ESG ;
 * - calcule un score de visibilité numérique ;
 * - détecte les besoins commerciaux ;
 * - génère des recommandations personnalisées ;
 * - qualifie les prospects pour HUMBLE LABS DIGITAL.
 *
 * Ce score NE MODIFIE PAS le score ESG principal.
 */


/**
 * Configuration générale.
 */
var ESG_DIGITAL_CONFIG = {
  version: "1.0.0",

  nombreQuestions: 5,

  scoreMaximumParQuestion: 5,

  niveaux: [
    {
      min: 0,
      max: 20,
      code: "CRITIQUE",
      label: "Présence numérique critique"
    },
    {
      min: 21,
      max: 40,
      code: "FAIBLE",
      label: "Présence numérique faible"
    },
    {
      min: 41,
      max: 60,
      code: "EN_STRUCTURATION",
      label: "Présence numérique en structuration"
    },
    {
      min: 61,
      max: 80,
      code: "AVANCEE",
      label: "Présence numérique avancée"
    },
    {
      min: 81,
      max: 100,
      code: "MATURE",
      label: "Présence numérique mature"
    }
  ]
};


/**
 * Liste des cinq questions de visibilité numérique ESG.
 */
var ESG_DIGITAL_QUESTIONS = [

  {
    id: "D-WEB-001",

    numero: 1,

    categorie: "SITE_WEB",

    titre:
      "Présence web et transparence ESG",

    question:
      "Votre organisation dispose-t-elle d’un site web professionnel présentant clairement ses activités, ses engagements et ses impacts environnementaux et sociaux ?",

    typeReponse:
      "CHOIX_UNIQUE",

    obligatoire:
      true,

    options: [
      {
        value: 0,
        label:
          "Nous n’avons pas de site web."
      },
      {
        value: 1,
        label:
          "Nous avons un site ancien, incomplet ou difficile à utiliser."
      },
      {
        value: 2,
        label:
          "Notre site présente nos services, mais pas nos engagements ESG."
      },
      {
        value: 3,
        label:
          "Notre site contient quelques informations sur nos engagements ESG."
      },
      {
        value: 4,
        label:
          "Notre site présente clairement nos engagements, actions et résultats ESG."
      },
      {
        value: 5,
        label:
          "Notre site est professionnel, optimisé, régulièrement mis à jour et possède une rubrique ESG complète."
      }
    ],

    servicesPotentiels: [
      "CREATION_SITE_WEB",
      "REFONTE_SITE_WEB",
      "OPTIMISATION_SITE_WEB",
      "PAGE_ESG",
      "REFERENCEMENT_WEB"
    ]
  },


  {
    id: "D-LINKEDIN-001",

    numero: 2,

    categorie: "LINKEDIN",

    titre:
      "Présence LinkedIn professionnelle",

    question:
      "Votre organisation dispose-t-elle d’une page LinkedIn professionnelle, complète et régulièrement active ?",

    typeReponse:
      "CHOIX_UNIQUE",

    obligatoire:
      true,

    options: [
      {
        value: 0,
        label:
          "Nous n’avons pas de page LinkedIn."
      },
      {
        value: 1,
        label:
          "La page existe, mais elle est incomplète ou inactive."
      },
      {
        value: 2,
        label:
          "La page est complète, mais nous publions rarement."
      },
      {
        value: 3,
        label:
          "Nous publions occasionnellement sur nos activités."
      },
      {
        value: 4,
        label:
          "Nous publions régulièrement sur nos activités et nos engagements ESG."
      },
      {
        value: 5,
        label:
          "Notre page suit une stratégie éditoriale professionnelle avec mesure des résultats."
      }
    ],

    servicesPotentiels: [
      "CREATION_PAGE_LINKEDIN",
      "OPTIMISATION_LINKEDIN",
      "STRATEGIE_LINKEDIN",
      "GESTION_LINKEDIN",
      "CREATION_CONTENUS"
    ]
  },


  {
    id: "D-COM-001",

    numero: 3,

    categorie: "COMMUNICATION_ESG",

    titre:
      "Communication des engagements ESG",

    question:
      "Comment votre organisation communique-t-elle actuellement ses engagements, ses actions et ses résultats ESG auprès de ses partenaires, clients, investisseurs et communautés ?",

    typeReponse:
      "CHOIX_UNIQUE",

    obligatoire:
      true,

    options: [
      {
        value: 0,
        label:
          "Nous ne communiquons pas encore sur nos engagements ESG."
      },
      {
        value: 1,
        label:
          "Nous communiquons principalement par bouche-à-oreille ou messages privés."
      },
      {
        value: 2,
        label:
          "Nous envoyons occasionnellement des documents ou présentations."
      },
      {
        value: 3,
        label:
          "Nous communiquons sur notre site web ou nos réseaux sociaux."
      },
      {
        value: 4,
        label:
          "Nous publions régulièrement des contenus et informations ESG."
      },
      {
        value: 5,
        label:
          "Nous disposons d’une stratégie multicanale structurée avec site, LinkedIn, newsletter et rapport ESG."
      }
    ],

    servicesPotentiels: [
      "STRATEGIE_COMMUNICATION_ESG",
      "CREATION_CONTENUS_ESG",
      "NEWSLETTER",
      "RAPPORT_ESG_INTERACTIF",
      "COMMUNICATION_MULTICANALE"
    ]
  },


  {
    id: "D-AUTO-001",

    numero: 4,

    categorie: "AUTOMATISATION",

    titre:
      "Collecte et automatisation ESG",

    question:
      "Quels outils votre organisation utilise-t-elle pour collecter ses données, suivre ses indicateurs et préparer ses rapports ESG ?",

    typeReponse:
      "CHOIX_UNIQUE",

    obligatoire:
      true,

    options: [
      {
        value: 0,
        label:
          "Nous utilisons principalement le papier, WhatsApp ou des échanges informels."
      },
      {
        value: 1,
        label:
          "Nous utilisons plusieurs fichiers Excel ou documents séparés."
      },
      {
        value: 2,
        label:
          "Nous utilisons Google Forms, Google Sheets ou des outils similaires."
      },
      {
        value: 3,
        label:
          "Nous disposons d’un tableau de bord numérique centralisé."
      },
      {
        value: 4,
        label:
          "Plusieurs outils sont connectés et certains processus sont automatisés."
      },
      {
        value: 5,
        label:
          "Nous disposons d’un système automatisé avec tableaux de bord, alertes et génération de rapports."
      }
    ],

    servicesPotentiels: [
      "CENTRALISATION_DONNEES",
      "TABLEAU_DE_BORD",
      "AUTOMATISATION_ESG",
      "APPLICATION_WEB",
      "INTELLIGENCE_ARTIFICIELLE"
    ]
  },


  {
    id: "D-PRIORITY-001",

    numero: 5,

    categorie: "BESOIN_PRIORITAIRE",

    titre:
      "Priorité numérique de l’organisation",

    question:
      "Quel accompagnement numérique aiderait actuellement le plus votre organisation à renforcer sa crédibilité et sa démarche ESG ?",

    typeReponse:
      "CHOIX_MULTIPLE",

    obligatoire:
      true,

    maximumChoix:
      3,

    options: [
      {
        value:
          "CREATION_SITE_WEB",

        label:
          "Créer un site web professionnel."
      },
      {
        value:
          "REFONTE_SITE_WEB",

        label:
          "Moderniser et optimiser notre site actuel."
      },
      {
        value:
          "PAGE_ESG",

        label:
          "Ajouter une rubrique ESG à notre site."
      },
      {
        value:
          "OPTIMISATION_LINKEDIN",

        label:
          "Créer ou professionnaliser notre page LinkedIn."
      },
      {
        value:
          "STRATEGIE_LINKEDIN",

        label:
          "Développer une stratégie de contenus LinkedIn."
      },
      {
        value:
          "CREATION_CONTENUS_ESG",

        label:
          "Communiquer régulièrement sur nos impacts ESG."
      },
      {
        value:
          "CENTRALISATION_DONNEES",

        label:
          "Centraliser nos documents et données ESG."
      },
      {
        value:
          "AUTOMATISATION_ESG",

        label:
          "Automatiser la collecte et le suivi des indicateurs."
      },
      {
        value:
          "TABLEAU_DE_BORD",

        label:
          "Créer un tableau de bord ESG."
      },
      {
        value:
          "INTELLIGENCE_ARTIFICIELLE",

        label:
          "Utiliser l’intelligence artificielle dans nos processus."
      },
      {
        value:
          "ACCOMPAGNEMENT_GLOBAL",

        label:
          "Nous ne savons pas encore quel accompagnement choisir."
      }
    ]
  }
];


/**
 * Catalogue des services HUMBLE LABS DIGITAL.
 */
var HUMBLE_LABS_SERVICES = {

  CREATION_SITE_WEB: {
    code: "CREATION_SITE_WEB",
    categorie: "SITE_WEB",
    titre: "Création d’un site web professionnel",
    description:
      "Créer un site moderne, rapide, responsive et adapté à l’identité de votre organisation."
  },

  REFONTE_SITE_WEB: {
    code: "REFONTE_SITE_WEB",
    categorie: "SITE_WEB",
    titre: "Refonte et modernisation du site web",
    description:
      "Moderniser la structure, le design, les contenus et les performances du site existant."
  },

  OPTIMISATION_SITE_WEB: {
    code: "OPTIMISATION_SITE_WEB",
    categorie: "SITE_WEB",
    titre: "Optimisation du site web",
    description:
      "Améliorer l’expérience utilisateur, la vitesse, la compatibilité mobile et la visibilité en ligne."
  },

  PAGE_ESG: {
    code: "PAGE_ESG",
    categorie: "SITE_WEB",
    titre: "Création d’une rubrique ESG",
    description:
      "Présenter publiquement les engagements, les actions, les indicateurs et les résultats ESG."
  },

  REFERENCEMENT_WEB: {
    code: "REFERENCEMENT_WEB",
    categorie: "SITE_WEB",
    titre: "Référencement et visibilité web",
    description:
      "Améliorer la présence de l’organisation dans les moteurs de recherche."
  },

  CREATION_PAGE_LINKEDIN: {
    code: "CREATION_PAGE_LINKEDIN",
    categorie: "LINKEDIN",
    titre: "Création d’une page LinkedIn professionnelle",
    description:
      "Créer une page complète, crédible et cohérente avec l’identité de l’organisation."
  },

  OPTIMISATION_LINKEDIN: {
    code: "OPTIMISATION_LINKEDIN",
    categorie: "LINKEDIN",
    titre: "Optimisation de la page LinkedIn",
    description:
      "Améliorer le visuel, la présentation, les informations et le positionnement de la page."
  },

  STRATEGIE_LINKEDIN: {
    code: "STRATEGIE_LINKEDIN",
    categorie: "LINKEDIN",
    titre: "Stratégie éditoriale LinkedIn",
    description:
      "Définir les thèmes, les formats, le calendrier et les objectifs de publication."
  },

  GESTION_LINKEDIN: {
    code: "GESTION_LINKEDIN",
    categorie: "LINKEDIN",
    titre: "Gestion mensuelle de LinkedIn",
    description:
      "Créer, planifier, publier et analyser les contenus de l’organisation."
  },

  CREATION_CONTENUS: {
    code: "CREATION_CONTENUS",
    categorie: "COMMUNICATION",
    titre: "Création de contenus professionnels",
    description:
      "Transformer les activités et résultats de l’organisation en contenus crédibles et attractifs."
  },

  STRATEGIE_COMMUNICATION_ESG: {
    code: "STRATEGIE_COMMUNICATION_ESG",
    categorie: "COMMUNICATION",
    titre: "Stratégie de communication ESG",
    description:
      "Construire une communication claire, crédible et cohérente autour des engagements ESG."
  },

  CREATION_CONTENUS_ESG: {
    code: "CREATION_CONTENUS_ESG",
    categorie: "COMMUNICATION",
    titre: "Création de contenus ESG",
    description:
      "Valoriser les actions environnementales, sociales et de gouvernance auprès des parties prenantes."
  },

  NEWSLETTER: {
    code: "NEWSLETTER",
    categorie: "COMMUNICATION",
    titre: "Création et automatisation d’une newsletter",
    description:
      "Informer régulièrement les partenaires, clients, communautés et investisseurs."
  },

  RAPPORT_ESG_INTERACTIF: {
    code: "RAPPORT_ESG_INTERACTIF",
    categorie: "COMMUNICATION",
    titre: "Rapport ESG numérique et interactif",
    description:
      "Transformer les résultats ESG en une présentation numérique professionnelle et accessible."
  },

  COMMUNICATION_MULTICANALE: {
    code: "COMMUNICATION_MULTICANALE",
    categorie: "COMMUNICATION",
    titre: "Communication numérique multicanale",
    description:
      "Connecter le site, LinkedIn, la newsletter et les autres canaux de communication."
  },

  CENTRALISATION_DONNEES: {
    code: "CENTRALISATION_DONNEES",
    categorie: "AUTOMATISATION",
    titre: "Centralisation des données ESG",
    description:
      "Organiser les documents, preuves, indicateurs et informations ESG dans un espace unique."
  },

  TABLEAU_DE_BORD: {
    code: "TABLEAU_DE_BORD",
    categorie: "AUTOMATISATION",
    titre: "Création d’un tableau de bord ESG",
    description:
      "Suivre les performances, indicateurs, risques et actions prioritaires."
  },

  AUTOMATISATION_ESG: {
    code: "AUTOMATISATION_ESG",
    categorie: "AUTOMATISATION",
    titre: "Automatisation des processus ESG",
    description:
      "Automatiser la collecte, les rappels, les calculs, les alertes et la production des rapports."
  },

  APPLICATION_WEB: {
    code: "APPLICATION_WEB",
    categorie: "AUTOMATISATION",
    titre: "Application web ESG personnalisée",
    description:
      "Créer une solution interne adaptée aux processus et besoins de l’organisation."
  },

  INTELLIGENCE_ARTIFICIELLE: {
    code: "INTELLIGENCE_ARTIFICIELLE",
    categorie: "INTELLIGENCE_ARTIFICIELLE",
    titre: "Intégration de l’intelligence artificielle",
    description:
      "Utiliser l’IA pour analyser les données, préparer les contenus et améliorer les processus."
  },

  ACCOMPAGNEMENT_GLOBAL: {
    code: "ACCOMPAGNEMENT_GLOBAL",
    categorie: "ACCOMPAGNEMENT",
    titre: "Diagnostic numérique personnalisé",
    description:
      "Identifier les solutions numériques les plus adaptées à la stratégie et aux moyens de l’organisation."
  }
};


/**
 * Retourne les cinq questions numériques.
 */
function obtenirQuestionsDigitalesESG() {
  return JSON.parse(
    JSON.stringify(
      ESG_DIGITAL_QUESTIONS
    )
  );
}


/**
 * Retourne une question par son identifiant.
 */
function obtenirQuestionDigitaleESGParId(
  questionId
) {
  for (
    var index = 0;
    index < ESG_DIGITAL_QUESTIONS.length;
    index++
  ) {
    if (
      ESG_DIGITAL_QUESTIONS[index].id ===
      questionId
    ) {
      return JSON.parse(
        JSON.stringify(
          ESG_DIGITAL_QUESTIONS[index]
        )
      );
    }
  }

  return null;
}


/**
 * Analyse les réponses numériques ESG.
 *
 * Exemple :
 *
 * {
 *   "D-WEB-001": 1,
 *   "D-LINKEDIN-001": 0,
 *   "D-COM-001": 2,
 *   "D-AUTO-001": 1,
 *   "D-PRIORITY-001": [
 *     "CREATION_SITE_WEB",
 *     "OPTIMISATION_LINKEDIN"
 *   ]
 * }
 */
function analyserVisibiliteNumeriqueESG(
  reponsesDigitales
) {
  reponsesDigitales =
    reponsesDigitales || {};

  var scores = {
    siteWeb:
      normaliserScoreDigitalESG_(
        reponsesDigitales["D-WEB-001"]
      ),

    linkedin:
      normaliserScoreDigitalESG_(
        reponsesDigitales["D-LINKEDIN-001"]
      ),

    communication:
      normaliserScoreDigitalESG_(
        reponsesDigitales["D-COM-001"]
      ),

    automatisation:
      normaliserScoreDigitalESG_(
        reponsesDigitales["D-AUTO-001"]
      )
  };

  var sommeScores =
    scores.siteWeb +
    scores.linkedin +
    scores.communication +
    scores.automatisation;

  var scoreGlobal =
    Math.round(
      (
        sommeScores /
        20
      ) *
      100
    );

  var niveau =
    determinerNiveauDigitalESG_(
      scoreGlobal
    );

  var besoinsSelectionnes =
    normaliserBesoinsSelectionnesESG_(
      reponsesDigitales[
        "D-PRIORITY-001"
      ]
    );

  var services =
    detecterServicesHumbeLabsESG_(
      scores,
      besoinsSelectionnes
    );

  var qualification =
    calculerQualificationProspectESG_(
      scores,
      besoinsSelectionnes,
      services
    );

  var recommandations =
    genererRecommandationsDigitalesESG_(
      scores,
      niveau,
      services
    );

  return {
    success: true,

    version:
      ESG_DIGITAL_CONFIG.version,

    scoreGlobal:
      scoreGlobal,

    scores: scores,

    niveau: niveau,

    besoinsSelectionnes:
      besoinsSelectionnes,

    servicesRecommandes:
      services,

    qualificationProspect:
      qualification,

    recommandations:
      recommandations,

    resume:
      genererResumeDigitalESG_(
        scoreGlobal,
        niveau,
        scores
      )
  };
}


/**
 * Normalise une note entre 0 et 5.
 */
function normaliserScoreDigitalESG_(
  valeur
) {
  var score =
    Number(valeur);

  if (
    isNaN(score)
  ) {
    return 0;
  }

  score =
    Math.round(score);

  return Math.max(
    0,
    Math.min(
      5,
      score
    )
  );
}


/**
 * Retourne le niveau de maturité numérique.
 */
function determinerNiveauDigitalESG_(
  score
) {
  for (
    var index = 0;
    index < ESG_DIGITAL_CONFIG.niveaux.length;
    index++
  ) {
    var niveau =
      ESG_DIGITAL_CONFIG.niveaux[index];

    if (
      score >= niveau.min &&
      score <= niveau.max
    ) {
      return {
        code:
          niveau.code,

        label:
          niveau.label,

        min:
          niveau.min,

        max:
          niveau.max
      };
    }
  }

  return {
    code: "NON_DETERMINE",
    label: "Niveau non déterminé",
    min: 0,
    max: 100
  };
}


/**
 * Normalise les choix de la cinquième question.
 */
function normaliserBesoinsSelectionnesESG_(
  valeurs
) {
  if (
    valeurs === null ||
    valeurs === undefined ||
    valeurs === ""
  ) {
    return [];
  }

  if (
    !Array.isArray(valeurs)
  ) {
    valeurs = [valeurs];
  }

  return valeurs
    .filter(
      function(valeur) {
        return (
          valeur !== null &&
          valeur !== undefined &&
          valeur !== ""
        );
      }
    )
    .slice(
      0,
      3
    );
}


/**
 * Détecte les services pertinents.
 */
function detecterServicesHumbeLabsESG_(
  scores,
  besoinsSelectionnes
) {
  var codesServices = [];


  if (
    scores.siteWeb <= 1
  ) {
    codesServices.push(
      "CREATION_SITE_WEB",
      "PAGE_ESG"
    );
  } else if (
    scores.siteWeb <= 3
  ) {
    codesServices.push(
      "REFONTE_SITE_WEB",
      "OPTIMISATION_SITE_WEB",
      "PAGE_ESG"
    );
  }


  if (
    scores.linkedin === 0
  ) {
    codesServices.push(
      "CREATION_PAGE_LINKEDIN",
      "STRATEGIE_LINKEDIN"
    );
  } else if (
    scores.linkedin <= 2
  ) {
    codesServices.push(
      "OPTIMISATION_LINKEDIN",
      "STRATEGIE_LINKEDIN",
      "CREATION_CONTENUS"
    );
  } else if (
    scores.linkedin <= 3
  ) {
    codesServices.push(
      "GESTION_LINKEDIN",
      "CREATION_CONTENUS_ESG"
    );
  }


  if (
    scores.communication <= 1
  ) {
    codesServices.push(
      "STRATEGIE_COMMUNICATION_ESG",
      "CREATION_CONTENUS_ESG"
    );
  } else if (
    scores.communication <= 3
  ) {
    codesServices.push(
      "CREATION_CONTENUS_ESG",
      "NEWSLETTER",
      "RAPPORT_ESG_INTERACTIF"
    );
  }


  if (
    scores.automatisation <= 1
  ) {
    codesServices.push(
      "CENTRALISATION_DONNEES",
      "TABLEAU_DE_BORD",
      "AUTOMATISATION_ESG"
    );
  } else if (
    scores.automatisation <= 3
  ) {
    codesServices.push(
      "TABLEAU_DE_BORD",
      "AUTOMATISATION_ESG",
      "INTELLIGENCE_ARTIFICIELLE"
    );
  }


  besoinsSelectionnes.forEach(
    function(codeService) {
      codesServices.push(
        codeService
      );
    }
  );


  codesServices =
    supprimerDoublonsESG_(
      codesServices
    );


  return codesServices
    .filter(
      function(codeService) {
        return Boolean(
          HUMBLE_LABS_SERVICES[
            codeService
          ]
        );
      }
    )
    .map(
      function(codeService) {
        return JSON.parse(
          JSON.stringify(
            HUMBLE_LABS_SERVICES[
              codeService
            ]
          )
        );
      }
    );
}


/**
 * Calcule le niveau de qualification commerciale.
 */
function calculerQualificationProspectESG_(
  scores,
  besoinsSelectionnes,
  services
) {
  var points = 0;

  var domainesFaibles = [];


  Object.keys(scores)
    .forEach(
      function(categorie) {
        var score =
          scores[categorie];

        if (
          score <= 1
        ) {
          points += 25;

          domainesFaibles.push(
            categorie
          );
        } else if (
          score <= 2
        ) {
          points += 18;

          domainesFaibles.push(
            categorie
          );
        } else if (
          score <= 3
        ) {
          points += 10;
        }
      }
    );


  points +=
    besoinsSelectionnes.length *
    8;


  points +=
    Math.min(
      services.length * 2,
      10
    );


  points =
    Math.min(
      100,
      points
    );


  var niveauQualification =
    "FAIBLE";

  var label =
    "Prospect à faible priorité";


  if (
    points >= 70
  ) {
    niveauQualification =
      "TRES_CHAUD";

    label =
      "Prospect hautement qualifié";
  } else if (
    points >= 50
  ) {
    niveauQualification =
      "CHAUD";

    label =
      "Prospect qualifié";
  } else if (
    points >= 30
  ) {
    niveauQualification =
      "TIEDE";

    label =
      "Prospect à accompagner";
  }


  return {
    score:
      points,

    niveau:
      niveauQualification,

    label:
      label,

    domainesFaibles:
      domainesFaibles,

    nombreServicesPotentiels:
      services.length,

    contactCommercialRecommande:
      points >= 30
  };
}


/**
 * Génère les recommandations numériques.
 */
function genererRecommandationsDigitalesESG_(
  scores,
  niveau,
  services
) {
  var actionsPrioritaires = [];


  if (
    scores.siteWeb <= 1
  ) {
    actionsPrioritaires.push({
      ordre: 1,
      categorie: "Site web",
      action:
        "Créer un site web professionnel présentant les activités, les engagements et les résultats ESG de l’organisation.",
      priorite: "Élevée"
    });
  } else if (
    scores.siteWeb <= 3
  ) {
    actionsPrioritaires.push({
      ordre: 1,
      categorie: "Site web",
      action:
        "Moderniser le site web et créer une rubrique dédiée aux engagements et résultats ESG.",
      priorite: "Élevée"
    });
  }


  if (
    scores.linkedin <= 1
  ) {
    actionsPrioritaires.push({
      ordre: 2,
      categorie: "LinkedIn",
      action:
        "Créer ou professionnaliser la page LinkedIn de l’organisation.",
      priorite: "Élevée"
    });
  } else if (
    scores.linkedin <= 3
  ) {
    actionsPrioritaires.push({
      ordre: 2,
      categorie: "LinkedIn",
      action:
        "Mettre en place un calendrier éditorial et publier régulièrement des contenus professionnels.",
      priorite: "Moyenne"
    });
  }


  if (
    scores.communication <= 2
  ) {
    actionsPrioritaires.push({
      ordre: 3,
      categorie: "Communication ESG",
      action:
        "Développer une stratégie de communication pour valoriser les engagements, actions et impacts ESG.",
      priorite: "Élevée"
    });
  }


  if (
    scores.automatisation <= 2
  ) {
    actionsPrioritaires.push({
      ordre: 4,
      categorie: "Automatisation",
      action:
        "Centraliser les données ESG et automatiser progressivement le suivi des indicateurs et la génération des rapports.",
      priorite: "Moyenne"
    });
  }


  return {
    niveauActuel:
      niveau,

    actionsPrioritaires:
      actionsPrioritaires,

    servicesHumbeLabs:
      services.slice(
        0,
        6
      )
  };
}


/**
 * Génère le résumé destiné au rapport.
 */
function genererResumeDigitalESG_(
  scoreGlobal,
  niveau,
  scores
) {
  var message = "";


  if (
    scoreGlobal <= 20
  ) {
    message =
      "La présence numérique de l’organisation est actuellement très limitée. Cette situation peut réduire sa crédibilité, sa visibilité et sa capacité à valoriser ses engagements ESG auprès des partenaires et investisseurs.";
  } else if (
    scoreGlobal <= 40
  ) {
    message =
      "L’organisation dispose de quelques éléments numériques, mais sa présence en ligne et sa communication ESG restent insuffisamment structurées.";
  } else if (
    scoreGlobal <= 60
  ) {
    message =
      "La présence numérique de l’organisation est en cours de structuration. Des améliorations ciblées du site web, de LinkedIn et du suivi ESG peuvent renforcer sa crédibilité.";
  } else if (
    scoreGlobal <= 80
  ) {
    message =
      "L’organisation possède une présence numérique avancée. Elle peut encore améliorer l’automatisation, la régularité des contenus et la publication de ses résultats ESG.";
  } else {
    message =
      "L’organisation possède une présence numérique mature, structurée et favorable à la valorisation de ses performances ESG.";
  }


  return {
    titre:
      "Diagnostic de visibilité numérique ESG",

    score:
      scoreGlobal,

    niveau:
      niveau.label,

    message:
      message,

    detailScores: {
      siteWeb:
        Math.round(
          scores.siteWeb *
          20
        ),

      linkedin:
        Math.round(
          scores.linkedin *
          20
        ),

      communicationESG:
        Math.round(
          scores.communication *
          20
        ),

      automatisation:
        Math.round(
          scores.automatisation *
          20
        )
    }
  };
}


/**
 * Supprime les doublons d’un tableau.
 */
function supprimerDoublonsESG_(
  valeurs
) {
  var resultat = [];

  valeurs.forEach(
    function(valeur) {
      if (
        resultat.indexOf(
          valeur
        ) === -1
      ) {
        resultat.push(
          valeur
        );
      }
    }
  );

  return resultat;
}


/**
 * Fonction centrale combinant ESG et diagnostic numérique.
 */
function executerDiagnosticESGEtDigital(
  profil,
  reponsesESG,
  reponsesDigitales
) {
  var diagnosticESG =
    executerDiagnosticESGComplet(
      reponsesESG
    );

  var diagnosticDigital =
    analyserVisibiliteNumeriqueESG(
      reponsesDigitales
    );

  return {
    success: true,

    profil:
      profil || {},

    diagnosticESG:
      diagnosticESG,

    diagnosticDigital:
      diagnosticDigital
  };
}


/**
 * Test du module.
 */
function testerDiagnosticDigitalESG() {
  var reponsesTest = {
    "D-WEB-001": 1,

    "D-LINKEDIN-001": 0,

    "D-COM-001": 1,

    "D-AUTO-001": 2,

    "D-PRIORITY-001": [
      "CREATION_SITE_WEB",
      "OPTIMISATION_LINKEDIN",
      "AUTOMATISATION_ESG"
    ]
  };


  var resultat =
    analyserVisibiliteNumeriqueESG(
      reponsesTest
    );


  Logger.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );


  return resultat;
}