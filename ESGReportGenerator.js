/**
 * AfriGreen24 — ESG Intelligence Score & Report
 * Générateur automatique Google Docs + PDF
 * Version 1.0.0
 *
 * Dépendances :
 * - ESGQuestions.gs
 * - ESGScoring.gs
 * - ESGCriticalAlerts.gs
 * - ESGRecommendations.gs
 */


/**
 * Configuration du rapport ESG.
 */
var ESG_REPORT_CONFIG = {
  folderName:
    "AfriGreen24 - Rapports ESG",

  title:
    "RAPPORT DE DIAGNOSTIC ESG",

  subtitle:
    "ESG Intelligence Score & Report",

  brandName:
    "",

  primaryColor:
    "#176B4D",

  secondaryColor:
    "#E9F5EF",

  darkColor:
    "#1F2937",

  lightGrey:
    "#F3F4F6",

  warningColor:
    "#B45309",

  criticalColor:
    "#B91C1C",

  footerText:
    "Rapport ESG",

  disclaimer:
    "Ce rapport constitue un diagnostic indicatif fondé sur les informations déclarées par l’organisation. Il ne constitue ni une certification ESG, ni un audit indépendant, ni une garantie d’accès au financement."
};


/**
 * Fonction principale.
 *
 * @param {Object} profil
 * @param {Object} reponses
 * @return {Object}
 */
function genererRapportESG(
  profil,
  reponses,
  diagnosticDigital
) {
  profil = profil || {};
  reponses = reponses || {};
  diagnosticDigital =
    diagnosticDigital || null;

  verifierProfilRapportESG_(
    profil
  );

  var analyseComplete =
    executerDiagnosticEtRecommandationsESG(
      reponses
    );

  var diagnostic =
    analyseComplete.diagnostic;

  var recommandations =
    analyseComplete.recommandations;

  var identifiantRapport =
    creerIdentifiantRapportESG_();

  var nomOrganisation =
    nettoyerNomFichierESG_(
      profil.organizationName ||
      profil.nomOrganisation ||
      "Organisation"
    );

  var nomDocument =
    "Rapport ESG - " +
    nomOrganisation +
    " - " +
    identifiantRapport;

  var dossier =
    obtenirOuCreerDossierRapportsESG_();

  var document =
    DocumentApp.create(
      nomDocument
    );

  var documentId =
    document.getId();

  var fichierDocument =
    DriveApp.getFileById(
      documentId
    );

  dossier.addFile(
    fichierDocument
  );

  retirerFichierDeRacineESG_(
    fichierDocument
  );

  var corps =
    document.getBody();

  configurerDocumentESG_(
    corps
  );

  ajouterPageCouvertureESG_(
    corps,
    profil,
    diagnostic,
    identifiantRapport
  );

  ajouterSommaireESG_(
    corps
  );

  ajouterResumeExecutifESG_(
    corps,
    profil,
    diagnostic,
    recommandations
  );

  ajouterProfilOrganisationESG_(
    corps,
    profil
  );

  ajouterScoresESG_(
    corps,
    diagnostic
  );

  ajouterAnalysePilierESG_(
    corps,
    diagnostic,
    "E"
  );

  ajouterAnalysePilierESG_(
    corps,
    diagnostic,
    "S"
  );

  ajouterAnalysePilierESG_(
    corps,
    diagnostic,
    "G"
  );

  ajouterAnalysePilierESG_(
    corps,
    diagnostic,
    "R"
  );

  ajouterAlertesCritiquesRapportESG_(
    corps,
    diagnostic
  );

  ajouterForcesESG_(
    corps,
    recommandations
  );

  ajouterFaiblessesESG_(
    corps,
    recommandations
  );

  ajouterConfianceEtLimitesESG_(
    corps,
    diagnostic
  );

  ajouterSectionTransparenceNumeriqueESG_(
    corps,
    diagnosticDigital
  );

  ajouterConclusionInstitutionnelleESG_(
    corps,
    profil,
    diagnostic
  );

  ajouterPiedDePageESG_(
    document,
    identifiantRapport,
    profil
  );

  document.saveAndClose();

  Utilities.sleep(
    1500
  );

  var pdf =
    creerPDFFromDocumentESG_(
      documentId,
      nomDocument,
      dossier
    );

  var docUrl =
    "https://docs.google.com/document/d/" +
    documentId +
    "/edit";

  essayerPartagerRapportESG_(
    documentId,
    pdf.id
  );

  return {
    success: true,

    reportId:
      identifiantRapport,

    documentId:
      documentId,

    docId:
      documentId,

    documentUrl:
      docUrl,

    docUrl:
      docUrl,

    url:
      docUrl,

    pdfId:
      pdf.id,

    pdfUrl:
      pdf.url,

    pdfLink:
      pdf.url,

    pdfDownloadUrl:
      pdf.downloadUrl,

    downloadUrl:
      pdf.downloadUrl,

    folderId:
      dossier.getId(),

    folderUrl:
      dossier.getUrl(),

    fileName:
      nomDocument,

    organisation:
      profil.organizationName ||
      profil.nomOrganisation ||
      "",

    scoreGlobal:
      diagnostic.scores.globalAjuste,

    maturite:
      diagnostic.maturite,

    risque:
      diagnostic.risque,

    diagnostic:
      diagnostic,

    recommandations:
      recommandations
  };
}


/**
 * Vérifie les informations minimales.
 */
function verifierProfilRapportESG_(
  profil
) {
  var organisation =
    profil.organizationName ||
    profil.nomOrganisation;

  if (!organisation) {
    throw new Error(
      "Le nom de l’organisation est obligatoire."
    );
  }
}


/**
 * Identifiant unique.
 */
function creerIdentifiantRapportESG_() {
  var date =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyyMMdd-HHmmss"
    );

  var suffixe =
    Math.floor(
      Math.random() * 900
    ) + 100;

  return (
    "ESG-" +
    date +
    "-" +
    suffixe
  );
}


/**
 * Nettoie le nom du fichier.
 */
function nettoyerNomFichierESG_(
  valeur
) {
  return String(
    valeur || ""
  )
    .replace(
      /[\\\/:*?"<>|#%{}]/g,
      "-"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .substring(
      0,
      80
    );
}


/**
 * Dossier de stockage.
 */
function obtenirOuCreerDossierRapportsESG_() {
  var dossiers =
    DriveApp.getFoldersByName(
      ESG_REPORT_CONFIG.folderName
    );

  if (
    dossiers.hasNext()
  ) {
    return dossiers.next();
  }

  return DriveApp.createFolder(
    ESG_REPORT_CONFIG.folderName
  );
}


/**
 * Retire le fichier de la racine lorsque possible.
 */
function retirerFichierDeRacineESG_(
  fichier
) {
  try {
    DriveApp
      .getRootFolder()
      .removeFile(
        fichier
      );
  } catch (erreur) {
    console.log(
      "Impossible de retirer le fichier de la racine : " +
      erreur.message
    );
  }
}


/**
 * Configuration globale du document.
 */
function configurerDocumentESG_(
  corps
) {
  corps.setMarginTop(
    50
  );

  corps.setMarginBottom(
    50
  );

  corps.setMarginLeft(
    55
  );

  corps.setMarginRight(
    55
  );

  corps.setPageWidth(
    595
  );

  corps.setPageHeight(
    842
  );
}


/**
 * Page de couverture.
 */
function ajouterPageCouvertureESG_(
  corps,
  profil,
  diagnostic,
  identifiantRapport
) {
  var espace =
    corps.appendParagraph(
      ""
    );

  espace.setSpacingAfter(
    45
  );

  var logoOrganisation =
    obtenirLogoBlobOrganisationESG_(
      profil
    );

  if (
    logoOrganisation
  ) {
    var logoParagraph =
      corps.appendParagraph(
        ""
      );

    logoParagraph
      .setAlignment(
        DocumentApp
          .HorizontalAlignment
          .CENTER
      );

    var logoImage =
      logoParagraph.appendInlineImage(
        logoOrganisation
      );

    var largeur =
      logoImage.getWidth();

    var hauteur =
      logoImage.getHeight();

    var maxWidth =
      140;

    var maxHeight =
      70;

    var ratio =
      Math.min(
        maxWidth / largeur,
        maxHeight / hauteur,
        1
      );

    logoImage
      .setWidth(
        Math.round(
          largeur * ratio
        )
      )
      .setHeight(
        Math.round(
          hauteur * ratio
        )
      );

    logoParagraph.setSpacingAfter(
      20
    );
  }

var titre =
    corps.appendParagraph(
      ESG_REPORT_CONFIG.title
    );

  titre
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setBold(
      true
    )
    .setFontSize(
      28
    )
    .setForegroundColor(
      ESG_REPORT_CONFIG
        .darkColor
    )
    .setSpacingBefore(
      50
    );


  var sousTitre =
    corps.appendParagraph(
      ESG_REPORT_CONFIG.subtitle
    );

  sousTitre
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setFontSize(
      15
    )
    .setForegroundColor(
      ESG_REPORT_CONFIG
        .primaryColor
    );


  var organisation =
    corps.appendParagraph(
      profil.organizationName ||
      profil.nomOrganisation ||
      ""
    );

  organisation
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setBold(
      true
    )
    .setFontSize(
      20
    )
    .setSpacingBefore(
      45
    );


  var tableauScore =
    corps.appendTable([
      [
        "SCORE ESG",
        "MATURITÉ",
        "NIVEAU DE RISQUE"
      ],
      [
        diagnostic
          .scores
          .globalAjuste +
          " / 100",

        diagnostic
          .maturite
          .label,

        diagnostic
          .risque
          .label
      ]
    ]);

  styliserTableauCouvertureESG_(
    tableauScore
  );


  var date =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
    );

  var informations =
    corps.appendParagraph(
      "\nDate du diagnostic : " +
      date +
      "\nRéférence : " +
      identifiantRapport
    );

  informations
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setFontSize(
      10
    )
    .setForegroundColor(
      "#6B7280"
    )
    .setSpacingBefore(
      35
    );


  var mention =
    corps.appendParagraph(
      ESG_REPORT_CONFIG.disclaimer
    );

  mention
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setFontSize(
      9
    )
    .setItalic(
      true
    )
    .setForegroundColor(
      "#6B7280"
    )
    .setSpacingBefore(
      40
    );


  corps.appendPageBreak();
}


/**
 * Style du tableau de couverture.
 */
function styliserTableauCouvertureESG_(
  tableau
) {
  tableau.setBorderWidth(
    1
  );

  var ligneEntete =
    tableau.getRow(
      0
    );

  var ligneValeur =
    tableau.getRow(
      1
    );

  for (
    var index = 0;
    index < 3;
    index++
  ) {
    ligneEntete
      .getCell(index)
      .setBackgroundColor(
        ESG_REPORT_CONFIG
          .primaryColor
      );

    ligneEntete
      .getCell(index)
      .getChild(0)
      .asParagraph()
      .setAlignment(
        DocumentApp
          .HorizontalAlignment
          .CENTER
      )
      .setBold(
        true
      )
      .setForegroundColor(
        "#FFFFFF"
      )
      .setFontSize(
        9
      );


    ligneValeur
      .getCell(index)
      .setBackgroundColor(
        ESG_REPORT_CONFIG
          .secondaryColor
      );

    ligneValeur
      .getCell(index)
      .getChild(0)
      .asParagraph()
      .setAlignment(
        DocumentApp
          .HorizontalAlignment
          .CENTER
      )
      .setBold(
        true
      )
      .setFontSize(
        12
      );
  }
}


/**
 * Sommaire simple.
 */
function ajouterSommaireESG_(
  corps
) {
  ajouterTitreSectionESG_(
    corps,
    "Sommaire"
  );

  var sections = [
    "1. Résumé exécutif",
    "2. Profil de l’organisation",
    "3. Score ESG global",
    "4. Analyse Environnement",
    "5. Analyse Sociale",
    "6. Analyse Gouvernance",
    "7. ESG Readiness",
    "8. Alertes critiques et risques prioritaires",
    "9. Forces et points de vigilance",
    "10. Niveau de confiance et limites",
    "11. Transparence et visibilité numérique ESG",
    "12. Conclusion"
  ];

  sections.forEach(
    function(section) {
      corps
        .appendParagraph(
          section
        )
        .setFontSize(
          11
        )
        .setSpacingAfter(
          5
        );
    }
  );

  corps.appendPageBreak();
}


/**
 * Résumé exécutif.
 */
function ajouterResumeExecutifESG_(
  corps,
  profil,
  diagnostic,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "1. Résumé exécutif"
  );

  ajouterParagrapheESG_(
    corps,
    recommandations
      .syntheseStrategique
  );

  ajouterSousTitreESG_(
    corps,
    "Résultats principaux"
  );

  var tableau =
    corps.appendTable([
      [
        "Indicateur",
        "Résultat"
      ],
      [
        "Score ESG ajusté",
        diagnostic
          .scores
          .globalAjuste +
          " / 100"
      ],
      [
        "Niveau de maturité",
        diagnostic
          .maturite
          .label
      ],
      [
        "Niveau de risque",
        diagnostic
          .risque
          .label
      ],
      [
        "Score de preuves",
        diagnostic
          .scores
          .preuves +
          " / 100"
      ],
      [
        "Qualité des données",
        diagnostic
          .scores
          .qualiteDonnees +
          " / 100"
      ],
      [
        "Niveau de confiance",
        diagnostic
          .scores
          .niveauConfiance +
          " / 100"
      ],
      [
        "Alertes détectées",
        String(
          obtenirNombreAlertesRapportESG_(
            diagnostic
          )
        )
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );
}


/**
 * Profil de l’organisation.
 */
function ajouterProfilOrganisationESG_(
  corps,
  profil
) {
  ajouterTitreSectionESG_(
    corps,
    "2. Profil de l’organisation"
  );

  var lignes = [
    [
      "Nom de l’organisation",
      obtenirValeurProfilESG_(
        profil,
        [
          "organizationName",
          "nomOrganisation"
        ]
      )
    ],
    [
      "Responsable",
      obtenirValeurProfilESG_(
        profil,
        [
          "responsibleName",
          "nomResponsable"
        ]
      )
    ],
    [
      "Email",
      obtenirValeurProfilESG_(
        profil,
        [
          "professionalEmail",
          "email"
        ]
      )
    ],
    [
      "Téléphone",
      obtenirValeurProfilESG_(
        profil,
        [
          "phone",
          "telephone"
        ]
      )
    ],
    [
      "Pays principal",
      obtenirValeurProfilESG_(
        profil,
        [
          "mainCountry",
          "pays"
        ]
      )
    ],
    [
      "Type d’organisation",
      obtenirValeurProfilESG_(
        profil,
        [
          "organizationType",
          "typeOrganisation"
        ]
      )
    ],
    [
      "Secteur principal",
      obtenirValeurProfilESG_(
        profil,
        [
          "mainSector",
          "secteur"
        ]
      )
    ],
    [
      "Effectif",
      obtenirValeurProfilESG_(
        profil,
        [
          "employeeCount",
          "effectif"
        ]
      )
    ],
    [
      "Zone d’intervention",
      obtenirValeurProfilESG_(
        profil,
        [
          "interventionZone",
          "zoneIntervention"
        ]
      )
    ],
    [
      "Objectif du diagnostic",
      obtenirValeurProfilESG_(
        profil,
        [
          "diagnosticPurpose",
          "objectifDiagnostic"
        ]
      )
    ]
  ];

  var tableau =
    corps.appendTable(
      [
        [
          "Information",
          "Valeur"
        ]
      ].concat(
        lignes
      )
    );

  styliserTableauStandardESG_(
    tableau
  );
}


/**
 * Score global.
 */
function ajouterScoresESG_(
  corps,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "3. Score ESG global"
  );

  ajouterParagrapheESG_(
    corps,
    "Le score global est calculé à partir des quatre dimensions du diagnostic : Environnement, Social, Gouvernance et ESG Readiness. Les scores ajustés tiennent compte des alertes critiques et des pénalités applicables."
  );

  var tableau =
    corps.appendTable([
      [
        "Dimension",
        "Score brut",
        "Score ajusté",
        "Poids"
      ],
      [
        "Environnement",
        diagnostic.piliers.E.scoreBrut + " / 100",
        diagnostic.piliers.E.scoreAjuste + " / 100",
        "30 %"
      ],
      [
        "Social",
        diagnostic.piliers.S.scoreBrut + " / 100",
        diagnostic.piliers.S.scoreAjuste + " / 100",
        "30 %"
      ],
      [
        "Gouvernance",
        diagnostic.piliers.G.scoreBrut + " / 100",
        diagnostic.piliers.G.scoreAjuste + " / 100",
        "30 %"
      ],
      [
        "ESG Readiness",
        diagnostic.piliers.R.scoreBrut + " / 100",
        diagnostic.piliers.R.scoreAjuste + " / 100",
        "10 %"
      ],
      [
        "SCORE GLOBAL",
        diagnostic.scores.globalBrut + " / 100",
        diagnostic.scores.globalAjuste + " / 100",
        "100 %"
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );

  ajouterEncadreESG_(
    corps,
    diagnostic.maturite.label,
    construireLectureFactuelleScoreESG_(
      diagnostic
    ),
    diagnostic.risque.code === "TRES_ELEVE" ||
    diagnostic.risque.code === "ELEVE"
      ? "CRITICAL"
      : "NORMAL"
  );
}


function construireLectureFactuelleScoreESG_(
  diagnostic
) {
  diagnostic = diagnostic || {};

  if (
    diagnostic.lectureScoreGlobalRedactionnelle
  ) {
    return String(
      diagnostic.lectureScoreGlobalRedactionnelle
    );
  }

  return (
    "Le diagnostic situe l’organisation au niveau « " +
    diagnostic.maturite.label +
    " », avec un score ESG ajusté de " +
    diagnostic.scores.globalAjuste +
    "/100 et un niveau de risque « " +
    diagnostic.risque.label +
    " »."
  );
}


/**
 * Analyse d’un pilier.
 */
function ajouterAnalysePilierESG_(
  corps,
  diagnostic,
  codePilier
) {
  var numeros = {
    E: "4",
    S: "5",
    G: "6",
    R: "7"
  };

  var pilier =
    diagnostic.piliers[
      codePilier
    ];

  ajouterTitreSectionESG_(
    corps,
    numeros[
      codePilier
    ] +
    ". Analyse " +
    pilier.label
  );

  var analyseRedactionnelle =
    String(
      pilier.analyseRedactionnelle ||
      ""
    ).trim();

  if (
    !analyseRedactionnelle
  ) {
    analyseRedactionnelle =
      "Le pilier " +
      pilier.label +
      " obtient un score ajusté de " +
      pilier.scoreAjuste +
      "/100. L’évaluation porte sur " +
      pilier.nombreRepondues +
      " réponse(s) renseignée(s), avec " +
      pilier.nombreManquantes +
      " donnée(s) manquante(s) et " +
      pilier.nombreAlertesCritiques +
      " alerte(s) critique(s) identifiée(s).";
  }

  ajouterParagrapheESG_(
    corps,
    analyseRedactionnelle
  );

  var resultats =
    diagnostic
      .resultatsQuestions
      .filter(
        function(resultat) {
          return (
            resultat.pilier ===
            codePilier
          );
        }
      );

  var lignes = [
    [
      "Thème",
      "Score",
      "Preuve",
      "Niveau"
    ]
  ];

  resultats.forEach(
    function(resultat) {
      lignes.push([
        resultat.theme,
        resultat.nonApplicable
          ? "N/A"
          : resultat.score +
            " / 100",

        obtenirLibellePreuveESG_(
          resultat.niveauPreuve
        ),

        obtenirLibelleNiveauQuestionESG_(
          resultat
        )
      ]);
    }
  );

  var tableau =
    corps.appendTable(
      lignes
    );

  styliserTableauStandardESG_(
    tableau
  );
}


/**
 * Alertes critiques.
 */
function ajouterAlertesCritiquesRapportESG_(
  corps,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "8. Alertes critiques et risques prioritaires"
  );

  var alertes =
    diagnostic.alertesAvancees ||
    diagnostic.alertesCritiques ||
    [];

  if (
    alertes.length === 0
  ) {
    ajouterEncadreESG_(
      corps,
      "Aucune alerte critique détectée",
      "Aucune alerte critique ou élevée n’a été identifiée sur la base des réponses déclarées. Cette absence d’alerte ne remplace pas une vérification documentaire.",
      "NORMAL"
    );

    return;
  }

  alertes.forEach(
    function(alerte, index) {
      ajouterSousTitreESG_(
        corps,
        (
          index + 1
        ) +
        ". " +
        (
          alerte.title ||
          alerte.theme ||
          "Alerte ESG"
        )
      );

      ajouterParagrapheESG_(
        corps,
        alerte.message || ""
      );

      var tableau =
        corps.appendTable([
          [
            "Gravité",
            alerte.severity ||
            alerte.gravite ||
            ""
          ],
          [
            "Pilier",
            alerte.pillarLabel ||
            ESG_CONFIG.pillarLabels[
              alerte.pillar ||
              alerte.pilier
            ] ||
            ""
          ],
          [
            "Score observé",
            String(
              alerte.score
            ) +
            " / 100"
          ]
        ]);

      styliserTableauStandardESG_(
        tableau
      );

      var conseil =
        String(
          alerte.immediateAction ||
          alerte.recommandation ||
          ""
        ).trim();

      if (
        conseil
      ) {
        ajouterEncadreESG_(
          corps,
          "Conseil d’ajustement associé",
          conseil,
          "NORMAL"
        );
      }
    }
  );
}


/**
 * Forces.
 */
function ajouterForcesESG_(
  corps,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "9. Forces et points de vigilance"
  );

  var forces =
    recommandations.forces ||
    [];

  if (
    forces.length === 0
  ) {
    ajouterParagrapheESG_(
      corps,
      "Aucune force suffisamment mature et documentée n’a été identifiée sur la base des informations déclarées et des preuves disponibles."
    );

    return;
  }

  forces.forEach(
    function(force) {
      ajouterEncadreESG_(
        corps,
        force.titre,
        force.description,
        "NORMAL"
      );
    }
  );
}


/**
 * Faiblesses.
 */
function ajouterFaiblessesESG_(
  corps,
  recommandations
) {
  ajouterSousTitreESG_(
    corps,
    "Points de vigilance"
  );

  var faiblesses =
    recommandations.faiblesses ||
    [];

  if (
    faiblesses.length === 0
  ) {
    ajouterParagrapheESG_(
      corps,
      "Aucun point de vigilance majeur n’a été identifié sur la base des informations déclarées."
    );
  } else {
    var lignes = [
      [
        "Pilier",
        "Thème",
        "Niveau",
        "Score"
      ]
    ];

    faiblesses.forEach(
      function(faiblesse) {
        lignes.push([
          ESG_CONFIG
            .pillarLabels[
              faiblesse.pilier
            ] ||
          faiblesse.pilier,

          faiblesse.theme,

          faiblesse.niveauLabel,

          faiblesse.score +
          " / 100"
        ]);
      }
    );

    var tableau =
      corps.appendTable(
        lignes
      );

    styliserTableauStandardESG_(
      tableau
    );
  }

  /*
   * Les conseils affichés ici proviennent exclusivement
   * du moteur déterministe. HumbleOS ne fait que les reformuler.
   */
  ajouterConseilsAjustementESG_(
    corps,
    recommandations
  );
}


/**
 * Conseils d'ajustement ESG.
 *
 * Aucune recommandation n'est créée par le générateur :
 * on affiche seulement celles déjà déterminées.
 */
function ajouterConseilsAjustementESG_(
  corps,
  recommandations
) {
  recommandations =
    recommandations || {};

  var conseils = [];
  var dejaVus = {};

  function ajouterConseil(
    titre,
    texte
  ) {
    texte =
      String(
        texte || ""
      ).trim();

    if (
      !texte ||
      dejaVus[texte]
    ) {
      return;
    }

    dejaVus[texte] = true;

    conseils.push({
      titre:
        String(
          titre || "Conseil d’ajustement"
        ).trim(),

      texte:
        texte
    });
  }

  if (
    recommandations.prioritePrincipale &&
    recommandations.prioritePrincipale.action
  ) {
    ajouterConseil(
      recommandations
        .prioritePrincipale
        .titre ||
      "Orientation prioritaire",
      recommandations
        .prioritePrincipale
        .action
    );
  }

  (
    recommandations.faiblesses ||
    []
  ).forEach(
    function(faiblesse) {
      ajouterConseil(
        faiblesse.theme
          ? "Ajustement — " +
            faiblesse.theme
          : "Conseil d’ajustement",
        faiblesse.recommandation
      );
    }
  );

  if (
    conseils.length === 0
  ) {
    return;
  }

  ajouterSousTitreESG_(
    corps,
    "Conseils d’ajustement"
  );

  conseils.forEach(
    function(conseil) {
      ajouterEncadreESG_(
        corps,
        conseil.titre,
        conseil.texte,
        "NORMAL"
      );
    }
  );
}



/**
 * Plan d’action.

 */



/**
 * Tableau d’un horizon d’action.
 */



/**
 * Indicateurs.
 */



/**
 * Confiance et limites.
 */
function ajouterConfianceEtLimitesESG_(
  corps,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "10. Niveau de confiance et limites"
  );

  var tableau =
    corps.appendTable([
      [
        "Évaluation",
        "Score"
      ],
      [
        "Disponibilité des preuves",
        diagnostic
          .scores
          .preuves +
          " / 100"
      ],
      [
        "Qualité des données",
        diagnostic
          .scores
          .qualiteDonnees +
          " / 100"
      ],
      [
        "Niveau de confiance",
        diagnostic
          .scores
          .niveauConfiance +
          " / 100"
      ],
      [
        "Données manquantes",
        String(
          diagnostic
            .nombreDonneesManquantes ||
          0
        )
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );

  ajouterParagrapheESG_(
    corps,
    "Le niveau de confiance dépend de la complétude des réponses, de la qualité des données fournies et de la disponibilité des preuves. Une réponse favorable sans preuve suffisante ne doit pas être considérée comme entièrement vérifiée."
  );

  ajouterEncadreESG_(
    corps,
    "Limites méthodologiques",
    ESG_REPORT_CONFIG.disclaimer,
    "WARNING"
  );
}


/**
 * Conclusion.
 */
function ajouterConclusionInstitutionnelleESG_(
  corps,
  profil,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "12. Conclusion"
  );

  var organisation =
    profil.organizationName ||
    profil.nomOrganisation ||
    "L’organisation";

  var conclusion =
    String(
      diagnostic.conclusionRedactionnelle ||
      ""
    ).trim();

  if (
    !conclusion
  ) {
    conclusion =
      organisation +
      " présente un score ESG ajusté de " +
      diagnostic.scores.globalAjuste +
      " / 100, correspondant au niveau de maturité « " +
      diagnostic.maturite.label +
      " » et au niveau de risque « " +
      diagnostic.risque.label +
      " ».";
  }

  ajouterParagrapheESG_(
    corps,
    conclusion
  );

  ajouterParagrapheESG_(
    corps,
    "Cette conclusion synthétise exclusivement les résultats du diagnostic réalisé à partir des informations déclarées et des éléments de preuve disponibles. Elle doit être interprétée avec les limites méthodologiques présentées dans le rapport."
  );
}


/**
 * Titre principal de section.
 */
function ajouterTitreSectionESG_(
  corps,
  texte
) {
  var paragraphe =
    corps.appendParagraph(
      texte
    );

  paragraphe
    .setHeading(
      DocumentApp
        .ParagraphHeading
        .HEADING1
    )
    .setBold(
      true
    )
    .setFontSize(
      18
    )
    .setForegroundColor(
      ESG_REPORT_CONFIG
        .primaryColor
    )
    .setSpacingBefore(
      20
    )
    .setSpacingAfter(
      12
    );

  return paragraphe;
}


/**
 * Sous-titre.
 */
function ajouterSousTitreESG_(
  corps,
  texte
) {
  var paragraphe =
    corps.appendParagraph(
      texte
    );

  paragraphe
    .setHeading(
      DocumentApp
        .ParagraphHeading
        .HEADING2
    )
    .setBold(
      true
    )
    .setFontSize(
      13
    )
    .setForegroundColor(
      ESG_REPORT_CONFIG
        .darkColor
    )
    .setSpacingBefore(
      14
    )
    .setSpacingAfter(
      7
    );

  return paragraphe;
}


/**
 * Paragraphe standard.
 */
function ajouterParagrapheESG_(
  corps,
  texte
) {
  return corps
    .appendParagraph(
      String(
        texte || ""
      )
    )
    .setFontSize(
      10
    )
    .setLineSpacing(
      1.25
    )
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .JUSTIFY
    )
    .setSpacingAfter(
      9
    );
}


/**
 * Encadré.
 */
function ajouterEncadreESG_(
  corps,
  titre,
  contenu,
  type
) {
  var couleurFond =
    ESG_REPORT_CONFIG
      .secondaryColor;

  var couleurTitre =
    ESG_REPORT_CONFIG
      .primaryColor;

  if (
    type === "WARNING"
  ) {
    couleurFond =
      "#FFF7ED";

    couleurTitre =
      ESG_REPORT_CONFIG
        .warningColor;
  }

  if (
    type === "CRITICAL"
  ) {
    couleurFond =
      "#FEF2F2";

    couleurTitre =
      ESG_REPORT_CONFIG
        .criticalColor;
  }

  var tableau =
    corps.appendTable([
      [
        titre
      ],
      [
        contenu
      ]
    ]);

  tableau.setBorderWidth(
    0
  );

  tableau
    .getCell(
      0,
      0
    )
    .setBackgroundColor(
      couleurTitre
    );

  tableau
    .getCell(
      0,
      0
    )
    .getChild(
      0
    )
    .asParagraph()
    .setBold(
      true
    )
    .setForegroundColor(
      "#FFFFFF"
    )
    .setFontSize(
      10
    );

  tableau
    .getCell(
      1,
      0
    )
    .setBackgroundColor(
      couleurFond
    );

  tableau
    .getCell(
      1,
      0
    )
    .getChild(
      0
    )
    .asParagraph()
    .setFontSize(
      10
    )
    .setLineSpacing(
      1.2
    );

  corps
    .appendParagraph(
      ""
    )
    .setSpacingAfter(
      4
    );
}


/**
 * Liste.
 */
function ajouterListeESG_(
  corps,
  titre,
  elements
) {
  ajouterParagrapheESG_(
    corps,
    titre
  ).setBold(
    true
  );

  elements.forEach(
    function(element) {
      corps
        .appendListItem(
          element
        )
        .setGlyphType(
          DocumentApp
            .GlyphType
            .BULLET
        )
        .setFontSize(
          10
        );
    }
  );
}


/**
 * Style tableau standard.
 */
function styliserTableauStandardESG_(
  tableau
) {
  tableau.setBorderWidth(
    1
  );

  if (
    tableau.getNumRows() === 0
  ) {
    return;
  }

  var ligneEntete =
    tableau.getRow(
      0
    );

  for (
    var colonne = 0;
    colonne <
    ligneEntete.getNumCells();
    colonne++
  ) {
    var cellule =
      ligneEntete.getCell(
        colonne
      );

    cellule.setBackgroundColor(
      ESG_REPORT_CONFIG
        .primaryColor
    );

    cellule
      .getChild(
        0
      )
      .asParagraph()
      .setBold(
        true
      )
      .setForegroundColor(
        "#FFFFFF"
      )
      .setFontSize(
        9
      );
  }

  for (
    var ligne = 1;
    ligne <
    tableau.getNumRows();
    ligne++
  ) {
    var ligneTableau =
      tableau.getRow(
        ligne
      );

    for (
      var colonneIndex = 0;
      colonneIndex <
      ligneTableau.getNumCells();
      colonneIndex++
    ) {
      var celluleValeur =
        ligneTableau.getCell(
          colonneIndex
        );

      if (
        ligne % 2 === 0
      ) {
        celluleValeur
          .setBackgroundColor(
            ESG_REPORT_CONFIG
              .lightGrey
          );
      }

      celluleValeur
        .getChild(
          0
        )
        .asParagraph()
        .setFontSize(
          9
        );
    }
  }

  tableau
    .getParent()
    .asBody()
    .appendParagraph(
      ""
    )
    .setSpacingAfter(
      5
    );
}


/**
 * Pied de page.
 */
function ajouterPiedDePageESG_(
  document,
  identifiantRapport,
  profil
) {
  var footer =
    document.addFooter();

  var slogan =
    obtenirSloganOrganisationESG_(
      profil
    );

  var footerText =
    slogan
      ? (
          slogan +
          " — " +
          identifiantRapport
        )
      : (
          "Rapport ESG — " +
          identifiantRapport
        );

  var paragraphe =
    footer.appendParagraph(
      footerText
    );

  paragraphe
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setFontSize(
      8
    )
    .setForegroundColor(
      "#6B7280"
    );
}


/**
 * Conversion du document en PDF.
 */
function creerPDFFromDocumentESG_(
  documentId,
  nomDocument,
  dossier
) {
  var fichierDocument =
    DriveApp.getFileById(
      documentId
    );

  var blobPDF =
    fichierDocument
      .getAs(
        MimeType.PDF
      )
      .setName(
        nomDocument +
        ".pdf"
      );

  var fichierPDF =
    dossier.createFile(
      blobPDF
    );

  return {
    id:
      fichierPDF.getId(),

    url:
      fichierPDF.getUrl(),

    downloadUrl:
      "https://drive.google.com/uc?export=download&id=" +
      fichierPDF.getId()
  };
}


/**
 * Partage public optionnel.
 *
 * Certains comptes Workspace peuvent bloquer
 * le partage public. L’erreur n’empêche donc
 * pas la génération du rapport.
 */
function essayerPartagerRapportESG_(
  documentId,
  pdfId
) {
  try {
    DriveApp
      .getFileById(
        documentId
      )
      .setSharing(
        DriveApp.Access
          .ANYONE_WITH_LINK,

        DriveApp.Permission
          .VIEW
      );
  } catch (erreurDocument) {
    console.log(
      "Partage public du document non autorisé : " +
      erreurDocument.message
    );
  }

  try {
    DriveApp
      .getFileById(
        pdfId
      )
      .setSharing(
        DriveApp.Access
          .ANYONE_WITH_LINK,

        DriveApp.Permission
          .VIEW
      );
  } catch (erreurPDF) {
    console.log(
      "Partage public du PDF non autorisé : " +
      erreurPDF.message
    );
  }
}


/**
 * Valeur d’un champ du profil.
 */
function obtenirValeurProfilESG_(
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

      return String(
        valeur
      );
    }
  }

  return "Non renseigné";
}


/**
 * Libellé du niveau de preuve.
 */
function obtenirLibellePreuveESG_(
  niveau
) {
  var libelles = {
    STRONG:
      "Preuve forte",

    MEDIUM:
      "Preuve moyenne",

    DECLARATIVE:
      "Déclaration non vérifiée",

    NONE:
      "Aucune preuve"
  };

  return libelles[
    niveau
  ] || "Aucune preuve";
}


/**
 * Niveau d’une question.
 */
function obtenirLibelleNiveauQuestionESG_(
  resultat
) {
  if (
    resultat.nonApplicable
  ) {
    return "Non applicable";
  }

  if (
    resultat.reponseManquante
  ) {
    return "Donnée manquante";
  }

  if (
    resultat.score <= 20
  ) {
    return "Critique";
  }

  if (
    resultat.score <= 40
  ) {
    return "Faible";
  }

  if (
    resultat.score <= 60
  ) {
    return "En structuration";
  }

  if (
    resultat.score <= 80
  ) {
    return "Avancé";
  }

  return "Mature";
}


/**
 * Compte les alertes.
 */
function obtenirNombreAlertesRapportESG_(
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
 * Test complet de génération.
 */
function testerGenerationRapportESG() {
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

    annualRevenueOrBudget:
      "150 000 EUR",

    creationYear:
      2022,

    interventionZone:
      "Nationale",

    existingESGPolicy:
      "Oui, partiellement",

    existingESGReport:
      "Non",

    diagnosticPurpose: [
      "Rechercher un financement",
      "Améliorer notre gestion"
    ]
  };


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
            "Réponse de démonstration."
        };
      }
    );


  /*
   * Forces.
   */

  reponsesTest[
    "E-ENER-001"
  ] = {
    value:
      5,

    evidenceLevel:
      "STRONG"
  };

  reponsesTest[
    "S-TRN-001"
  ] = {
    value:
      4,

    evidenceLevel:
      "STRONG"
  };

  reponsesTest[
    "G-FIN-001"
  ] = {
    value:
      4,

    evidenceLevel:
      "MEDIUM"
  };


  /*
   * Faiblesses et alertes.
   */

  reponsesTest[
    "S-HR-002"
  ] = {
    value:
      0,

    evidenceLevel:
      "NONE",

    comment:
      "Aucune procédure formelle."
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
    "E-POLL-001"
  ] = {
    value:
      1,

    evidenceLevel:
      "NONE"
  };

  reponsesTest[
    "R-PROOF-001"
  ] = {
    value:
      1,

    evidenceLevel:
      "NONE"
  };


  var resultat =
    genererRapportESG(
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

        documentId:
          resultat.documentId,

        docUrl:
          resultat.docUrl,

        pdfId:
          resultat.pdfId,

        pdfUrl:
          resultat.pdfUrl,

        pdfDownloadUrl:
          resultat.pdfDownloadUrl,

        scoreGlobal:
          resultat.scoreGlobal,

        maturite:
          resultat.maturite,

        risque:
          resultat.risque
      },
      null,
      2
    )
  );


  if (
    resultat.success !== true
  ) {
    throw new Error(
      "La génération du rapport ESG a échoué."
    );
  }


  if (
    !resultat.documentId ||
    !resultat.docUrl
  ) {
    throw new Error(
      "Le document Google Docs n’a pas été créé."
    );
  }


  if (
    !resultat.pdfId ||
    !resultat.pdfUrl
  ) {
    throw new Error(
      "Le PDF ESG n’a pas été créé."
    );
  }


  return resultat;
}
/**
 * ==========================================================
 * SECTION — TRANSPARENCE ET VISIBILITÉ NUMÉRIQUE ESG
 * ==========================================================
 *
 * Section strictement descriptive.
 * Aucun conseil, aucune offre commerciale, aucun CTA.
 */

function ajouterSectionTransparenceNumeriqueESG_(
  body,
  diagnosticDigital
) {
  if (
    !body ||
    !diagnosticDigital
  ) {
    return;
  }

  ajouterSautDePageSiNecessaireESG_(
    body
  );

  ajouterTitreSectionESG_(
    body,
    "11. Transparence et visibilité numérique ESG"
  );

  ajouterParagrapheESG_(
    body,
    "Cette analyse complémentaire mesure la capacité de l’organisation à rendre ses engagements, politiques, actions, preuves et résultats ESG accessibles à ses parties prenantes."
  );

  ajouterParagrapheESG_(
    body,
    "Ce score ne constitue pas une mesure directe de la performance ESG et ne modifie pas le score ESG principal."
  ).setItalic(
    true
  );

  ajouterBlocScoreDigitalESG_(
    body,
    diagnosticDigital
  );

  ajouterDetailScoresDigitauxESG_(
    body,
    diagnosticDigital
  );

  ajouterResumeDigitalESG_(
    body,
    diagnosticDigital
  );

  ajouterConseilsTransparenceNumeriqueESG_(
    body,
    diagnosticDigital
  );
}



/**
 * Leviers d'ajustement de transparence numérique.
 *
 * Ils proviennent du diagnostic déterministe public.
 * Aucun service commercial n'est affiché ici.
 */
function ajouterConseilsTransparenceNumeriqueESG_(
  body,
  diagnosticDigital
) {
  var recommandations =
    diagnosticDigital.recommandations ||
    [];

  if (
    !Array.isArray(
      recommandations
    ) ||
    recommandations.length === 0
  ) {
    return;
  }

  ajouterSousTitreESG_(
    body,
    "Leviers d’ajustement"
  );

  recommandations.forEach(
    function(recommandation) {
      var texte =
        String(
          recommandation || ""
        ).trim();

      if (
        texte
      ) {
        ajouterParagrapheESG_(
          body,
          "• " + texte
        );
      }
    }
  );
}


function ajouterBlocScoreDigitalESG_(
  body,
  diagnosticDigital
) {
  var score =
    Number(
      diagnosticDigital.scoreGlobal ||
      0
    );

  var niveau =
    diagnosticDigital.niveau &&
    diagnosticDigital.niveau.label
      ? diagnosticDigital.niveau.label
      : "Niveau non déterminé";

  var tableau =
    body.appendTable([
      [
        "Indicateur",
        "Résultat"
      ],
      [
        "Score de transparence numérique ESG",
        score + " / 100"
      ],
      [
        "Niveau",
        niveau
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );
}


function ajouterDetailScoresDigitauxESG_(
  body,
  diagnosticDigital
) {
  var details =
    diagnosticDigital.detailScores ||
    (
      diagnosticDigital.resume &&
      diagnosticDigital.resume.detailScores
    ) ||
    {};

  ajouterSousTitreESG_(
    body,
    "Résultats détaillés"
  );

  var lignes = [
    [
      "Dimension",
      "Score"
    ],
    [
      "Site internet et publication ESG",
      normaliserPourcentageRapportESG_(
        details.siteWeb
      )
    ],
    [
      "LinkedIn et présence professionnelle",
      normaliserPourcentageRapportESG_(
        details.linkedin
      )
    ],
    [
      "Communication ESG",
      normaliserPourcentageRapportESG_(
        details.communicationESG
      )
    ],
    [
      "Collecte et suivi numérique",
      normaliserPourcentageRapportESG_(
        details.automatisation
      )
    ]
  ];

  var tableau =
    body.appendTable(
      lignes
    );

  styliserTableauStandardESG_(
    tableau
  );
}


function ajouterResumeDigitalESG_(
  body,
  diagnosticDigital
) {
  ajouterSousTitreESG_(
    body,
    "Interprétation"
  );

  var resume =
    diagnosticDigital.resume || {};

  var texte =
    resume.message ||
    construireInterpretationNumeriqueFactuelleESG_(
      diagnosticDigital
    );

  ajouterParagrapheESG_(
    body,
    texte
  );
}


function construireInterpretationNumeriqueFactuelleESG_(
  diagnosticDigital
) {
  diagnosticDigital =
    diagnosticDigital || {};

  var score =
    Number(
      diagnosticDigital.scoreGlobal ||
      0
    );

  var niveau =
    diagnosticDigital.niveau &&
    diagnosticDigital.niveau.label
      ? diagnosticDigital.niveau.label
      : "niveau non déterminé";

  var details =
    diagnosticDigital.detailScores ||
    (
      diagnosticDigital.resume &&
      diagnosticDigital.resume.detailScores
    ) ||
    {};

  return (
    "La transparence numérique ESG de l’organisation affiche un score de " +
    score +
    "/100, correspondant au niveau « " +
    niveau +
    " ». Les sous-scores observés sont de " +
    Number(details.siteWeb || 0) +
    "/100 pour le site internet et la publication ESG, " +
    Number(details.linkedin || 0) +
    "/100 pour LinkedIn et la présence professionnelle, " +
    Number(details.communicationESG || 0) +
    "/100 pour la communication ESG et " +
    Number(details.automatisation || 0) +
    "/100 pour la collecte et le suivi numérique."
  );
}


function normaliserPourcentageRapportESG_(
  valeur
) {
  var nombre =
    Number(
      valeur
    );

  if (
    isNaN(
      nombre
    )
  ) {
    nombre = 0;
  }

  nombre =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          nombre
        )
      )
    );

  return nombre +
    " / 100";
}


function ajouterSautDePageSiNecessaireESG_(
  body
) {
  body.appendPageBreak();
}


/**
 * ============================================================
 * AFRIGREEN24 — RAPPORT ESG INVESTISSEUR / FINANCEUR
 * VERSION 3.1.0
 * ============================================================
 *
 * Cette couche ne modifie PAS :
 * - les 50 questions ESG ;
 * - le scoring ;
 * - les alertes ;
 * - les recommandations déterministes ;
 * - HumbleOS ;
 * - le datastore ;
 * - le diagnostic numérique.
 *
 * Elle transforme uniquement la SORTIE DOCUMENTAIRE afin que
 * le rapport principal soit lisible par un financeur / investisseur.
 * Le détail technique est conservé en annexe.
 */
var ESG_INVESTOR_REPORT_CONFIG = {
  version: "3.3.0",

  title:
    "RAPPORT ESG",

  subtitle:
    "Préparation au financement et à la due diligence",

  methodologyNotice:
    "Document de préparation à la due diligence ESG. Les résultats reposent sur les informations disponibles à la date de l’évaluation et ne constituent ni un audit indépendant, ni une certification, ni une garantie de financement.",

  mainStrengthsLimit: 3,
  mainRisksLimit: 6,
  materialIssuesLimit: 8,
  indicatorsLimit: 7,
  actionLimits: {
    immediate: 5,
    shortTerm: 5,
    structural: 4
  }
};


/**
 * Générateur V3 orienté financeurs / investisseurs.
 *
 * Contrat de retour volontairement compatible avec
 * genererRapportESGV2() pour ne pas casser le stockage et l'UI.
 *
 * @param {Object} profil
 * @param {Object} analyseESG
 * @param {Object} diagnosticDigital
 * @param {Array} offres - ignoré dans le PDF (white-label)
 * @return {Object}
 */
function genererRapportInvestisseurESGV3(
  profil,
  analyseESG,
  diagnosticDigital,
  offres
) {
  verifierProfilRapportESG_(
    profil
  );

  if (
    !analyseESG ||
    analyseESG.success !== true ||
    !analyseESG.diagnostic ||
    !analyseESG.recommandations
  ) {
    throw new Error(
      "L’analyse ESG transmise au rapport investisseur est invalide."
    );
  }

  var diagnostic =
    analyseESG.diagnostic;

  var recommandations =
    analyseESG.recommandations;

  var identifiantRapport =
    creerIdentifiantRapportESG_();

  var nomOrganisation =
    nettoyerNomFichierESG_(
      profil.organizationName ||
      profil.nomOrganisation ||
      "Organisation"
    );

  var nomDocument =
    "Rapport ESG Investisseur - " +
    nomOrganisation +
    " - " +
    identifiantRapport;

  var dossier =
    obtenirOuCreerDossierRapportsESG_();

  var document =
    DocumentApp.create(
      nomDocument
    );

  var documentId =
    document.getId();

  var fichierDocument =
    DriveApp.getFileById(
      documentId
    );

  dossier.addFile(
    fichierDocument
  );

  retirerFichierDeRacineESG_(
    fichierDocument
  );

  var corps =
    document.getBody();

  configurerDocumentESG_(
    corps
  );

  ajouterPageCouvertureInvestisseurESG_(
    corps,
    profil,
    diagnostic,
    identifiantRapport
  );

  ajouterSommaireInvestisseurESG_(
    corps,
    diagnosticDigital
  );

  ajouterExecutiveInvestmentSummaryESG_(
    corps,
    profil,
    diagnostic,
    recommandations
  );

  ajouterProfilEtPerimetreInvestisseurESG_(
    corps,
    profil
  );

  ajouterPositionnementInvestisseurESG_(
    corps,
    diagnostic
  );

  ajouterEnjeuxMaterielsInvestisseurESG_(
    corps,
    diagnostic,
    recommandations
  );

  ajouterRisquesEtLeviersFinancementESG_(
    corps,
    diagnostic,
    recommandations
  );

  ajouterGouvernanceEtPilotageInvestisseurESG_(
    corps,
    diagnostic
  );

  ajouterKPIEtTrajectoireInvestisseurESG_(
    corps,
    recommandations
  );

  ajouterPlanActionInvestisseurESG_(
    corps,
    recommandations
  );

  ajouterConclusionFinanceurInvestisseurESG_(
    corps,
    profil,
    diagnostic,
    recommandations
  );

  ajouterAnnexeMethodologieInvestisseurESG_(
    corps,
    diagnostic
  );

  ajouterAnnexeDiagnosticDetailleInvestisseurESG_(
    corps,
    diagnostic
  );

  ajouterAnnexeTransparenceNumeriqueInvestisseurESG_(
    corps,
    diagnosticDigital
  );

  ajouterPiedDePageESG_(
    document,
    identifiantRapport,
    profil
  );

  document.saveAndClose();

  Utilities.sleep(
    1500
  );

  var pdf =
    creerPDFFromDocumentESG_(
      documentId,
      nomDocument,
      dossier
    );

  if (
    typeof appliquerPartageRapportV2_ ===
    "function"
  ) {
    appliquerPartageRapportV2_(
      documentId,
      pdf.id
    );
  } else {
    essayerPartagerRapportESG_(
      documentId,
      pdf.id
    );
  }

  var docUrl =
    "https://docs.google.com/document/d/" +
    documentId +
    "/edit";

  return {
    success: true,

    version:
      ESG_INVESTOR_REPORT_CONFIG.version,

    reportId:
      identifiantRapport,

    documentId:
      documentId,

    docId:
      documentId,

    documentUrl:
      docUrl,

    docUrl:
      docUrl,

    url:
      docUrl,

    pdfId:
      pdf.id,

    pdfUrl:
      pdf.url,

    pdfLink:
      pdf.url,

    pdfDownloadUrl:
      pdf.downloadUrl,

    downloadUrl:
      pdf.downloadUrl,

    folderId:
      dossier.getId(),

    folderUrl:
      dossier.getUrl(),

    fileName:
      nomDocument,

    organisation:
      profil.organizationName ||
      profil.nomOrganisation ||
      "",

    scoreGlobal:
      diagnostic.scores.globalAjuste,

    maturite:
      diagnostic.maturite,

    risque:
      diagnostic.risque,

    diagnostic:
      diagnostic,

    recommandations:
      recommandations,

    diagnosticDigital:
      diagnosticDigital,

    offresAfriGreen24:
      offres || []
  };
}


/**
 * Couverture investisseur white-label.
 */
function ajouterPageCouvertureInvestisseurESG_(
  corps,
  profil,
  diagnostic,
  identifiantRapport
) {
  corps.appendParagraph("")
    .setSpacingAfter(30);

  var logoOrganisation =
    obtenirLogoBlobOrganisationESG_(
      profil
    );

  if (logoOrganisation) {
    var logoParagraph =
      corps.appendParagraph("");

    logoParagraph.setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    );

    var logoImage =
      logoParagraph.appendInlineImage(
        logoOrganisation
      );

    var largeur =
      logoImage.getWidth();

    var hauteur =
      logoImage.getHeight();

    var ratio =
      Math.min(
        150 / largeur,
        75 / hauteur,
        1
      );

    logoImage
      .setWidth(
        Math.round(
          largeur * ratio
        )
      )
      .setHeight(
        Math.round(
          hauteur * ratio
        )
      );

    logoParagraph.setSpacingAfter(
      22
    );
  }

  var titre =
    corps.appendParagraph(
      ESG_INVESTOR_REPORT_CONFIG.title
    );

  titre
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setBold(true)
    .setFontSize(25)
    .setForegroundColor(
      ESG_REPORT_CONFIG.darkColor
    )
    .setSpacingBefore(35);

  var sousTitre =
    corps.appendParagraph(
      ESG_INVESTOR_REPORT_CONFIG.subtitle
    );

  sousTitre
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setFontSize(14)
    .setBold(true)
    .setForegroundColor(
      ESG_REPORT_CONFIG.primaryColor
    );

  var organisation =
    corps.appendParagraph(
      profil.organizationName ||
      profil.nomOrganisation ||
      ""
    );

  organisation
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setBold(true)
    .setFontSize(20)
    .setSpacingBefore(35)
    .setSpacingAfter(18);

  var tableau =
    corps.appendTable([
      [
        "SCORE ESG",
        "MATURITÉ",
        "RISQUE",
        "CONFIANCE"
      ],
      [
        formaterScoreInvestisseurESG_(
          diagnostic.scores.globalAjuste
        ),
        diagnostic.maturite.label,
        normaliserNiveauRisqueInvestisseurESG_(
          diagnostic.risque.label
        ),
        formaterScoreInvestisseurESG_(
          diagnostic.scores.niveauConfiance
        )
      ]
    ]);

  styliserTableauKPIInvestisseurESG_(
    tableau
  );

  var date =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
    );

  var informations =
    corps.appendParagraph(
      "Date d’évaluation : " +
      date +
      "\nRéférence : " +
      identifiantRapport
    );

  informations
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setFontSize(9)
    .setForegroundColor("#6B7280")
    .setSpacingBefore(28);

  var mention =
    corps.appendParagraph(
      ESG_INVESTOR_REPORT_CONFIG.methodologyNotice
    );

  mention
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    )
    .setFontSize(8)
    .setItalic(true)
    .setForegroundColor("#6B7280")
    .setSpacingBefore(28);

  corps.appendPageBreak();
}


function styliserTableauKPIInvestisseurESG_(
  tableau
) {
  tableau.setBorderWidth(1);

  var entete =
    tableau.getRow(0);

  var valeurs =
    tableau.getRow(1);

  for (
    var i = 0;
    i < 4;
    i++
  ) {
    entete
      .getCell(i)
      .setBackgroundColor(
        ESG_REPORT_CONFIG.primaryColor
      );

    entete
      .getCell(i)
      .getChild(0)
      .asParagraph()
      .setAlignment(
        DocumentApp.HorizontalAlignment.CENTER
      )
      .setBold(true)
      .setForegroundColor("#FFFFFF")
      .setFontSize(8);

    valeurs
      .getCell(i)
      .setBackgroundColor(
        ESG_REPORT_CONFIG.secondaryColor
      );

    valeurs
      .getCell(i)
      .getChild(0)
      .asParagraph()
      .setAlignment(
        DocumentApp.HorizontalAlignment.CENTER
      )
      .setBold(true)
      .setFontSize(10);
  }
}


function ajouterSommaireInvestisseurESG_(
  corps,
  diagnosticDigital
) {
  ajouterTitreSectionESG_(
    corps,
    "Sommaire"
  );

  var sections = [
    "1. Synthèse exécutive ESG pour le financeur",
    "2. Profil et périmètre",
    "3. Positionnement ESG",
    "4. Enjeux ESG matériels",
    "5. Risques ESG et leviers pour le financement",
    "6. Gouvernance, preuves et capacité de pilotage",
    "7. Indicateurs clés (KPI) et trajectoire de pilotage",
    "8. Plan d’action prioritaire",
    "9. Conclusion pour le financeur",
    "Annexe A. Méthodologie et limites",
    "Annexe B. Diagnostic technique détaillé"
  ];

  if (
    diagnosticDigital &&
    diagnosticDigital.success === true
  ) {
    sections.push(
      "Annexe C. Transparence numérique ESG"
    );
  }

  sections.forEach(
    function(section) {
      corps
        .appendParagraph(section)
        .setFontSize(10.5)
        .setSpacingAfter(5);
    }
  );

  corps.appendPageBreak();
}


/**
 * 1. Executive summary orienté décision.
 */
function ajouterListeInvestisseurESG_(
  corps,
  elements
) {
  (elements || []).forEach(
    function(element) {
      corps
        .appendListItem(
          String(element || "")
        )
        .setGlyphType(
          DocumentApp
            .GlyphType
            .BULLET
        )
        .setFontSize(
          10
        );
    }
  );
}


/**
 * Formate les nombres selon la convention éditoriale française
 * sans modifier les valeurs calculées par le moteur.
 */
function formaterNombreInvestisseurESG_(
  valeur
) {
  var nombre = Number(valeur);

  if (
    !isFinite(nombre)
  ) {
    return String(
      valeur === undefined || valeur === null
        ? "—"
        : valeur
    ).replace(
      ".",
      ","
    );
  }

  var texte =
    nombre
      .toFixed(2)
      .replace(/\.00$/, "")
      .replace(/(\.\d)0$/, "$1");

  return texte.replace(
    ".",
    ","
  );
}


function formaterScoreInvestisseurESG_(
  valeur
) {
  return (
    formaterNombreInvestisseurESG_(
      valeur
    ) +
    " / 100"
  );
}


function normaliserTexteEditorialInvestisseurESG_(
  texte
) {
  return String(
    texte || ""
  )
    .replace(
      /(\d+)\.(\d+)(\s*\/\s*100)/g,
      "$1,$2$3"
    )
    .replace(/\bHIGH\b/g, "ÉLEVÉ")
    .replace(/\bMEDIUM\b/g, "MODÉRÉ")
    .replace(/\bLOW\b/g, "FAIBLE");
}


/**
 * V3.3 — Nettoie les formulations techniques pouvant provenir
 * d'une réécriture externe, sans modifier les constats métier.
 */
function normaliserSyntheseStrategiqueInvestisseurESG_(
  texte,
  diagnostic
) {
  var sortie =
    normaliserTexteEditorialInvestisseurESG_(
      texte
    );

  var nombreAlertes =
    obtenirNombreAlertesRapportESG_(
      diagnostic
    );

  var phraseAlertes =
    nombreAlertes === 1
      ? "Le diagnostic a mis en évidence une alerte critique ou prioritaire."
      : nombreAlertes > 1
        ? "Le diagnostic a mis en évidence " + nombreAlertes + " alertes critiques ou prioritaires."
        : "Le diagnostic n’a pas mis en évidence d’alerte critique majeure sur les informations disponibles.";

  sortie = sortie.replace(
    /Le diagnostic a mis en évidence\s+\d+\s+alerte\(s\)\s+critique\(s\)\s+ou\s+prioritaire\(s\)\.?/gi,
    phraseAlertes
  );

  sortie = sortie.replace(
    /Le diagnostic a mis en évidence\s+\d+\s+alerte\(s\)\s+critique\(s\)\s+ou\s+élevée\(s\)\.?/gi,
    phraseAlertes
  );

  sortie = sortie.replace(
    /\d+\s+alerte\(s\)\s+critique\(s\)\s+ou\s+prioritaire\(s\)/gi,
    nombreAlertes === 1
      ? "une alerte critique ou prioritaire"
      : nombreAlertes + " alertes critiques ou prioritaires"
  );

  sortie = sortie.replace(
    /\d+\s+alerte\(s\)\s+critique\(s\)\s+ou\s+élevée\(s\)/gi,
    nombreAlertes === 1
      ? "une alerte critique ou prioritaire"
      : nombreAlertes + " alertes critiques ou prioritaires"
  );

  return sortie;
}


function obtenirNiveauDocumentaireInvestisseurESG_(
  niveauPreuve
) {
  var niveau = String(
    niveauPreuve || "NONE"
  ).toUpperCase();

  if (niveau === "STRONG") {
    return "Fort";
  }

  if (niveau === "MEDIUM") {
    return "Moyen";
  }

  if (niveau === "DECLARATIVE") {
    return "Déclaratif";
  }

  return "Non documenté";
}


function normaliserNiveauRisqueInvestisseurESG_(
  niveau
) {
  var cle = String(
    niveau || ""
  )
    .trim()
    .toUpperCase()
    .replace(/[ÉÈÊË]/g, "E")
    .replace(/[ÀÂÄ]/g, "A")
    .replace(/[ÎÏ]/g, "I")
    .replace(/[ÔÖ]/g, "O")
    .replace(/[ÙÛÜ]/g, "U");

  if (
    cle === "CRITICAL" ||
    cle === "CRITIQUE" ||
    cle === "VERY HIGH" ||
    cle === "TRES ELEVE" ||
    cle === "TRES ELEVEE"
  ) {
    return "CRITIQUE";
  }

  if (
    cle === "HIGH" ||
    cle === "ELEVE" ||
    cle === "ELEVEE"
  ) {
    return "ÉLEVÉ";
  }

  if (
    cle === "MEDIUM" ||
    cle === "MODERE" ||
    cle === "MODEREE"
  ) {
    return "MODÉRÉ";
  }

  if (
    cle === "LOW" ||
    cle === "FAIBLE"
  ) {
    return "FAIBLE";
  }

  return niveau || "À qualifier";
}


function construirePhraseAlertesInvestisseurESG_(
  nombre
) {
  nombre = Number(nombre || 0);

  if (nombre <= 0) {
    return "Aucune alerte critique n’est détectée par le moteur sur les informations disponibles.";
  }

  if (nombre === 1) {
    return "Le moteur identifie une alerte nécessitant un traitement prioritaire avant ou pendant une due diligence approfondie.";
  }

  return (
    "Le moteur identifie " +
    nombre +
    " alertes nécessitant un traitement prioritaire avant ou pendant une due diligence approfondie."
  );
}


function construirePhraseDonneesManquantesInvestisseurESG_(
  nombre
) {
  nombre = Number(nombre || 0);

  if (nombre === 1) {
    return "Une donnée ESG reste manquante. Elle doit être documentée ou explicitement qualifiée avant une utilisation du rapport comme pièce de due diligence.";
  }

  return (
    nombre +
    " données ESG restent manquantes. Elles doivent être documentées ou explicitement qualifiées avant une utilisation du rapport comme pièce de due diligence."
  );
}


function obtenirMessageFinanceurInvestisseurESG_(
  diagnostic,
  recommandations
) {
  var message =
    recommandations &&
    recommandations.messageFinanceur
      ? String(
          recommandations.messageFinanceur
        )
      : "";

  if (
    !message ||
    /alerte\(s\)|critique\(s\)|necessite\(nt\)|nécessite\(nt\)/i.test(
      message
    )
  ) {
    return construireLectureFinanceurFactuelleESG_(
      diagnostic
    );
  }

  return normaliserTexteEditorialInvestisseurESG_(
    message
  );
}


function ajouterExecutiveInvestmentSummaryESG_(
  corps,
  profil,
  diagnostic,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "1. Synthèse exécutive ESG pour le financeur"
  );

  var organisation =
    profil.organizationName ||
    profil.nomOrganisation ||
    "L’organisation";

  var synthese =
    recommandations.syntheseStrategique ||
    (
      organisation +
      " obtient un score ESG ajusté de " +
      formaterScoreInvestisseurESG_(
        diagnostic.scores.globalAjuste
      ) +
      ", avec un niveau de maturité « " +
      diagnostic.maturite.label +
      " » et un niveau de risque « " +
      normaliserNiveauRisqueInvestisseurESG_(
        diagnostic.risque.label
      ) +
      " »."
    );

  ajouterParagrapheESG_(
    corps,
    normaliserSyntheseStrategiqueInvestisseurESG_(
      synthese,
      diagnostic
    )
  );

  var tableau =
    corps.appendTable([
      [
        "Indicateur",
        "Lecture"
      ],
      [
        "Score ESG ajusté",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.globalAjuste
        )
      ],
      [
        "Maturité",
        diagnostic.maturite.label
      ],
      [
        "Niveau de risque",
        normaliserNiveauRisqueInvestisseurESG_(
          diagnostic.risque.label
        )
      ],
      [
        "Niveau de confiance",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.niveauConfiance
        )
      ],
      [
        "Qualité des données",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.qualiteDonnees
        )
      ],
      [
        "Disponibilité des preuves",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.preuves
        )
      ],
      [
        "Alertes critiques",
        String(
          obtenirNombreAlertesRapportESG_(
            diagnostic
          )
        )
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );

  ajouterSousTitreESG_(
    corps,
    "Lecture pour le financeur"
  );

  ajouterEncadreESG_(
    corps,
    "Lecture de préparation au financement",
    obtenirMessageFinanceurInvestisseurESG_(
      diagnostic,
      recommandations
    ),
    obtenirNombreAlertesRapportESG_(
      diagnostic
    ) > 0
      ? "WARNING"
      : "NORMAL"
  );

  var forces =
    recommandations.forces || [];

  var faiblesses =
    consoliderFaiblessesParEnjeuInvestisseurESG_(
      recommandations.faiblesses || []
    );

  ajouterSousTitreESG_(
    corps,
    "Atouts ESG démontrables"
  );

  if (forces.length === 0) {
    ajouterParagrapheESG_(
      corps,
      "Aucun domaine n’atteint actuellement le seuil retenu par le moteur pour être présenté comme une force ESG majeure."
    );
  } else {
    ajouterListeInvestisseurESG_(
      corps,
      forces
        .slice(
          0,
          ESG_INVESTOR_REPORT_CONFIG.mainStrengthsLimit
        )
        .map(
          function(force) {
            return (
              force.theme +
              " — " +
              force.description
            );
          }
        )
    );
  }

  ajouterSousTitreESG_(
    corps,
    "Principaux points de vigilance"
  );

  if (faiblesses.length === 0) {
    ajouterParagrapheESG_(
      corps,
      "Aucun point de vigilance majeur n’a été identifié selon les seuils du diagnostic."
    );
  } else {
    ajouterListeInvestisseurESG_(
      corps,
      faiblesses
        .slice(0, 3)
        .map(
          function(faiblesse) {
            return (
              faiblesse.theme +
              " — " +
              faiblesse.niveauLabel +
              ". " +
              (
                faiblesse.risque ||
                "Risque à traiter dans le plan d’amélioration ESG."
              )
            );
          }
        )
    );
  }

  if (
    recommandations.prioritePrincipale
  ) {
    ajouterEncadreESG_(
      corps,
      "Priorité immédiate",
      recommandations
        .prioritePrincipale
        .action ||
      recommandations
        .prioritePrincipale
        .description ||
      "Traiter en priorité le principal point de vigilance identifié.",
      "WARNING"
    );
  }

  /*
   * V3.2 : pas de saut forcé ici.
   * Lorsque la synthèse termine naturellement une page, un saut explicite
   * pouvait créer une page entièrement blanche avant le profil.
   * Le moteur de pagination de Google Docs place la section suivante
   * sur la page disponible sans modifier le contenu métier.
   */
}


function construireLectureFinanceurFactuelleESG_(
  diagnostic
) {
  var alertes =
    obtenirNombreAlertesRapportESG_(
      diagnostic
    );

  var texte =
    "Le diagnostic positionne l’organisation au niveau « " +
    diagnostic.maturite.label +
    " » avec un niveau de risque « " +
    normaliserNiveauRisqueInvestisseurESG_(
      diagnostic.risque.label
    ) +
    " ». ";

  texte +=
    construirePhraseAlertesInvestisseurESG_(
      alertes
    ) +
    " ";

  texte +=
    "La qualité de lecture doit être appréciée conjointement au niveau de confiance (" +
    formaterScoreInvestisseurESG_(
      diagnostic.scores.niveauConfiance
    ) +
    ") et à la disponibilité des preuves (" +
    formaterScoreInvestisseurESG_(
      diagnostic.scores.preuves
    ) +
    ").";

  return texte;
}


/**
 * 2. Profil : retire les coordonnées personnelles du corps principal.
 */
function ajouterProfilEtPerimetreInvestisseurESG_(
  corps,
  profil
) {
  ajouterTitreSectionESG_(
    corps,
    "2. Profil et périmètre"
  );

  ajouterParagrapheESG_(
    corps,
    "Cette section décrit le périmètre organisationnel utilisé pour l’évaluation ESG. Les coordonnées personnelles du répondant ne sont pas reproduites dans le rapport destiné aux financeurs."
  );

  var lignes = [
    [
      "Nom de l’organisation",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "organizationName",
          "nomOrganisation"
        ]
      )
    ],
    [
      "Pays principal",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "mainCountry",
          "pays"
        ]
      )
    ],
    [
      "Type d’organisation",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "organizationType",
          "typeOrganisation"
        ]
      )
    ],
    [
      "Secteur principal",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "mainSector",
          "secteur"
        ]
      )
    ],
    [
      "Effectif",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "employeeCount",
          "effectif"
        ]
      )
    ],
    [
      "Chiffre d’affaires / budget annuel",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "annualRevenueOrBudget",
          "annualRevenue",
          "budgetAnnuel"
        ]
      )
    ],
    [
      "Année de création",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "creationYear",
          "anneeCreation"
        ]
      )
    ],
    [
      "Zone d’intervention",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "interventionZone",
          "zoneIntervention"
        ]
      )
    ],
    [
      "Politique ESG existante",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "existingESGPolicy"
        ]
      )
    ],
    [
      "Rapport ESG existant",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "existingESGReport"
        ]
      )
    ],
    [
      "Objectif du diagnostic",
      obtenirValeurProfilInvestisseurESG_(
        profil,
        [
          "diagnosticPurpose",
          "objectifDiagnostic"
        ]
      )
    ]
  ];

  var tableau =
    corps.appendTable(
      [
        [
          "Information",
          "Valeur"
        ]
      ].concat(lignes)
    );

  styliserTableauStandardESG_(
    tableau
  );

  corps.appendPageBreak();
}


function obtenirValeurProfilInvestisseurESG_(
  profil,
  cles
) {
  for (
    var i = 0;
    i < cles.length;
    i++
  ) {
    var valeur =
      profil[cles[i]];

    if (
      valeur !== undefined &&
      valeur !== null &&
      valeur !== ""
    ) {
      if (
        Array.isArray(valeur)
      ) {
        return valeur.join(
          ", "
        );
      }

      return String(valeur);
    }
  }

  return "Non renseigné";
}


/**
 * 3. Positionnement ESG : score agrégé et piliers seulement.
 */
function ajouterPositionnementInvestisseurESG_(
  corps,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "3. Positionnement ESG"
  );

  ajouterParagrapheESG_(
    corps,
    "Le positionnement ci-dessous synthétise les quatre dimensions du diagnostic. Le détail question par question est volontairement déplacé en annexe afin de privilégier une lecture décisionnelle."
  );

  var tableau =
    corps.appendTable([
      [
        "Dimension",
        "Score ajusté",
        "Lecture"
      ],
      [
        "Environnement",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.environnement
        ),
        obtenirLectureScoreSimpleESG_(
          diagnostic.scores.environnement
        )
      ],
      [
        "Social",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.social
        ),
        obtenirLectureScoreSimpleESG_(
          diagnostic.scores.social
        )
      ],
      [
        "Gouvernance",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.gouvernance
        ),
        obtenirLectureScoreSimpleESG_(
          diagnostic.scores.gouvernance
        )
      ],
      [
        "Préparation ESG",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.readiness
        ),
        obtenirLectureScoreSimpleESG_(
          diagnostic.scores.readiness
        )
      ],
      [
        "GLOBAL",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.globalAjuste
        ),
        diagnostic.maturite.label
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );

  ajouterSousTitreESG_(
    corps,
    "Capacité de démonstration"
  );

  var preuveData =
    corps.appendTable([
      [
        "Indicateur",
        "Score"
      ],
      [
        "Disponibilité des preuves",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.preuves
        )
      ],
      [
        "Qualité des données",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.qualiteDonnees
        )
      ],
      [
        "Niveau de confiance",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.niveauConfiance
        )
      ]
    ]);

  styliserTableauStandardESG_(
    preuveData
  );

  ajouterParagrapheESG_(
    corps,
    "Ces trois indicateurs décrivent la solidité documentaire du diagnostic. Ils ne remplacent pas une vérification indépendante des pièces lors d’une due diligence."
  ).setItalic(true);

  corps.appendPageBreak();
}


function obtenirLectureScoreSimpleESG_(
  score
) {
  score = Number(score || 0);

  if (score <= 20) {
    return "Critique";
  }

  if (score <= 40) {
    return "Faible";
  }

  if (score <= 60) {
    return "En structuration";
  }

  if (score <= 80) {
    return "Avancé";
  }

  return "Mature";
}


/**
 * V3.3 — Consolide les faiblesses par enjeu métier dans le corps
 * investisseur. Le détail question par question reste intégralement
 * disponible dans l'annexe technique.
 */
function consoliderFaiblessesParEnjeuInvestisseurESG_(
  faiblesses
) {
  var groupes = {};
  var ordre = [];

  (faiblesses || []).forEach(
    function(faiblesse) {
      var libelle =
        faiblesse.theme ||
        faiblesse.subtheme ||
        faiblesse.questionId ||
        "Enjeu ESG";

      var cle =
        String(libelle)
          .trim()
          .toLowerCase();

      if (!groupes[cle]) {
        groupes[cle] = {
          representant: faiblesse,
          nombre: 1
        };
        ordre.push(cle);
        return;
      }

      groupes[cle].nombre += 1;

      if (
        calculerPrioriteEnjeuInvestisseurESG_(
          faiblesse
        ) >
        calculerPrioriteEnjeuInvestisseurESG_(
          groupes[cle].representant
        )
      ) {
        groupes[cle].representant =
          faiblesse;
      }
    }
  );

  return ordre.map(
    function(cle) {
      var groupe =
        groupes[cle];

      var copie =
        JSON.parse(
          JSON.stringify(
            groupe.representant
          )
        );

      copie.nombreElementsAssocies =
        groupe.nombre;

      return copie;
    }
  ).sort(
    function(a, b) {
      return (
        calculerPrioriteEnjeuInvestisseurESG_(b) -
        calculerPrioriteEnjeuInvestisseurESG_(a)
      );
    }
  );
}


function calculerPrioriteEnjeuInvestisseurESG_(
  faiblesse
) {
  var poids =
    100 - Number(
      faiblesse.score || 0
    );

  if (
    faiblesse.critique === true
  ) {
    poids += 1000;
  }

  var niveau =
    String(
      faiblesse.niveau || ""
    ).toUpperCase();

  if (niveau === "CRITIQUE") {
    poids += 500;
  } else if (niveau === "URGENT") {
    poids += 400;
  } else if (niveau === "DONNEE_MANQUANTE") {
    poids += 350;
  } else if (niveau === "PRIORITAIRE") {
    poids += 300;
  }

  return poids;
}


/**
 * 4. Enjeux matériels : top faiblesses + top forces.
 */
function ajouterEnjeuxMaterielsInvestisseurESG_(
  corps,
  diagnostic,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "4. Enjeux ESG matériels"
  );

  ajouterParagrapheESG_(
    corps,
    "Cette section concentre la lecture sur les sujets les plus significatifs issus du moteur AfriGreen24. Le terme « matériel » désigne ici les enjeux prioritaires au regard du diagnostic et ne constitue pas une déclaration formelle de matérialité au sens d’un référentiel externe."
  );

  var faiblesses =
    consoliderFaiblessesParEnjeuInvestisseurESG_(
      recommandations.faiblesses || []
    );

  var forces =
    recommandations.forces || [];

  var lignes = [
    [
      "Enjeu",
      "Pilier",
      "Situation",
      "Priorité",
      "Action immédiate"
    ]
  ];

  faiblesses
    .slice(
      0,
      ESG_INVESTOR_REPORT_CONFIG.materialIssuesLimit
    )
    .forEach(
      function(faiblesse) {
        lignes.push([
          faiblesse.theme ||
            faiblesse.subtheme ||
            faiblesse.questionId,
          obtenirLibellePilierInvestisseurESG_(
            faiblesse.pilier
          ),
          formaterScoreInvestisseurESG_(
            faiblesse.score
          ) +
            " — " +
            faiblesse.niveauLabel +
            (
              Number(
                faiblesse.nombreElementsAssocies || 1
              ) > 1
                ? " · " +
                  faiblesse.nombreElementsAssocies +
                  " éléments associés"
                : ""
            ),
          faiblesse.critique === true
            ? "Très élevée"
            : faiblesse.niveau === "URGENT"
              ? "Élevée"
              : "Prioritaire",
          faiblesse.recommandation ||
            "À traiter dans le plan d’action"
        ]);
      }
    );

  if (lignes.length === 1) {
    lignes.push([
      "Aucun enjeu faible ou critique",
      "—",
      "Aucun sujet sous le seuil de faiblesse",
      "Suivi",
      "Maintenir le suivi"
    ]);
  }

  var tableau =
    corps.appendTable(lignes);

  styliserTableauStandardESG_(
    tableau
  );

  ajouterSousTitreESG_(
    corps,
    "Forces pouvant soutenir la crédibilité ESG"
  );

  if (forces.length === 0) {
    ajouterParagrapheESG_(
      corps,
      "Aucune force majeure n’est identifiée au seuil retenu par le moteur."
    );
  } else {
    ajouterListeInvestisseurESG_(
      corps,
      forces
        .slice(0, 5)
        .map(
          function(force) {
            return (
              force.theme +
              " — score " +
              formaterScoreInvestisseurESG_(
                force.score
              ) +
              ". " +
              force.description
            );
          }
        )
    );
  }

  corps.appendPageBreak();
}


function obtenirLibellePilierInvestisseurESG_(
  pilier
) {
  var labels = {
    E: "Environnement",
    S: "Social",
    G: "Gouvernance",
    R: "Préparation ESG"
  };

  return labels[pilier] ||
    pilier ||
    "—";
}


/**
 * 5. Risques et leviers pour le financement.
 */
function ajouterRisquesEtLeviersFinancementESG_(
  corps,
  diagnostic,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "5. Risques ESG et leviers pour le financement"
  );

  ajouterParagrapheESG_(
    corps,
    "Les risques ci-dessous sont issus des alertes et points de faiblesse du diagnostic. Les incidences sont formulées en termes de préparation à la due diligence et de capacité à démontrer la maîtrise ESG ; aucune incidence financière chiffrée n’est estimée lorsque les données disponibles ne le permettent pas."
  );

  var alertes =
    diagnostic.alertesAvancees ||
    diagnostic.alertesCritiques ||
    [];

  var faiblesses =
    recommandations.faiblesses || [];

  var risques = [];
  var deja = {};

  alertes.forEach(
    function(alerte) {
      var key =
        alerte.questionId ||
        alerte.ruleCode ||
        alerte.code ||
        alerte.title;

      if (deja[key]) {
        return;
      }

      deja[key] = true;

      risques.push({
        enjeu:
          alerte.theme ||
          alerte.title ||
          "Alerte ESG",
        niveau:
          normaliserNiveauRisqueInvestisseurESG_(
            alerte.severity ||
            alerte.gravite ||
            "CRITIQUE"
          ),
        risque:
          alerte.message ||
          "Alerte ESG identifiée par le moteur.",
        incidence:
          construireIncidenceDueDiligenceESG_(
            alerte.theme ||
            alerte.title ||
            ""
          ),
        action:
          alerte.immediateAction ||
          alerte.recommandation ||
          "Documenter et traiter l’alerte prioritaire."
      });
    }
  );

  faiblesses.forEach(
    function(faiblesse) {
      if (
        risques.length >=
        ESG_INVESTOR_REPORT_CONFIG.mainRisksLimit
      ) {
        return;
      }

      var key =
        faiblesse.questionId ||
        faiblesse.theme;

      if (deja[key]) {
        return;
      }

      deja[key] = true;

      risques.push({
        enjeu:
          faiblesse.theme ||
          faiblesse.subtheme ||
          "Point de vigilance ESG",
        niveau:
          faiblesse.critique === true
            ? "CRITIQUE"
            : "ÉLEVÉ",
        risque:
          faiblesse.risque ||
          "Faiblesse ESG susceptible de nécessiter des justificatifs complémentaires.",
        incidence:
          construireIncidenceDueDiligenceESG_(
            faiblesse.theme || ""
          ),
        action:
          faiblesse.recommandation ||
          "Formaliser une mesure de maîtrise et sa preuve."
      });
    }
  );

  var lignes = [
    [
      "Enjeu",
      "Niveau",
      "Risque / exposition",
      "Incidence potentielle sur la due diligence",
      "Mesure de maîtrise"
    ]
  ];

  risques
    .slice(
      0,
      ESG_INVESTOR_REPORT_CONFIG.mainRisksLimit
    )
    .forEach(
      function(risque) {
        lignes.push([
          risque.enjeu,
          risque.niveau,
          risque.risque,
          risque.incidence,
          risque.action
        ]);
      }
    );

  if (lignes.length === 1) {
    lignes.push([
      "Aucune alerte majeure",
      "Suivi",
      "Aucune alerte critique majeure détectée sur les informations disponibles.",
      "Poursuivre la vérification documentaire lors de la due diligence.",
      "Maintenir le suivi ESG et la traçabilité des preuves."
    ]);
  }

  var tableau =
    corps.appendTable(lignes);

  styliserTableauStandardESG_(
    tableau
  );

  ajouterSousTitreESG_(
    corps,
    "Leviers de crédibilité"
  );

  var forces =
    recommandations.forces || [];

  if (forces.length === 0) {
    ajouterParagrapheESG_(
      corps,
      "Le diagnostic ne fait pas ressortir de force majeure au seuil défini. La priorité reste la formalisation des pratiques et des preuves."
    );
  } else {
    ajouterListeInvestisseurESG_(
      corps,
      forces
        .slice(0, 4)
        .map(
          function(force) {
            return (
              force.theme +
              " : " +
              force.description
            );
          }
        )
    );
  }

  corps.appendPageBreak();
}


function construireIncidenceDueDiligenceESG_(
  theme
) {
  var cle =
    String(theme || "")
      .toLowerCase();

  if (
    cle.indexOf("report") !== -1 ||
    cle.indexOf("transparen") !== -1 ||
    cle.indexOf("preuve") !== -1
  ) {
    return "Peut accroître les demandes de justification documentaire et limiter la démontrabilité de la performance ESG.";
  }

  if (
    cle.indexOf("gouvernance") !== -1 ||
    cle.indexOf("éthique") !== -1 ||
    cle.indexOf("conform") !== -1 ||
    cle.indexOf("corruption") !== -1
  ) {
    return "Peut conduire le financeur à approfondir les contrôles de gouvernance, de conformité et de responsabilité décisionnelle.";
  }

  if (
    cle.indexOf("sécurité") !== -1 ||
    cle.indexOf("travail") !== -1 ||
    cle.indexOf("plainte") !== -1 ||
    cle.indexOf("droits") !== -1
  ) {
    return "Peut entraîner une revue renforcée des dispositifs sociaux, des incidents et des mécanismes de prévention ou de recours.";
  }

  if (
    cle.indexOf("climat") !== -1 ||
    cle.indexOf("énergie") !== -1 ||
    cle.indexOf("eau") !== -1 ||
    cle.indexOf("déchet") !== -1 ||
    cle.indexOf("pollution") !== -1 ||
    cle.indexOf("biodivers") !== -1
  ) {
    return "Peut nécessiter des données environnementales complémentaires, des mesures de maîtrise et une trajectoire de suivi plus formalisée.";
  }

  return "Peut générer des demandes complémentaires lors de la due diligence afin d’établir la maîtrise du risque et la traçabilité des actions.";
}


/**
 * 6. Gouvernance / pilotage basée sur questions clés existantes.
 */
function ajouterGouvernanceEtPilotageInvestisseurESG_(
  corps,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "6. Gouvernance, preuves et capacité de pilotage"
  );

  ajouterParagrapheESG_(
    corps,
    "Cette lecture regroupe les éléments déterminants pour la capacité de l’organisation à piloter, documenter et expliquer sa démarche ESG à un tiers."
  );

  var ids = [
    "G-DEC-001",
    "G-RISK-001",
    "G-COMP-001",
    "G-REPORT-001",
    "G-TRANS-001",
    "R-PROOF-001",
    "R-DATA-001",
    "R-TARG-001"
  ];

  var lignes = [
    [
      "Capacité",
      "Situation",
      "Niveau documentaire",
      "Lecture"
    ]
  ];

  ids.forEach(
    function(id) {
      var resultat =
        trouverResultatQuestionInvestisseurESG_(
          diagnostic,
          id
        );

      if (!resultat) {
        return;
      }

      lignes.push([
        resultat.subtheme ||
          resultat.theme ||
          id,
        resultat.reponseManquante === true
          ? "Donnée manquante"
          : formaterScoreInvestisseurESG_(
              resultat.score
            ) +
            " — " +
            obtenirLectureScoreSimpleESG_(
              resultat.score
            ),
        obtenirNiveauDocumentaireInvestisseurESG_(
          resultat.niveauPreuve
        ),
        construireLecturePilotageQuestionESG_(
          resultat
        )
      ]);
    }
  );

  var tableau =
    corps.appendTable(lignes);

  styliserTableauStandardESG_(
    tableau
  );

  ajouterParagrapheESG_(
    corps,
    "Le niveau documentaire indique la solidité des éléments disponibles pour étayer une réponse. Il est indépendant du niveau de maturité du dispositif évalué."
  ).setItalic(true);

  ajouterSousTitreESG_(
    corps,
    "Qualité de l’information"
  );

  ajouterParagrapheESG_(
    corps,
    "Disponibilité des preuves : " +
    formaterScoreInvestisseurESG_(
      diagnostic.scores.preuves
    ) +
    ". Qualité des données : " +
    formaterScoreInvestisseurESG_(
      diagnostic.scores.qualiteDonnees
    ) +
    ". Niveau de confiance : " +
    formaterScoreInvestisseurESG_(
      diagnostic.scores.niveauConfiance
    ) +
    "."
  );

  if (
    diagnostic.nombreDonneesManquantes > 0
  ) {
    ajouterEncadreESG_(
      corps,
      "Données à compléter",
      construirePhraseDonneesManquantesInvestisseurESG_(
        diagnostic.nombreDonneesManquantes
      ),
      "WARNING"
    );
  }

  corps.appendPageBreak();
}


function trouverResultatQuestionInvestisseurESG_(
  diagnostic,
  questionId
) {
  var resultats =
    diagnostic.resultatsQuestions || [];

  for (
    var i = 0;
    i < resultats.length;
    i++
  ) {
    if (
      resultats[i].questionId ===
      questionId
    ) {
      return resultats[i];
    }
  }

  return null;
}


function construireLecturePilotageQuestionESG_(
  resultat
) {
  if (
    resultat.reponseManquante === true
  ) {
    return "Information insuffisante pour conclure.";
  }

  if (resultat.score <= 20) {
    return "Dispositif à formaliser en priorité.";
  }

  if (resultat.score <= 40) {
    return "Dispositif partiel ou encore faiblement structuré.";
  }

  if (resultat.score <= 60) {
    return "Dispositif en cours de structuration.";
  }

  if (resultat.score <= 80) {
    return "Dispositif avancé ; maintenir le suivi et la traçabilité.";
  }

  return "Dispositif mature selon les réponses du diagnostic.";
}


/**
 * 7. KPI : ne crée aucune cible chiffrée non fournie.
 */
function ajouterKPIEtTrajectoireInvestisseurESG_(
  corps,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "7. Indicateurs clés (KPI) et trajectoire de pilotage"
  );

  ajouterParagrapheESG_(
    corps,
    "Le moteur recommande les indicateurs ci-dessous pour renforcer le pilotage ESG. Lorsque le diagnostic ne contient pas de valeur de référence ou de cible chiffrée, le rapport n’en invente pas : la prochaine étape consiste à définir la valeur de référence, le propriétaire de la donnée et, le cas échéant, une cible approuvée."
  );

  var indicateurs =
    recommandations.indicateursRecommandes || [];

  var lignes = [
    [
      "Indicateur",
      "Unité",
      "Fréquence",
      "Responsable",
      "Étape suivante"
    ]
  ];

  indicateurs
    .slice(
      0,
      ESG_INVESTOR_REPORT_CONFIG.indicatorsLimit
    )
    .forEach(
      function(indicateur) {
        lignes.push([
          indicateur.label ||
            indicateur.indicatorId,
          indicateur.unit ||
            "À définir",
          indicateur.frequency ||
            "À définir",
          indicateur.responsible ||
            "À définir",
          "Établir ou consolider la valeur de référence, puis documenter la trajectoire de suivi."
        ]);
      }
    );

  if (lignes.length === 1) {
    lignes.push([
      "KPI ESG",
      "À définir",
      "À définir",
      "Direction / responsable ESG",
      "Définir un socle d’indicateurs cohérent avec les enjeux prioritaires."
    ]);
  }

  var tableau =
    corps.appendTable(lignes);

  styliserTableauStandardESG_(
    tableau
  );

  corps.appendPageBreak();
}


/**
 * 8. Plan d'action déterministe existant, synthétisé.
 */
function ajouterPlanActionInvestisseurESG_(
  corps,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "8. Plan d’action prioritaire"
  );

  ajouterParagrapheESG_(
    corps,
    "La feuille de route ci-dessous reprend exclusivement les actions déjà déterminées par le moteur ESG. Elle est organisée par horizon pour faciliter le suivi de l’exécution."
  );

  var plan =
    recommandations.planAction || {};

  ajouterHorizonPlanInvestisseurESG_(
    corps,
    "0–3 mois — sécuriser les risques prioritaires",
    plan.immediate_0_3_months || [],
    ESG_INVESTOR_REPORT_CONFIG
      .actionLimits
      .immediate
  );

  ajouterHorizonPlanInvestisseurESG_(
    corps,
    "3–6 mois — structurer les dispositifs",
    plan.short_term_3_6_months || [],
    ESG_INVESTOR_REPORT_CONFIG
      .actionLimits
      .shortTerm
  );

  /*
   * V3.3 : pagination adaptative.
   * On force une nouvelle page uniquement lorsque les deux horizons
   * sont suffisamment denses pour risquer une coupure de ligne.
   * Avec un petit bloc 6–24 mois, on laisse Google Docs utiliser
   * l'espace restant afin d'éviter une page presque vide.
   */
  var actionsCourtTermeSelectionnees =
    selectionnerActionsUniquesInvestisseurESG_(
      plan.short_term_3_6_months || [],
      ESG_INVESTOR_REPORT_CONFIG
        .actionLimits
        .shortTerm
    );

  var actionsStructurellesSelectionnees =
    selectionnerActionsUniquesInvestisseurESG_(
      plan.structural_6_24_months || [],
      ESG_INVESTOR_REPORT_CONFIG
        .actionLimits
        .structural
    );

  if (
    actionsCourtTermeSelectionnees.length >= 4 &&
    actionsStructurellesSelectionnees.length >= 3
  ) {
    corps.appendPageBreak();
  }

  ajouterHorizonPlanInvestisseurESG_(
    corps,
    "6–24 mois — consolider la trajectoire ESG",
    plan.structural_6_24_months || [],
    ESG_INVESTOR_REPORT_CONFIG
      .actionLimits
      .structural
  );

  corps.appendPageBreak();
}


function ajouterHorizonPlanInvestisseurESG_(
  corps,
  titre,
  actions,
  limite
) {
  ajouterSousTitreESG_(
    corps,
    titre
  );

  if (
    !actions ||
    actions.length === 0
  ) {
    ajouterParagrapheESG_(
      corps,
      "Aucune action spécifique n’est générée pour cet horizon selon les règles du moteur."
    );
    return;
  }

  var lignes = [
    [
      "Action",
      "Responsable suggéré",
      "Échéance",
      "Preuve attendue",
      "Indicateur"
    ]
  ];

  selectionnerActionsUniquesInvestisseurESG_(
    actions,
    limite
  )
    .forEach(
      function(action) {
        lignes.push([
          action.action || "",
          action.responsableSuggere ||
            "Direction générale",
          action.echeanceSuggeree ||
            "À planifier",
          action.preuveDeRealisation ||
            "Document de réalisation",
          action.indicateurDeSuivi ||
            "Indicateur à définir"
        ]);
      }
    );

  var tableau =
    corps.appendTable(lignes);

  styliserTableauStandardESG_(
    tableau
  );
}


function selectionnerActionsUniquesInvestisseurESG_(
  actions,
  limite
) {
  var sortie = [];
  var dejaVues = {};

  (actions || []).forEach(
    function(action) {
      if (
        sortie.length >= Number(limite || 0)
      ) {
        return;
      }

      var texte = String(
        action && action.action
          ? action.action
          : ""
      )
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      var cle =
        texte ||
        String(
          action && action.questionId
            ? action.questionId
            : sortie.length
        );

      if (dejaVues[cle]) {
        return;
      }

      dejaVues[cle] = true;
      sortie.push(action);
    }
  );

  return sortie;
}


/**
 * 9. Conclusion financeur.
 */
function ajouterConclusionFinanceurInvestisseurESG_(
  corps,
  profil,
  diagnostic,
  recommandations
) {
  ajouterTitreSectionESG_(
    corps,
    "9. Conclusion pour le financeur"
  );

  var organisation =
    profil.organizationName ||
    profil.nomOrganisation ||
    "L’organisation";

  var priorite =
    recommandations.prioritePrincipale ||
    {};

  var actionPrioritaire =
    priorite.action ||
    priorite.description ||
    "Traiter le principal point de vigilance identifié et documenter sa mise en œuvre.";

  ajouterSousTitreESG_(
    corps,
    "Lecture finale de décision"
  );

  ajouterParagrapheESG_(
    corps,
    "Pour une présentation à un financeur, l’enjeu central pour " +
    organisation +
    " est de convertir les écarts identifiés en mesures formalisées, documentées et suivies. La feuille de route du rapport permet de distinguer les actions immédiates des mesures de structuration et de consolidation à moyen terme."
  );

  ajouterEncadreESG_(
    corps,
    "Point de décision prioritaire",
    actionPrioritaire,
    "WARNING"
  );

  ajouterParagrapheESG_(
    corps,
    "La mise en œuvre et la traçabilité de cette priorité, puis des actions prévues aux horizons 3–6 mois et 6–24 mois, constituent les principaux leviers identifiés pour renforcer la préparation de l’organisation à une due diligence ESG. Le financeur demeure responsable de la vérification des pièces, hypothèses et informations utilisées dans sa propre décision."
  );

  ajouterParagrapheESG_(
    corps,
    "Le présent rapport constitue un outil de préparation et de structuration. Il ne constitue ni une certification, ni un avis d’investissement, ni une notation de crédit, ni une garantie de financement."
  ).setItalic(true);

  corps.appendPageBreak();
}


/**
 * Annexe A : méthodologie et limites.
 */
function ajouterAnnexeMethodologieInvestisseurESG_(
  corps,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "Annexe A. Méthodologie et limites"
  );

  ajouterParagrapheESG_(
    corps,
    "Le diagnostic AfriGreen24 repose sur 50 questions structurées autour des piliers Environnement, Social, Gouvernance et Préparation ESG. Les réponses sont converties en scores déterministes selon la grille de maturité du moteur, puis pondérées selon les règles configurées dans l’application."
  );

  ajouterParagrapheESG_(
    corps,
    "Les niveaux de preuve sont évalués séparément de la maturité. La qualité des données et le niveau de confiance servent à apprécier la solidité documentaire du diagnostic. Les alertes critiques peuvent entraîner des ajustements du score ou du niveau de risque selon les règles du moteur."
  );

  ajouterParagrapheESG_(
    corps,
    "Les références associées aux questions servent de points d’orientation méthodologique. Le présent document ne constitue pas une déclaration de conformité à un référentiel externe et n’a pas fait l’objet d’une assurance indépendante."
  );

  var tableau =
    corps.appendTable([
      [
        "Élément méthodologique",
        "Résultat"
      ],
      [
        "Questions analysées",
        String(
          (diagnostic.resultatsQuestions || [])
            .length
        )
      ],
      [
        "Données manquantes",
        String(
          diagnostic.nombreDonneesManquantes ||
          0
        )
      ],
      [
        "Score de preuves",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.preuves
        )
      ],
      [
        "Qualité des données",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.qualiteDonnees
        )
      ],
      [
        "Niveau de confiance",
        formaterScoreInvestisseurESG_(
          diagnostic.scores.niveauConfiance
        )
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );

  corps.appendPageBreak();
}


/**
 * Annexe B : conserve la granularité des 50 questions.
 */
function ajouterAnnexeDiagnosticDetailleInvestisseurESG_(
  corps,
  diagnostic
) {
  ajouterTitreSectionESG_(
    corps,
    "Annexe B. Diagnostic technique détaillé"
  );

  ajouterParagrapheESG_(
    corps,
    "Cette annexe conserve le niveau de détail nécessaire à la traçabilité du diagnostic. Elle n’est pas destinée à remplacer la vérification documentaire du financeur."
  );

  var resultats =
    diagnostic.resultatsQuestions || [];

  var groupes = {
    E: [],
    S: [],
    G: [],
    R: []
  };

  resultats.forEach(
    function(resultat) {
      if (
        groupes[resultat.pilier]
      ) {
        groupes[resultat.pilier]
          .push(resultat);
      }
    }
  );

  [
    "E",
    "S",
    "G",
    "R"
  ].forEach(
    function(pilier) {
      ajouterSousTitreESG_(
        corps,
        obtenirLibellePilierInvestisseurESG_(
          pilier
        )
      );

      var lignes = [
        [
          "N°",
          "Thème / sous-thème",
          "Score",
          "Preuve",
          "Statut"
        ]
      ];

      groupes[pilier].forEach(
        function(resultat) {
          lignes.push([
            String(
              resultat.numero || ""
            ),
            (
              resultat.theme || ""
            ) +
            (
              resultat.subtheme
                ? " — " +
                  resultat.subtheme
                : ""
            ),
            resultat.nonApplicable === true
              ? "N/A"
              : resultat.reponseManquante === true
                ? "Manquant"
                : formaterScoreInvestisseurESG_(
                    resultat.score
                  ),
            obtenirLibellePreuveESG_(
              resultat.niveauPreuve
            ),
            resultat.reponseManquante === true
              ? "Donnée manquante"
              : obtenirLectureScoreSimpleESG_(
                  resultat.score
                )
          ]);
        }
      );

      var tableau =
        corps.appendTable(lignes);

      styliserTableauStandardESG_(
        tableau
      );
    }
  );

  corps.appendPageBreak();
}


/**
 * Annexe C : la transparence numérique est maintenue mais
 * retirée du corps de décision principal.
 */
function ajouterAnnexeTransparenceNumeriqueInvestisseurESG_(
  corps,
  diagnosticDigital
) {
  if (
    !diagnosticDigital ||
    diagnosticDigital.success !== true
  ) {
    return;
  }

  ajouterTitreSectionESG_(
    corps,
    "Annexe C. Transparence numérique ESG"
  );

  ajouterParagrapheESG_(
    corps,
    "La transparence numérique est une analyse complémentaire de la capacité de l’organisation à rendre ses engagements et informations ESG accessibles. Elle ne modifie pas le score ESG principal."
  );

  var niveau =
    diagnosticDigital.niveau &&
    diagnosticDigital.niveau.label
      ? diagnosticDigital.niveau.label
      : "Non déterminé";

  var tableau =
    corps.appendTable([
      [
        "Indicateur",
        "Résultat"
      ],
      [
        "Score de transparence numérique ESG",
        formaterScoreInvestisseurESG_(
          diagnosticDigital.scoreGlobal
        )
      ],
      [
        "Niveau",
        niveau
      ]
    ]);

  styliserTableauStandardESG_(
    tableau
  );

  var details =
    diagnosticDigital.detailScores || {};

  var detailsTable =
    corps.appendTable([
      [
        "Dimension",
        "Score"
      ],
      [
        "Site internet et publication ESG",
        formaterScoreInvestisseurESG_(
          Number(details.siteWeb || 0)
        )
      ],
      [
        "LinkedIn et présence professionnelle",
        formaterScoreInvestisseurESG_(
          Number(details.linkedin || 0)
        )
      ],
      [
        "Communication ESG",
        formaterScoreInvestisseurESG_(
          Number(details.communicationESG || 0)
        )
      ],
      [
        "Collecte et suivi numérique",
        formaterScoreInvestisseurESG_(
          Number(details.automatisation || 0)
        )
      ]
    ]);

  styliserTableauStandardESG_(
    detailsTable
  );

  if (
    diagnosticDigital.resume &&
    diagnosticDigital.resume.message
  ) {
    ajouterParagrapheESG_(
      corps,
      diagnosticDigital.resume.message
    );
  }
}


/**
 * Test déterministe du générateur investisseur.
 * Ne fait aucun appel HumbleOS.
 */
function TEST_ESG_RAPPORT_INVESTISSEUR_V3() {
  var profil = {
    organizationName:
      "EcoNova Investor Test",
    mainCountry:
      "Côte d'Ivoire",
    organizationType:
      "Entreprise",
    mainSector:
      "Solutions environnementales",
    employeeCount:
      "42",
    annualRevenueOrBudget:
      "1,35 M EUR",
    creationYear:
      "2019",
    interventionZone:
      "Afrique de l’Ouest",
    existingESGPolicy:
      "Oui",
    existingESGReport:
      "Non",
    diagnosticPurpose: [
      "Améliorer la préparation au financement"
    ]
  };

  var reponses = {};

  obtenirQuestionsESG()
    .forEach(
      function(question) {
        reponses[question.question_id] = {
          value: 3,
          evidenceLevel: "MEDIUM",
          comment:
            "Réponse de test investisseur."
        };
      }
    );

  if (
    reponses["E-ENER-001"]
  ) {
    reponses["E-ENER-001"] = {
      value: 4,
      evidenceLevel: "STRONG"
    };
  }

  if (
    reponses["S-GRM-001"]
  ) {
    reponses["S-GRM-001"] = {
      value: 0,
      evidenceLevel: "NONE"
    };
  }

  if (
    reponses["G-REPORT-001"]
  ) {
    reponses["G-REPORT-001"] = {
      value: 0,
      evidenceLevel: "MEDIUM"
    };
  }

  var analyse =
    executerDiagnosticEtRecommandationsESG(
      reponses
    );

  var rapport =
    genererRapportInvestisseurESGV3(
      profil,
      analyse,
      null,
      []
    );

  Logger.log(
    JSON.stringify(
      {
        success:
          rapport.success,
        version:
          rapport.version,
        reportId:
          rapport.reportId,
        score:
          rapport.scoreGlobal,
        docUrl:
          rapport.docUrl,
        pdfUrl:
          rapport.pdfUrl
      },
      null,
      2
    )
  );

  if (
    !rapport.success ||
    !rapport.pdfUrl
  ) {
    throw new Error(
      "Le test du rapport investisseur ESG a échoué."
    );
  }

  return rapport;
}
