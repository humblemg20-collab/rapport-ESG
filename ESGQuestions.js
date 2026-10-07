/**
 * AfriGreen24 — ESG Intelligence Score & Report
 * Base officielle des questions ESG
 * Version 1.0.0
 */

var ESG_CONFIG = {
  productName:
    "AfriGreen24 — ESG Intelligence Score & Report",

  version: "1.0.0",

  language: "fr",

  region: "Africa",

  questionnaireLevel: "STANDARD_V1",

  pillarWeights: {
    E: 0.30,
    S: 0.30,
    G: 0.30,
    R: 0.10
  },

  pillarLabels: {
    E: "Environnement",
    S: "Social",
    G: "Gouvernance",
    R: "ESG Readiness"
  },

  maturityThresholds: [
    {
      min: 0,
      max: 20,
      code: "CRITIQUE",
      label: "ESG critique ou inexistant"
    },
    {
      min: 21,
      max: 40,
      code: "EMERGENT",
      label: "ESG émergent"
    },
    {
      min: 41,
      max: 60,
      code: "STRUCTURATION",
      label: "ESG en structuration"
    },
    {
      min: 61,
      max: 80,
      code: "AVANCE",
      label: "ESG avancé"
    },
    {
      min: 81,
      max: 100,
      code: "MATURE",
      label: "ESG mature"
    }
  ]
};


var ESG_MATURITY_OPTIONS = [
  {
    value: 0,
    label: "Inexistant",
    description:
      "Aucun dispositif ou aucune pratique.",
    score: 0
  },
  {
    value: 1,
    label: "Informel",
    description:
      "Pratique très faible, ponctuelle ou non documentée.",
    score: 20
  },
  {
    value: 2,
    label: "Initié",
    description:
      "Quelques initiatives existent mais restent isolées.",
    score: 40
  },
  {
    value: 3,
    label: "Défini",
    description:
      "La pratique est définie et partiellement structurée.",
    score: 60
  },
  {
    value: 4,
    label: "Mesuré et piloté",
    description:
      "Le système est structuré, appliqué et suivi.",
    score: 80
  },
  {
    value: 5,
    label: "Mature et amélioré",
    description:
      "Le système est documenté, mesuré et continuellement amélioré.",
    score: 100
  }
];


var ESG_SPECIAL_OPTIONS = [
  {
    value: "NA",
    label: "Non applicable",
    score: null
  },
  {
    value: "UNK",
    label: "Information inconnue",
    score: 0
  },
  {
    value: "WIP",
    label: "En cours de mise en place",
    score: 30
  }
];


var ESG_PROFILE_FIELDS = [
  {
    id: "organizationName",
    label: "Nom de l’organisation",
    type: "text",
    required: true
  },
  {
    id: "responsibleName",
    label: "Nom du responsable",
    type: "text",
    required: true
  },
  {
    id: "professionalEmail",
    label: "Email professionnel",
    type: "email",
    required: true
  },
  {
    id: "phone",
    label: "Téléphone / WhatsApp",
    type: "tel",
    required: true
  },
  {
    id: "mainCountry",
    label: "Pays principal d’activité",
    type: "country",
    required: true
  },
  {
    id: "additionalCountries",
    label: "Pays supplémentaires d’activité",
    type: "text",
    required: false
  },
  {
    id: "organizationType",
    label: "Type d’organisation",
    type: "select",
    required: true,

    options: [
      "Entreprise",
      "PME",
      "Startup",
      "Coopérative",
      "ONG",
      "Association",
      "Fondation",
      "Institution",
      "Collectivité",
      "Autre"
    ]
  },
  {
    id: "mainSector",
    label: "Secteur principal",
    type: "select",
    required: true,

    options: [
      "Agriculture / Agribusiness",
      "Énergie renouvelable",
      "Déchets / Recyclage",
      "Économie circulaire",
      "Eau / Assainissement",
      "Aquaculture / Économie bleue",
      "Biodiversité",
      "Construction durable",
      "Transport / Mobilité",
      "Climate Tech",
      "Industrie",
      "Finance verte",
      "Foresterie",
      "Autre"
    ]
  },
  {
    id: "employeeCount",
    label:
      "Nombre approximatif d’employés / collaborateurs",
    type: "number",
    required: false
  },
  {
    id: "annualRevenueOrBudget",
    label:
      "Chiffre d’affaires ou budget annuel approximatif",
    type: "text",
    required: false
  },
  {
    id: "creationYear",
    label: "Année de création",
    type: "number",
    required: false
  },
  {
    id: "interventionZone",
    label: "Zone d’intervention",
    type: "select",
    required: true,

    options: [
      "Locale",
      "Régionale",
      "Nationale",
      "Multinationale"
    ]
  },
  {
    id: "existingESGPolicy",
    label:
      "Votre organisation dispose-t-elle déjà d’une politique ESG ?",
    type: "select",
    required: true,

    options: [
      "Non",
      "En cours de préparation",
      "Oui, partiellement",
      "Oui, formalisée"
    ]
  },
  {
    id: "existingESGReport",
    label:
      "Avez-vous déjà produit un rapport ESG ou rapport d’impact ?",
    type: "select",
    required: true,

    options: [
      "Non",
      "Rapport d’impact uniquement",
      "Rapport ESG partiel",
      "Rapport ESG complet"
    ]
  },
  {
    id: "diagnosticPurpose",
    label:
      "Pourquoi réalisez-vous ce diagnostic ?",
    type: "multiselect",
    required: true,

    options: [
      "Améliorer notre gestion",
      "Rechercher un financement",
      "Attirer des investisseurs",
      "Répondre aux exigences de partenaires",
      "Préparer une certification",
      "Mesurer notre impact",
      "Préparer un reporting ESG",
      "Autre"
    ]
  }
];


/**
 * Format compact :
 *
 * [
 *   ID,
 *   numéro,
 *   pilier,
 *   thème,
 *   sous-thème,
 *   question,
 *   poids,
 *   critique,
 *   référentiel,
 *   preuve,
 *   recommandation immédiate
 * ]
 */

var ESG_QUESTION_ROWS = [

  /*
   * ENVIRONNEMENT
   */

  [
    "E-POL-001",
    1,
    "E",
    "Politique environnementale",
    "Management environnemental",
    "Votre organisation dispose-t-elle d’une politique environnementale formalisée ?",
    1.2,
    false,
    "ISO 14001",
    "Politique environnementale signée",
    "Formaliser une politique environnementale simple et approuvée par la direction."
  ],

  [
    "E-GHG-001",
    2,
    "E",
    "Changement climatique",
    "Émissions de gaz à effet de serre",
    "Mesurez-vous les émissions de gaz à effet de serre de vos activités ?",
    1.5,
    false,
    "GHG Protocol",
    "Bilan GES ou tableur de calcul",
    "Démarrer un inventaire simplifié des émissions Scope 1 et Scope 2."
  ],

  [
    "E-ENER-001",
    3,
    "E",
    "Énergie",
    "Consommation énergétique",
    "Votre organisation maîtrise-t-elle sa consommation énergétique ?",
    1.2,
    false,
    "GRI",
    "Factures et relevés énergétiques",
    "Centraliser mensuellement les consommations et les coûts énergétiques."
  ],

  [
    "E-ENER-002",
    4,
    "E",
    "Énergie",
    "Énergies renouvelables",
    "Quelle place les énergies renouvelables occupent-elles dans vos activités ?",
    0.8,
    false,
    "GRI",
    "Factures ou contrats d’énergie",
    "Calculer la part actuelle d’énergie renouvelable utilisée."
  ],

  [
    "E-WATER-001",
    5,
    "E",
    "Eau",
    "Consommation et prélèvements",
    "Mesurez-vous et réduisez-vous votre consommation d’eau ?",
    1.2,
    false,
    "GRI",
    "Factures ou relevés d’eau",
    "Créer un registre mensuel des consommations et prélèvements d’eau."
  ],

  [
    "E-WASTE-001",
    6,
    "E",
    "Déchets",
    "Gestion et valorisation",
    "Votre organisation dispose-t-elle d’un système structuré de gestion des déchets ?",
    1.3,
    false,
    "GRI",
    "Registre des déchets ou contrats prestataires",
    "Identifier les flux de déchets et mettre en place un tri minimum."
  ],

  [
    "E-RES-001",
    7,
    "E",
    "Ressources",
    "Matières premières",
    "Optimisez-vous l’utilisation des matières premières et ressources naturelles ?",
    1.0,
    false,
    "GRI",
    "Registre des matières et des pertes",
    "Mesurer les principales consommations et pertes de matières."
  ],

  [
    "E-POLL-001",
    8,
    "E",
    "Pollution",
    "Air, eau et sols",
    "Mesurez-vous et contrôlez-vous les risques de pollution liés à vos activités ?",
    1.5,
    true,
    "IFC Performance Standards",
    "Registre HSE ou analyses de rejets",
    "Cartographier immédiatement les sources potentielles de pollution."
  ],

  [
    "E-BIOD-001",
    9,
    "E",
    "Biodiversité",
    "Habitats et espèces",
    "Votre organisation évalue-t-elle son impact sur la biodiversité ?",
    1.3,
    true,
    "TNFD",
    "Carte des sites ou étude biodiversité",
    "Vérifier si les activités sont situées près de zones sensibles ou protégées."
  ],

  [
    "E-LAND-001",
    10,
    "E",
    "Sols et terres",
    "Protection des sols",
    "Vos activités prennent-elles en compte la protection des sols et des terres ?",
    1.2,
    false,
    "GRI",
    "Analyse des sols ou plan de gestion",
    "Identifier les activités susceptibles de dégrader ou contaminer les sols."
  ],

  [
    "E-CLIM-001",
    11,
    "E",
    "Changement climatique",
    "Vulnérabilité et résilience",
    "Avez-vous évalué la vulnérabilité de votre organisation au changement climatique ?",
    1.5,
    false,
    "IFRS S2",
    "Cartographie des risques climatiques",
    "Réaliser une première cartographie des risques climatiques."
  ],

  [
    "E-CIRC-001",
    12,
    "E",
    "Économie circulaire",
    "Circularité du modèle",
    "Votre modèle intègre-t-il des principes d’économie circulaire ?",
    1.0,
    false,
    "GRI",
    "Données de réemploi ou valorisation",
    "Identifier une possibilité de réduction, réemploi ou valorisation."
  ],

  [
    "E-PROD-001",
    13,
    "E",
    "Produits et services",
    "Écoconception",
    "Vos produits ou services intègrent-ils des critères environnementaux ?",
    1.0,
    false,
    "GRI",
    "Cahier des charges ou fiche produit",
    "Définir les impacts environnementaux principaux du produit ou service."
  ],

  [
    "E-SUP-001",
    14,
    "E",
    "Chaîne d’approvisionnement",
    "Fournisseurs",
    "Évaluez-vous la performance environnementale de vos fournisseurs ?",
    1.1,
    false,
    "OECD Guidelines",
    "Questionnaire ou audit fournisseur",
    "Identifier les fournisseurs présentant les risques environnementaux les plus élevés."
  ],

  [
    "E-KPI-001",
    15,
    "E",
    "Pilotage environnemental",
    "Indicateurs",
    "Disposez-vous d’indicateurs environnementaux suivis régulièrement ?",
    1.2,
    false,
    "GRI",
    "Tableau de bord environnemental",
    "Choisir trois à cinq indicateurs environnementaux prioritaires."
  ],


  /*
   * SOCIAL
   */

  [
    "S-POL-001",
    16,
    "S",
    "Politique sociale",
    "Cadre social",
    "Votre organisation dispose-t-elle d’une politique sociale formalisée ?",
    1.2,
    false,
    "GRI",
    "Politique sociale ou manuel RH",
    "Formaliser les principes sociaux et les droits essentiels."
  ],

  [
    "S-LAB-001",
    17,
    "S",
    "Travail et emploi",
    "Conditions de travail",
    "Les conditions de travail sont-elles régulièrement évaluées et améliorées ?",
    1.2,
    false,
    "ILO",
    "Enquête interne ou plan d’amélioration",
    "Réaliser un diagnostic simple des conditions de travail."
  ],

  [
    "S-OHS-001",
    18,
    "S",
    "Santé et sécurité",
    "Système SST",
    "Disposez-vous d’un système de santé et sécurité au travail ?",
    1.5,
    true,
    "ISO 45001",
    "Procédures SST et évaluation des risques",
    "Évaluer immédiatement les risques de santé et sécurité."
  ],

  [
    "S-OHS-002",
    19,
    "S",
    "Santé et sécurité",
    "Accidents et incidents",
    "Mesurez-vous les accidents, incidents et risques professionnels ?",
    1.5,
    true,
    "ISO 45001",
    "Registre des accidents et incidents",
    "Ouvrir immédiatement un registre des accidents et quasi-accidents."
  ],

  [
    "S-TRN-001",
    20,
    "S",
    "Compétences",
    "Formation",
    "Disposez-vous d’un programme de formation et de développement des compétences ?",
    0.9,
    false,
    "GRI",
    "Plan et registre de formation",
    "Identifier les compétences prioritaires et enregistrer les formations."
  ],

  [
    "S-GEN-001",
    21,
    "S",
    "Égalité de genre",
    "Participation des femmes",
    "Mesurez-vous et améliorez-vous la participation des femmes dans votre organisation ?",
    1.0,
    false,
    "GRI",
    "Registre RH ou tableau de bord genre",
    "Calculer la part des femmes dans l’effectif et la gouvernance."
  ],

  [
    "S-DEI-001",
    22,
    "S",
    "Diversité et inclusion",
    "Non-discrimination",
    "Votre organisation dispose-t-elle de pratiques favorisant la diversité et l’inclusion ?",
    1.2,
    false,
    "ILO",
    "Politique diversité et inclusion",
    "Adopter des règles minimales contre la discrimination."
  ],

  [
    "S-WAGE-001",
    23,
    "S",
    "Rémunération",
    "Équité salariale",
    "Disposez-vous de pratiques transparentes et équitables en matière de rémunération ?",
    1.2,
    false,
    "ILO",
    "Grille salariale ou politique de rémunération",
    "Documenter les règles de rémunération et les avantages."
  ],

  [
    "S-HR-001",
    24,
    "S",
    "Droits humains",
    "Diligence raisonnable",
    "Avez-vous identifié et géré les risques liés aux droits humains dans vos activités ?",
    1.5,
    true,
    "UN Guiding Principles",
    "Cartographie des risques droits humains",
    "Identifier les groupes exposés et les risques prioritaires."
  ],

  [
    "S-HR-002",
    25,
    "S",
    "Droits humains",
    "Travail des enfants et travail forcé",
    "Disposez-vous de mesures formelles de prévention du travail des enfants et du travail forcé ?",
    1.8,
    true,
    "ILO",
    "Politique et clauses fournisseurs",
    "Adopter immédiatement une interdiction formelle et des contrôles adaptés."
  ],

  [
    "S-COM-001",
    26,
    "S",
    "Communautés",
    "Impacts locaux",
    "Mesurez-vous les impacts de vos activités sur les communautés locales ?",
    1.2,
    false,
    "IFC Performance Standards",
    "Étude d’impact ou consultations",
    "Identifier les communautés concernées et les impacts principaux."
  ],

  [
    "S-GRM-001",
    27,
    "S",
    "Mécanismes de plainte",
    "Réclamations et remédiation",
    "Vos employés, clients, fournisseurs ou communautés peuvent-ils signaler une plainte ou un problème ?",
    1.4,
    true,
    "UN Guiding Principles",
    "Procédure et registre des plaintes",
    "Créer un canal simple, accessible et confidentiel."
  ],

  [
    "S-IMPACT-001",
    28,
    "S",
    "Impact social",
    "Résultats sociaux",
    "Mesurez-vous les résultats sociaux générés par votre activité ?",
    1.1,
    false,
    "GRI",
    "Cadre de résultats ou rapport d’impact",
    "Définir les bénéficiaires et les résultats sociaux mesurables."
  ],

  [
    "S-LOCAL-001",
    29,
    "S",
    "Développement local",
    "Emplois et compétences locales",
    "Votre organisation contribue-t-elle à la création d’emplois et au développement des compétences locales ?",
    0.9,
    false,
    "GRI",
    "Registre RH et données d’emplois locaux",
    "Mesurer les emplois locaux et les actions de formation."
  ],

  [
    "S-SUP-001",
    30,
    "S",
    "Chaîne d’approvisionnement",
    "Critères sociaux fournisseurs",
    "Vos fournisseurs sont-ils évalués sur les critères sociaux et humains ?",
    1.3,
    true,
    "OECD Guidelines",
    "Questionnaire ou audit social fournisseur",
    "Identifier les fournisseurs présentant les risques sociaux les plus élevés."
  ],


  /*
   * GOUVERNANCE
   */

  [
    "G-LEGAL-001",
    31,
    "G",
    "Structure juridique",
    "Conformité juridique",
    "Votre organisation possède-t-elle une structure juridique claire et conforme ?",
    1.5,
    true,
    "ISO 37301",
    "Statuts, registre et licences",
    "Vérifier immédiatement les documents légaux et licences essentielles."
  ],

  [
    "G-ROLE-001",
    32,
    "G",
    "Gouvernance",
    "Rôles et responsabilités",
    "Les rôles, responsabilités et pouvoirs de décision sont-ils clairement définis ?",
    1.1,
    false,
    "IFRS S1",
    "Organigramme et fiches de poste",
    "Documenter les rôles clés et les pouvoirs de décision."
  ],

  [
    "G-BOARD-001",
    33,
    "G",
    "Gouvernance",
    "Organe de supervision",
    "Existe-t-il un organe de supervision ou de gouvernance fonctionnel ?",
    1.3,
    false,
    "IFRS S1",
    "Statuts et procès-verbaux",
    "Mettre en place un organe de supervision adapté à la taille."
  ],

  [
    "G-FIN-001",
    34,
    "G",
    "Transparence financière",
    "Suivi des comptes",
    "Les comptes et informations financières sont-ils régulièrement suivis et documentés ?",
    1.3,
    false,
    "ISO 37301",
    "Comptes et rapports financiers",
    "Mettre en place un suivi comptable régulier et archiver les pièces."
  ],

  [
    "G-AUDIT-001",
    35,
    "G",
    "Contrôle interne",
    "Audits et contrôles",
    "Votre organisation réalise-t-elle des contrôles ou audits financiers ou organisationnels ?",
    1.2,
    false,
    "ISO 37301",
    "Rapports d’audit ou de contrôle",
    "Identifier les processus critiques et réaliser des contrôles simples."
  ],

  [
    "G-ABC-001",
    36,
    "G",
    "Éthique et intégrité",
    "Corruption et conflits d’intérêts",
    "Disposez-vous d’une politique ou de procédures contre la corruption et les conflits d’intérêts ?",
    1.6,
    true,
    "ISO 37001",
    "Politique anti-corruption",
    "Adopter immédiatement des règles contre la corruption et les conflits d’intérêts."
  ],

  [
    "G-RISK-001",
    37,
    "G",
    "Gestion des risques",
    "Cartographie des risques",
    "Avez-vous identifié et évalué les principaux risques de votre organisation ?",
    1.4,
    false,
    "IFRS S1",
    "Registre ou matrice des risques",
    "Créer un registre des risques avec impact, probabilité et responsable."
  ],

  [
    "G-COMP-001",
    38,
    "G",
    "Conformité",
    "Obligations réglementaires",
    "Suivez-vous régulièrement vos obligations légales, fiscales, sociales et réglementaires ?",
    1.6,
    true,
    "ISO 37301",
    "Registre de conformité",
    "Lister immédiatement les obligations et échéances essentielles."
  ],

  [
    "G-DATA-001",
    39,
    "G",
    "Données et cybersécurité",
    "Protection des données",
    "Disposez-vous de mesures pour protéger les données de vos employés, clients, partenaires et bénéficiaires ?",
    1.4,
    true,
    "Cadres africains de protection des données",
    "Politique de confidentialité et contrôles d’accès",
    "Identifier les données personnelles et limiter les accès."
  ],

  [
    "G-ETH-001",
    40,
    "G",
    "Éthique et intégrité",
    "Code de conduite",
    "Disposez-vous d’un code d’éthique ou de conduite ?",
    1.1,
    false,
    "ISO 37001",
    "Code de conduite",
    "Adopter un code simple couvrant intégrité, respect et responsabilités."
  ],

  [
    "G-CONFLICT-001",
    41,
    "G",
    "Éthique et intégrité",
    "Conflits d’intérêts",
    "Avez-vous une procédure pour déclarer et gérer les conflits d’intérêts ?",
    1.2,
    false,
    "ISO 37001",
    "Registre et déclarations d’intérêts",
    "Créer une déclaration simple et un registre des conflits."
  ],

  [
    "G-PROC-001",
    42,
    "G",
    "Achats responsables",
    "Transparence des achats",
    "Vos procédures d’achat sont-elles transparentes et documentées ?",
    1.3,
    false,
    "OECD Guidelines",
    "Procédure d’achat et comparatifs",
    "Formaliser les seuils, validations et pièces requises."
  ],

  [
    "G-DEC-001",
    43,
    "G",
    "Gouvernance",
    "Traçabilité des décisions",
    "Pouvez-vous démontrer comment les décisions importantes sont prises et documentées ?",
    1.1,
    false,
    "IFRS S1",
    "Procès-verbaux ou registre des décisions",
    "Créer un registre des décisions importantes."
  ],

  [
    "G-REPORT-001",
    44,
    "G",
    "Reporting ESG",
    "Système de reporting",
    "Disposez-vous d’un système de reporting ESG régulier ?",
    1.3,
    false,
    "GRI",
    "Rapport ou tableau de bord ESG",
    "Définir un calendrier et un responsable de collecte."
  ],

  [
    "G-TRANS-001",
    45,
    "G",
    "Transparence",
    "Communication ESG",
    "Communiquez-vous de manière transparente sur vos résultats, impacts, risques et engagements ESG ?",
    1.2,
    false,
    "GRI",
    "Rapport public ou présentation partenaire",
    "Communiquer uniquement les éléments vérifiables et préciser les limites."
  ],


  /*
   * ESG READINESS
   */

  [
    "R-PROOF-001",
    46,
    "R",
    "ESG Readiness",
    "Disponibilité des preuves",
    "Disposez-vous de documents permettant de démontrer vos pratiques ESG ?",
    1.4,
    false,
    "Méthode AfriGreen24",
    "Politiques, registres, contrats ou audits",
    "Lister et classer les preuves disponibles par thème ESG."
  ],

  [
    "R-DATA-001",
    47,
    "R",
    "ESG Readiness",
    "Données chiffrées",
    "Disposez-vous de données chiffrées permettant de mesurer votre performance ESG ?",
    1.4,
    false,
    "Méthode AfriGreen24",
    "Tableau de données ESG",
    "Sélectionner les données prioritaires et identifier leurs sources."
  ],

  [
    "R-KPI-001",
    48,
    "R",
    "ESG Readiness",
    "Indicateurs et objectifs",
    "Avez-vous défini des KPIs ESG avec des objectifs mesurables ?",
    1.3,
    false,
    "Méthode AfriGreen24",
    "Tableau de bord et objectifs",
    "Choisir huit à douze KPIs adaptés aux enjeux principaux."
  ],

  [
    "R-DISC-001",
    49,
    "R",
    "ESG Readiness",
    "Communication aux partenaires",
    "Avez-vous déjà communiqué vos résultats ESG à des partenaires, investisseurs ou financeurs ?",
    1.1,
    false,
    "IFRS S1",
    "Rapport ou questionnaire transmis",
    "Préparer une fiche ESG synthétique avec données et limites."
  ],

  [
    "R-PLAN-001",
    50,
    "R",
    "ESG Readiness",
    "Amélioration continue",
    "Votre organisation révise-t-elle régulièrement ses performances ESG et met-elle en œuvre des actions correctives ?",
    1.5,
    false,
    "ISO 14001",
    "Plan d’action et revue de direction",
    "Créer un plan d’action avec priorités, responsables et échéances."
  ]
];


var ESG_QUESTIONS =
  ESG_QUESTION_ROWS.map(
    function(row) {
      return creerQuestionESGDepuisLigne_(row);
    }
  );


function creerQuestionESGDepuisLigne_(row) {
  var critique = row[7] === true;

  return {
    question_id: row[0],
    version: ESG_CONFIG.version,
    status: "active",
    language: "fr",

    module: "ESG_STANDARD_V1",
    questionnaire_level: "standard",

    number: row[1],
    pillar: row[2],

    theme: row[3],
    subtheme: row[4],

    sector: [
      "all"
    ],

    organization_type: [
      "all"
    ],

    country_or_region: [
      "Africa"
    ],

    organization_size: [
      "all"
    ],

    question_text: row[5],

    simple_explanation:
      "Cette question évalue le niveau de maturité de l’organisation sur le thème : " +
      row[3] +
      ".",

    control_objective:
      "Évaluer l’existence, la formalisation, le suivi et l’amélioration du dispositif.",

    risk_evaluated:
      "Risque insuffisamment identifié ou maîtrisé dans le domaine " +
      row[3] +
      ".",

    response_type: "maturity_scale",

    responses_key: "MATURITY_0_5",

    weight: row[6],

    mandatory: true,

    critical: critique,

    critical_rule: {
      trigger_values:
        critique
          ? [
              0,
              1
            ]
          : [],

      severity:
        critique
          ? obtenirGraviteQuestionCritique_(row[0])
          : "none",

      requires_human_review:
        critique
    },

    conditional_rule: null,

    evidence_required: true,

    accepted_evidence_examples: [
      row[9]
    ],

    primary_standard: row[8],

    associated_indicator:
      obtenirIndicateurQuestionESG_(row[0]),

    reference_period:
      "12_months",

    recommendations: {
      immediate: [
        row[10]
      ],

      short_term_3_6_months: [
        "Formaliser le dispositif relatif au thème « " +
        row[3] +
        " », attribuer un responsable et conserver les preuves."
      ],

      structural_6_24_months: [
        "Définir des indicateurs, fixer des objectifs mesurables et améliorer continuellement le dispositif."
      ]
    },

    priority:
      critique
        ? "critical"
        : row[6] >= 1.4
          ? "high"
          : "medium",

    difficulty_level:
      "moderate",

    estimated_response_time_minutes:
      1
  };
}


function obtenirGraviteQuestionCritique_(questionId) {
  var tresCritiques = {
    "S-HR-002": true,
    "G-LEGAL-001": true,
    "G-COMP-001": true
  };

  return tresCritiques[questionId]
    ? "critical"
    : "high";
}


function obtenirIndicateurQuestionESG_(questionId) {
  var indicateurs = {
    "E-GHG-001": "E-GHG-001",
    "E-ENER-001": "E-ENE-001",
    "E-ENER-002": "E-ENE-002",
    "E-WATER-001": "E-WAT-001",
    "E-WASTE-001": "E-WST-001",

    "S-OHS-002": "S-OHS-001",
    "S-TRN-001": "S-TRN-001",
    "S-GEN-001": "S-GEN-001",
    "S-GRM-001": "S-GRM-001",
    "S-LOCAL-001": "S-LOC-001",

    "G-ABC-001": "G-ABC-001",
    "G-DATA-001": "G-DATA-001",

    "R-PROOF-001": "R-PROOF-001",
    "R-DATA-001": "R-DATA-001",
    "R-KPI-001": "R-TARG-001"
  };

  return indicateurs[questionId] || null;
}


function obtenirConfigurationESG() {
  return clonerObjetESG_(ESG_CONFIG);
}


function obtenirChampsProfilESG() {
  return clonerObjetESG_(
    ESG_PROFILE_FIELDS
  );
}


function obtenirOptionsMaturiteESG(
  inclureOptionsSpeciales
) {
  var options =
    ESG_MATURITY_OPTIONS.slice();

  if (inclureOptionsSpeciales === true) {
    options =
      options.concat(
        ESG_SPECIAL_OPTIONS
      );
  }

  return clonerObjetESG_(options);
}


function obtenirQuestionsESG() {
  return ESG_QUESTIONS
    .filter(
      function(question) {
        return question.status === "active";
      }
    )
    .map(
      function(question) {
        return clonerObjetESG_(question);
      }
    );
}


function obtenirQuestionsESGParPilier(
  pilier
) {
  var codePilier =
    String(
      pilier || ""
    ).toUpperCase();

  return obtenirQuestionsESG()
    .filter(
      function(question) {
        return question.pillar === codePilier;
      }
    );
}


function obtenirQuestionESGParId(
  questionId
) {
  var id =
    String(
      questionId || ""
    ).trim();

  for (
    var index = 0;
    index < ESG_QUESTIONS.length;
    index++
  ) {
    if (
      ESG_QUESTIONS[index].question_id === id
    ) {
      return clonerObjetESG_(
        ESG_QUESTIONS[index]
      );
    }
  }

  return null;
}


function obtenirQuestionnaireESG() {
  return {
    success: true,

    config:
      obtenirConfigurationESG(),

    profileFields:
      obtenirChampsProfilESG(),

    maturityOptions:
      obtenirOptionsMaturiteESG(false),

    specialOptions:
      ESG_SPECIAL_OPTIONS,

    questions:
      obtenirQuestionsESG()
  };
}


function obtenirResumeBaseESG() {
  var resume = {
    total: 0,
    E: 0,
    S: 0,
    G: 0,
    R: 0,
    critiques: 0,
    poidsTotal: 0
  };

  obtenirQuestionsESG()
    .forEach(
      function(question) {
        resume.total++;

        resume[
          question.pillar
        ]++;

        resume.poidsTotal +=
          Number(
            question.weight || 0
          );

        if (
          question.critical === true
        ) {
          resume.critiques++;
        }
      }
    );

  resume.poidsTotal =
    Math.round(
      resume.poidsTotal * 100
    ) / 100;

  return resume;
}


function validerBaseQuestionsESG() {
  var erreurs = [];
  var ids = {};
  var numeros = {};

  var piliersAutorises = {
    E: true,
    S: true,
    G: true,
    R: true
  };

  ESG_QUESTIONS.forEach(
    function(question, index) {
      var position =
        index + 1;

      if (!question.question_id) {
        erreurs.push(
          "Identifiant manquant à la position " +
          position +
          "."
        );
      }

      if (
        ids[
          question.question_id
        ]
      ) {
        erreurs.push(
          "Identifiant dupliqué : " +
          question.question_id +
          "."
        );
      }

      ids[
        question.question_id
      ] = true;

      if (!question.number) {
        erreurs.push(
          "Numéro manquant pour " +
          question.question_id +
          "."
        );
      }

      if (
        numeros[
          question.number
        ]
      ) {
        erreurs.push(
          "Numéro dupliqué : " +
          question.number +
          "."
        );
      }

      numeros[
        question.number
      ] = true;

      if (
        !piliersAutorises[
          question.pillar
        ]
      ) {
        erreurs.push(
          "Pilier invalide pour " +
          question.question_id +
          "."
        );
      }

      if (!question.question_text) {
        erreurs.push(
          "Texte manquant pour " +
          question.question_id +
          "."
        );
      }

      if (
        typeof question.weight !==
          "number" ||
        question.weight <= 0
      ) {
        erreurs.push(
          "Poids invalide pour " +
          question.question_id +
          "."
        );
      }
    }
  );

  var resume =
    obtenirResumeBaseESG();

  if (resume.total !== 50) {
    erreurs.push(
      "La base doit contenir 50 questions. Total actuel : " +
      resume.total +
      "."
    );
  }

  if (resume.E !== 15) {
    erreurs.push(
      "Le pilier Environnement doit contenir 15 questions."
    );
  }

  if (resume.S !== 15) {
    erreurs.push(
      "Le pilier Social doit contenir 15 questions."
    );
  }

  if (resume.G !== 15) {
    erreurs.push(
      "Le pilier Gouvernance doit contenir 15 questions."
    );
  }

  if (resume.R !== 5) {
    erreurs.push(
      "Le pilier Readiness doit contenir 5 questions."
    );
  }

  return {
    success:
      erreurs.length === 0,

    version:
      ESG_CONFIG.version,

    resume:
      resume,

    erreurs:
      erreurs
  };
}


function clonerObjetESG_(objet) {
  return JSON.parse(
    JSON.stringify(objet)
  );
}


function testerBaseQuestionsESG() {
  var resultat =
    validerBaseQuestionsESG();

  Logger.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );

  if (!resultat.success) {
    throw new Error(
      "La base ESG contient des erreurs : " +
      resultat.erreurs.join(" | ")
    );
  }

  return resultat;
}