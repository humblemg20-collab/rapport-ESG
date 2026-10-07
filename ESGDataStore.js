/**
 * AfriGreen24 — ESG Intelligence Score & Report
 * Stockage automatique dans Google Sheets
 * Version 1.0.0
 *
 * Dépendances :
 * - ESGQuestions.gs
 * - ESGScoring.gs
 * - ESGCriticalAlerts.gs
 * - ESGRecommendations.gs
 * - ESGReportGenerator.gs
 */
/**
 * Entêtes Reponses_Digitales.
 */
function obtenirEntetesReponsesDigitales_() {
  return [
    "Diagnostic ID",
    "Date",
    "Organisation",
    "Question ID",
    "Question",
    "Type de réponse",
    "Réponse",
    "Volet analysé"
  ];
}


/**
 * Entêtes Consentements.
 */
function obtenirEntetesConsentements_() {
  return [
    "Diagnostic ID",
    "Date",
    "Organisation",
    "Email",
    "Consentement diagnostic ESG",
    "Notice de confidentialité acceptée",
    "Communication AfriGreen24",
    "Solutions Humble Digital"
  ];
}

var ESG_DATASTORE_CONFIG = {
  spreadsheetName:
    "AfriGreen24 - Base ESG",

  sheets: {
  diagnostics:
    "Diagnostics_ESG",

  responses:
    "Reponses_ESG",

  alerts:
    "Alertes_ESG",

  priorities:
    "Priorites_ESG",

  digitalResponses:
    "Reponses_Digitales",

  consents:
    "Consentements"
}
};


/**
 * Retourne ou crée la base Google Sheets ESG.
 */
function obtenirOuCreerBaseESG() {
  var proprietes =
    PropertiesService
      .getScriptProperties();

  var spreadsheetId =
    proprietes.getProperty(
      "ESG_SPREADSHEET_ID"
    );

  var classeur = null;

  if (spreadsheetId) {
    try {
      classeur =
        SpreadsheetApp.openById(
          spreadsheetId
        );
    } catch (erreur) {
      console.log(
        "Ancienne base ESG inaccessible : " +
        erreur.message
      );
    }
  }

  if (!classeur) {
    classeur =
      SpreadsheetApp.create(
        ESG_DATASTORE_CONFIG
          .spreadsheetName
      );

    proprietes.setProperty(
      "ESG_SPREADSHEET_ID",
      classeur.getId()
    );
  }

  initialiserFeuillesESG_(
    classeur
  );

  return classeur;
}


/**
 * Initialise les feuilles nécessaires.
 */
/**
 * Initialise toutes les feuilles nécessaires
 * dans la base Google Sheets AfriGreen24.
 */
function initialiserFeuillesESG_(
  classeur
) {
  if (!classeur) {
    throw new Error(
      "Le classeur Google Sheets est absent."
    );
  }

  // 1. Résumé général de chaque diagnostic ESG.
  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_CONFIG
      .sheets
      .diagnostics,
    obtenirEntetesDiagnosticsESG_()
  );

  // 2. Réponses individuelles aux questions ESG.
  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_CONFIG
      .sheets
      .responses,
    obtenirEntetesReponsesESG_()
  );

  // 3. Alertes critiques détectées.
  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_CONFIG
      .sheets
      .alerts,
    obtenirEntetesAlertesESG_()
  );

  // 4. Priorités et plan d’action ESG.
  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_CONFIG
      .sheets
      .priorities,
    obtenirEntetesPrioritesESG_()
  );

  // 5. Réponses au questionnaire numérique.
  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_CONFIG
      .sheets
      .digitalResponses,
    obtenirEntetesReponsesDigitales_()
  );

  // 6. Consentements donnés par l’utilisateur.
  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_CONFIG
      .sheets
      .consents,
    obtenirEntetesConsentements_()
  );
}


/**
 * Retourne ou crée une feuille.
 */
function obtenirOuCreerFeuilleESG_(
  classeur,
  nom,
  entetes
) {
  var feuille =
    classeur.getSheetByName(
      nom
    );

  if (!feuille) {
    feuille =
      classeur.insertSheet(
        nom
      );
  }

  if (
    feuille.getLastRow() === 0
  ) {
    feuille
      .getRange(
        1,
        1,
        1,
        entetes.length
      )
      .setValues([
        entetes
      ]);

    styliserEntetesFeuilleESG_(
      feuille,
      entetes.length
    );

    feuille.setFrozenRows(
      1
    );
  }

  return feuille;
}


/**
 * Enregistre un rapport ESG complet.
 *
 * @param {Object} profil
 * @param {Object} reponses
 * @param {Object} rapport
 * @return {Object}
 */
function enregistrerRapportESGDansBase(
  profil,
  reponses,
  rapport
) {
  if (
    !rapport ||
    rapport.success !== true
  ) {
    throw new Error(
      "Le rapport ESG est invalide."
    );
  }

  var classeur =
    obtenirOuCreerBaseESG();

  var diagnostic =
    rapport.diagnostic;

  var recommandations =
    rapport.recommandations;

  var diagnosticId =
    rapport.reportId ||
    creerIdentifiantEnregistrementESG_();

  enregistrerDiagnosticESG_(
    classeur,
    diagnosticId,
    profil,
    rapport,
    diagnostic,
    recommandations
  );

  enregistrerReponsesESG_(
    classeur,
    diagnosticId,
    profil,
    reponses,
    diagnostic
  );

  enregistrerAlertesESG_(
    classeur,
    diagnosticId,
    profil,
    diagnostic
  );

  enregistrerPrioritesESG_(
    classeur,
    diagnosticId,
    profil,
    recommandations
  );

  return {
    success: true,

    diagnosticId:
      diagnosticId,

    spreadsheetId:
      classeur.getId(),

    spreadsheetUrl:
      classeur.getUrl(),

    sheets: {
      diagnostics:
        ESG_DATASTORE_CONFIG
          .sheets
          .diagnostics,

      responses:
        ESG_DATASTORE_CONFIG
          .sheets
          .responses,

      alerts:
        ESG_DATASTORE_CONFIG
          .sheets
          .alerts,

      priorities:
        ESG_DATASTORE_CONFIG
          .sheets
          .priorities
    }
  };
}


/**
 * Enregistre la ligne principale du diagnostic.
 */
function enregistrerDiagnosticESG_(
  classeur,
  diagnosticId,
  profil,
  rapport,
  diagnostic,
  recommandations
) {
  var feuille =
    classeur.getSheetByName(
      ESG_DATASTORE_CONFIG
        .sheets
        .diagnostics
    );

  var priorite =
    recommandations
      .prioritePrincipale || {};

  var ligne = [
    diagnosticId,

    new Date(),

    obtenirChampProfilESG_(
      profil,
      [
        "organizationName",
        "nomOrganisation"
      ]
    ),

    obtenirChampProfilESG_(
      profil,
      [
        "responsibleName",
        "nomResponsable"
      ]
    ),

    obtenirChampProfilESG_(
      profil,
      [
        "professionalEmail",
        "email"
      ]
    ),

    obtenirChampProfilESG_(
      profil,
      [
        "phone",
        "telephone"
      ]
    ),

    obtenirChampProfilESG_(
      profil,
      [
        "mainCountry",
        "pays"
      ]
    ),

    obtenirChampProfilESG_(
      profil,
      [
        "organizationType",
        "typeOrganisation"
      ]
    ),

    obtenirChampProfilESG_(
      profil,
      [
        "mainSector",
        "secteur"
      ]
    ),

    obtenirChampProfilESG_(
      profil,
      [
        "employeeCount",
        "effectif"
      ]
    ),

    diagnostic
      .scores
      .environnement,

    diagnostic
      .scores
      .social,

    diagnostic
      .scores
      .gouvernance,

    diagnostic
      .scores
      .readiness,

    diagnostic
      .scores
      .globalBrut,

    diagnostic
      .scores
      .globalAjuste,

    diagnostic
      .maturite
      .label,

    diagnostic
      .risque
      .label,

    diagnostic
      .scores
      .preuves,

    diagnostic
      .scores
      .qualiteDonnees,

    diagnostic
      .scores
      .niveauConfiance,

    obtenirNombreAlertesDataStoreESG_(
      diagnostic
    ),

    diagnostic
      .nombreDonneesManquantes ||
    0,

    priorite.title || "",

    priorite.action || "",

    rapport.documentId || "",

    rapport.docUrl ||
    rapport.documentUrl ||
    "",

    rapport.pdfId || "",

    rapport.pdfUrl || "",

    rapport.pdfDownloadUrl ||
    rapport.downloadUrl ||
    "",

    rapport.folderUrl || ""
  ];

  feuille.appendRow(
    ligne
  );
}


/**
 * Enregistre les réponses individuelles.
 */
function enregistrerReponsesESG_(
  classeur,
  diagnosticId,
  profil,
  reponses,
  diagnostic
) {
  var feuille =
    classeur.getSheetByName(
      ESG_DATASTORE_CONFIG
        .sheets
        .responses
    );

  var organisation =
    obtenirChampProfilESG_(
      profil,
      [
        "organizationName",
        "nomOrganisation"
      ]
    );

  var lignes = [];

  diagnostic
    .resultatsQuestions
    .forEach(
      function(resultat) {
        var reponseBrute =
          reponses[
            resultat.questionId
          ];

        lignes.push([
          diagnosticId,

          new Date(),

          organisation,

          resultat.questionId,

          resultat.numero,

          resultat.pilier,

          resultat.theme,

          resultat.subtheme,

          resultat.question,

          convertirValeurFeuilleESG_(
            resultat.valeur
          ),

          resultat.score,

          resultat.poids,

          resultat.scorePondere,

          resultat.niveauPreuve,

          resultat.scorePreuve,

          resultat.critique
            ? "Oui"
            : "Non",

          resultat.nonApplicable
            ? "Oui"
            : "Non",

          resultat.reponseManquante
            ? "Oui"
            : "Non",

          resultat.commentaire || "",

          reponseBrute
            ? JSON.stringify(
                reponseBrute
              )
            : ""
        ]);
      }
    );

  ajouterLignesEnLotESG_(
    feuille,
    lignes
  );
}


/**
 * Enregistre les alertes.
 */
function enregistrerAlertesESG_(
  classeur,
  diagnosticId,
  profil,
  diagnostic
) {
  var feuille =
    classeur.getSheetByName(
      ESG_DATASTORE_CONFIG
        .sheets
        .alerts
    );

  var organisation =
    obtenirChampProfilESG_(
      profil,
      [
        "organizationName",
        "nomOrganisation"
      ]
    );

  var alertes =
    diagnostic.alertesAvancees ||
    diagnostic.alertesCritiques ||
    [];

  var lignes = [];

  alertes.forEach(
    function(alerte) {
      lignes.push([
        diagnosticId,

        new Date(),

        organisation,

        alerte.alertId ||
        alerte.code ||
        "",

        alerte.ruleCode ||
        alerte.code ||
        "",

        alerte.questionId || "",

        alerte.pillar ||
        alerte.pilier ||
        "",

        alerte.theme || "",

        alerte.title || "",

        alerte.severity ||
        alerte.gravite ||
        "",

        alerte.score,

        alerte.message || "",

        alerte.immediateAction ||
        alerte.recommandation ||
        "",

        Array.isArray(
          alerte.evidenceRequired
        )
          ? alerte
              .evidenceRequired
              .join(", ")
          : "",

        alerte.validationHumaineRecommandee
          ? "Oui"
          : "Non",

        alerte.status ||
        "OPEN"
      ]);
    }
  );

  ajouterLignesEnLotESG_(
    feuille,
    lignes
  );
}


/**
 * Enregistre les priorités et actions.
 */
function enregistrerPrioritesESG_(
  classeur,
  diagnosticId,
  profil,
  recommandations
) {
  var feuille =
    classeur.getSheetByName(
      ESG_DATASTORE_CONFIG
        .sheets
        .priorities
    );

  var organisation =
    obtenirChampProfilESG_(
      profil,
      [
        "organizationName",
        "nomOrganisation"
      ]
    );

  var lignes = [];

  var plans = [
    {
      horizon:
        "0-3 mois",

      actions:
        recommandations
          .planAction
          .immediate_0_3_months
    },

    {
      horizon:
        "3-6 mois",

      actions:
        recommandations
          .planAction
          .short_term_3_6_months
    },

    {
      horizon:
        "6-24 mois",

      actions:
        recommandations
          .planAction
          .structural_6_24_months
    }
  ];

  plans.forEach(
    function(plan) {
      var actions =
        plan.actions || [];

      actions.forEach(
        function(action) {
          lignes.push([
            diagnosticId,

            new Date(),

            organisation,

            action.actionId || "",

            action.questionId || "",

            action.pilier || "",

            action.theme || "",

            plan.horizon,

            action.criticite || "",

            action.scoreActuel,

            action.action || "",

            action.responsableSuggere ||
            "",

            action.echeanceSuggeree ||
            "",

            action.preuveDeRealisation ||
            "",

            action.indicateurDeSuivi ||
            "",

            "À démarrer"
          ]);
        }
      );
    }
  );

  ajouterLignesEnLotESG_(
    feuille,
    lignes
  );
}


/**
 * Ajoute plusieurs lignes en une seule opération.
 */
function ajouterLignesEnLotESG_(
  feuille,
  lignes
) {
  if (
    !lignes ||
    lignes.length === 0
  ) {
    return;
  }

  feuille
    .getRange(
      feuille.getLastRow() + 1,
      1,
      lignes.length,
      lignes[0].length
    )
    .setValues(
      lignes
    );
}


/**
 * Entêtes Diagnostics_ESG.
 */
function obtenirEntetesDiagnosticsESG_() {
  return [
    "Diagnostic ID",
    "Date",
    "Organisation",
    "Responsable",
    "Email",
    "Téléphone",
    "Pays",
    "Type d’organisation",
    "Secteur",
    "Effectif",
    "Score Environnement",
    "Score Social",
    "Score Gouvernance",
    "Score Readiness",
    "Score global brut",
    "Score global ajusté",
    "Maturité ESG",
    "Niveau de risque",
    "Score preuves",
    "Qualité des données",
    "Niveau de confiance",
    "Nombre d’alertes",
    "Données manquantes",
    "Priorité principale",
    "Action prioritaire",
    "Document ID",
    "Google Docs URL",
    "PDF ID",
    "PDF URL",
    "PDF téléchargement",
    "Dossier Drive"
  ];
}


/**
 * Entêtes Reponses_ESG.
 */
function obtenirEntetesReponsesESG_() {
  return [
    "Diagnostic ID",
    "Date",
    "Organisation",
    "Question ID",
    "Numéro",
    "Pilier",
    "Thème",
    "Sous-thème",
    "Question",
    "Valeur",
    "Score",
    "Poids",
    "Score pondéré",
    "Niveau de preuve",
    "Score preuve",
    "Question critique",
    "Non applicable",
    "Réponse manquante",
    "Commentaire",
    "Réponse JSON"
  ];
}


/**
 * Entêtes Alertes_ESG.
 */
function obtenirEntetesAlertesESG_() {
  return [
    "Diagnostic ID",
    "Date",
    "Organisation",
    "Alerte ID",
    "Code règle",
    "Question ID",
    "Pilier",
    "Thème",
    "Titre",
    "Gravité",
    "Score",
    "Message",
    "Action immédiate",
    "Preuves requises",
    "Validation humaine",
    "Statut"
  ];
}


/**
 * Entêtes Priorites_ESG.
 */
function obtenirEntetesPrioritesESG_() {
  return [
    "Diagnostic ID",
    "Date",
    "Organisation",
    "Action ID",
    "Question ID",
    "Pilier",
    "Thème",
    "Horizon",
    "Criticité",
    "Score actuel",
    "Action",
    "Responsable",
    "Échéance",
    "Preuve de réalisation",
    "Indicateur",
    "Statut"
  ];
}


/**
 * Style des entêtes.
 */
function styliserEntetesFeuilleESG_(
  feuille,
  nombreColonnes
) {
  var plage =
    feuille.getRange(
      1,
      1,
      1,
      nombreColonnes
    );

  plage
    .setBackground(
      "#176B4D"
    )
    .setFontColor(
      "#FFFFFF"
    )
    .setFontWeight(
      "bold"
    )
    .setHorizontalAlignment(
      "center"
    );

  feuille.autoResizeColumns(
    1,
    nombreColonnes
  );
}


/**
 * Retourne une valeur du profil.
 */
function obtenirChampProfilESG_(
  profil,
  cles
) {
  for (
    var index = 0;
    index < cles.length;
    index++
  ) {
    var valeur =
      profil[
        cles[index]
      ];

    if (
      valeur !== undefined &&
      valeur !== null &&
      valeur !== ""
    ) {
      if (
        Array.isArray(
          valeur
        )
      ) {
        return valeur.join(
          ", "
        );
      }

      return valeur;
    }
  }

  return "";
}


/**
 * Valeur adaptée à Google Sheets.
 */
function convertirValeurFeuilleESG_(
  valeur
) {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return "";
  }

  return valeur;
}


/**
 * Nombre d’alertes.
 */
function obtenirNombreAlertesDataStoreESG_(
  diagnostic
) {
  if (
    diagnostic.alertesAvancees
  ) {
    return diagnostic
      .alertesAvancees
      .length;
  }

  if (
    diagnostic.alertesCritiques
  ) {
    return diagnostic
      .alertesCritiques
      .length;
  }

  return 0;
}


/**
 * Identifiant de secours.
 */
function creerIdentifiantEnregistrementESG_() {
  return (
    "ESG-DATA-" +
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyyMMdd-HHmmss"
    )
  );
}


/**
 * Génère le rapport puis l’enregistre dans Sheets.
 */
function genererEtEnregistrerRapportESG(
  profil,
  reponses
) {
  var rapport =
    genererRapportESG(
      profil,
      reponses
    );

  var stockage =
    enregistrerRapportESGDansBase(
      profil,
      reponses,
      rapport
    );

  rapport.spreadsheetId =
    stockage.spreadsheetId;

  rapport.spreadsheetUrl =
    stockage.spreadsheetUrl;

  rapport.dataStore =
    stockage;

  return rapport;
}


/**
 * Test complet :
 * Google Docs + PDF + Google Sheets.
 */
function testerStockageRapportESG() {
  var profilTest = {
    organizationName:
      "AfriGreen Solutions",

    responsibleName:
      "Responsable ESG",

    professionalEmail:
      "contact@example.com",

    phone:
      "+237 600 000 000",

    mainCountry:
      "Cameroun",

    organizationType:
      "PME",

    mainSector:
      "Énergie renouvelable",

    employeeCount:
      24,

    diagnosticPurpose: [
      "Améliorer notre gestion",
      "Rechercher un financement"
    ]
  };

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

  reponsesTest[
    "S-HR-002"
  ] = {
    value: 0,
    evidenceLevel: "NONE",
    comment:
      "Aucune politique formelle."
  };

  reponsesTest[
    "G-COMP-001"
  ] = {
    value: 1,
    evidenceLevel: "DECLARATIVE"
  };

  var resultat =
    genererEtEnregistrerRapportESG(
      profilTest,
      reponsesTest
    );

  Logger.log(
    JSON.stringify(
      {
        success:
          resultat.success,

        reportId:
          resultat.reportId,

        docUrl:
          resultat.docUrl,

        pdfUrl:
          resultat.pdfUrl,

        spreadsheetUrl:
          resultat.spreadsheetUrl
      },
      null,
      2
    )
  );

  return resultat;
}
/**
 * Teste uniquement la création et l'initialisation
 * de la base Google Sheets AfriGreen24.
 */
function testerInitialisationBaseESG() {
  var classeur =
    obtenirOuCreerBaseESG();

  Logger.log(
    "Base initialisée : " +
    classeur.getUrl()
  );

  return classeur.getUrl();
}