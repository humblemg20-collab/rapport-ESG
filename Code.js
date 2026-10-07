/**
 * ============================================================
 * AFRIGREEN24 — ESG INTELLIGENCE PLATFORM
 * VERSION 2.0.1 — REWRITE FACTS STABLE
 * ============================================================
 *
 * Ce fichier devient le contrôleur principal.
 *
 * Dépendances existantes conservées :
 * - ESGQuestions.gs
 * - ESGScoring.gs
 * - ESGCriticalAlerts.gs
 * - ESGRecommendations.gs
 * - ESGReportGenerator.gs
 * - ESGDataStore.gs
 */

var AFRIGREEN_V2_CONFIG = {
  version: "2.0.0",

  appName:
    "AfriGreen24 — ESG Intelligence Score & Report",

  reportFolder:
    "AfriGreen24 - Rapports ESG",

  contactEmail:
    "afrigreen24@gmail.com",

  colours: {
    primary: "#176B4D",
    secondary: "#E9F5EF",
    dark: "#1F2937",
    grey: "#6B7280",
    light: "#F3F4F6",
    warning: "#B45309",
    critical: "#B91C1C"
  }
};


/**
 * ============================================================
 * WEB APP
 * ============================================================
 */

function doGet() {
  var template =
    HtmlService.createTemplateFromFile(
      "Index"
    );

  return template
    .evaluate()
    .setTitle(
      AFRIGREEN_V2_CONFIG.appName
    )
    .addMetaTag(
      "viewport",
      "width=device-width, initial-scale=1"
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
    
}


function include(
  fileName
) {
  return HtmlService
    .createHtmlOutputFromFile(
      fileName
    )
    .getContent();
}


/**
 * Données nécessaires à l’interface.
 */
function obtenirDonneesApplicationV2() {
  return {
    success: true,

    app: {
      name:
        AFRIGREEN_V2_CONFIG.appName,

      version:
        AFRIGREEN_V2_CONFIG.version,

      contactEmail:
        AFRIGREEN_V2_CONFIG.contactEmail
    },

    questionnaire:
      obtenirQuestionnaireESG(),

    digitalQuestions:
      obtenirQuestionsDigitalesV2(),

    offres:
      obtenirOffresAfriGreen24V2()
  };
}


/**
 * Soumission principale de l’application.
 */
function soumettreDiagnosticV2(
  payload
) {
  var verrou =
    LockService.getScriptLock();

  if (
    !verrou.tryLock(30000)
  ) {
    throw new Error(
      "Une autre génération est en cours. Veuillez réessayer dans quelques secondes."
    );
  }

  try {
    payload = payload || {};

    var profil =
      payload.profil || {};

    var reponsesESG =
      payload.reponsesESG || {};

    var reponsesDigitales =
      payload.reponsesDigitales || {};

    var intake =
      normaliserContexteIntakeESG_(
        payload.intake || {}
      );

    var consentements =
      normaliserConsentementsV2_(
        payload.consentements
      );

    /*
     * ========================================================
     * 1. VALIDATION PROFIL
     * ========================================================
     */
    validerProfilV2_(
      profil
    );

    if (
      consentements.diagnostic !== true
    ) {
      throw new Error(
        "Le consentement au traitement des données est nécessaire pour générer le diagnostic."
      );
    }

    /*
     * ========================================================
     * 2. MOTEUR ESG DÉTERMINISTE
     * ========================================================
     *
     * APPS SCRIPT RESTE LA SOURCE DE VÉRITÉ :
     * - scores
     * - pondérations
     * - maturité
     * - risque
     * - preuves
     * - alertes
     * - recommandations
     * - plan d'action
     * - indicateurs
     *
     * HumbleOS ne calcule et ne décide rien.
     */
    var analyseESG =
      executerDiagnosticEtRecommandationsESG(
        reponsesESG
      );

    /*
     * ========================================================
     * 3. DIAGNOSTIC NUMÉRIQUE DÉTERMINISTE
     * ========================================================
     */
    var diagnosticDigitalInterne =
      analyserDiagnosticDigitalV2(
        reponsesDigitales
      );

    var diagnosticDigitalPublic =
      construireDiagnosticDigitalPublicV2_(
        diagnosticDigitalInterne
      );


    /*
     * ========================================================
     * 3B. MODÈLE CANONIQUE ESG_REPORT_SCHEMA_V1
     * ========================================================
     *
     * Le rapport V3 historique reste disponible pendant la
     * migration, mais toute nouvelle architecture passe déjà
     * par le contrat canonique et sa validation.
     */
    var canonicalModel =
      adapterAnalyseLegacyVersSchemaESGV1(
        profil,
        analyseESG,
        diagnosticDigitalPublic,
        {
          profile:
            ESG_REPORT_PROFILE_V1
              .DIAGNOSTIC,

          rawResponses:
            reponsesESG,

          intake:
            intake
        }
      );


    /*
     * ========================================================
     * 3C. EVIDENCE ENGINE V1
     * ========================================================
     */
    var evidenceEngineResult =
      executerEvidenceEngineESGV1(
        canonicalModel
      );


    canonicalModel =
      evidenceEngineResult.model;


    /*
     * ========================================================
     * 3D. DATA QUALITY ENGINE V1
     * ========================================================
     */
    var dataQualityEngineResult =
      executerDataQualityEngineESGV1(
        canonicalModel
      );


    canonicalModel =
      dataQualityEngineResult.model;


    var canonicalValidation =
      validerESGReportSchemaV1(
        canonicalModel
      );


    if (
      canonicalValidation.valid !==
      true
    ) {
      throw new Error(
        "ESG_REPORT_SCHEMA_V1 invalide : " +
        canonicalValidation
          .errors
          .join(
            " | "
          )
      );
    }

    /*
     * ========================================================
     * 3E. ROUTAGE DU MOTEUR DOCUMENTAIRE
     * ========================================================
     *
     * LEGACY_V3 reste le défaut tant que le Snapshot V1
     * n'a pas passé les smoke tests Apps Script.
     *
     * Pour activer le nouveau moteur sans modifier le code :
     * Script Property ESG_REPORT_ENGINE_MODE = SNAPSHOT_V1
     */
    var reportEngineMode =
      obtenirModeMoteurRapportESGV2_();


    /*
     * ========================================================
     * 4. QUALIFICATION COMMERCIALE
     * ========================================================
     *
     * Elle utilise exclusivement la vérité déterministe.
     */
    var qualification =
      qualifierProspectV2(
        profil,
        analyseESG,
        diagnosticDigitalInterne,
        consentements
      );

    /*
     * ========================================================
     * 5. OFFRES AFRIGREEN24
     * ========================================================
     */
    var offres =
      selectionnerOffresAfriGreen24V2(
        qualification.afriGreen24
      );

    /*
     * ========================================================
     * 6. COPIES DE PRÉSENTATION
     * ========================================================
     *
     * Les objets déterministes restent intacts.
     * HumbleOS ne peut agir que sur des copies destinées
     * à l'affichage dans le rapport final.
     */
    var analyseESGPresentation =
      clonerObjetESGRewrite_(
        analyseESG
      );

    var diagnosticDigitalPresentation =
      clonerObjetESGRewrite_(
        diagnosticDigitalPublic
      );

    var aiRewrite = {
      attempted:
        false,

      applied:
        false,

      providerUsed:
        "DETERMINISTIC_SAFE_FALLBACK",

      providerFallbackUsed:
        false,

      fallbackCount:
        0,

      blockCount:
        0,

      attempts:
        []
    };

    /*
     * ========================================================
     * 7. HUMBLEOS — RÉDACTION FINALE UNIQUEMENT
     * ========================================================
     *
     * Un seul POST maximum.
     * Aucun retry.
     *
     * Si HumbleOS échoue ou retourne une sortie invalide :
     * le rapport continue avec le contenu Apps Script.
     */
    if (
      reportEngineMode ===
      "LEGACY_V3"
    ) {
      try {
        var modeleRedactionESG =
        buildESGReportTextModel_(
          profil,
          analyseESG,
          diagnosticDigitalPublic
        );

      var payloadRewriteESG =
        buildESGRewritePayload_(
          modeleRedactionESG
        );

      aiRewrite.blockCount =
        payloadRewriteESG.texts.length;

      if (
        payloadRewriteESG.texts.length > 0
      ) {
        aiRewrite.attempted =
          true;

        /*
         * Protection déterministe des faits numériques.
         * Cette étape est exécutée UNE SEULE FOIS, ici.
         * Les helpers de protection vivent exclusivement dans
         * ESG_HumbleOS_Rewrite_Only.gs.
         */
        var protectionRewriteESG =
          protectPayloadESGRewrite_(
            payloadRewriteESG
          );

        var payloadProtegeESG =
          protectionRewriteESG.protectedPayload;

        var replacementsByIdESG =
          protectionRewriteESG.replacementsById;

        var aiGatewayRewrite =
          reecrireRapportESGAvecAIGateway_(
            payloadProtegeESG
          );

        var sortieRewriteESG =
          aiGatewayRewrite.output;

        aiRewrite.providerUsed =
          aiGatewayRewrite.providerUsed ||
          "DETERMINISTIC_SAFE_FALLBACK";

        aiRewrite.providerFallbackUsed =
          aiGatewayRewrite.fallbackUsed ===
          true;

        aiRewrite.attempts =
          aiGatewayRewrite.attempts ||
          [];

        var validationRewriteESG =
          validateESGRewriteOutput_(
            payloadProtegeESG,
            sortieRewriteESG
          );

        if (
          validationRewriteESG.valid !== true
        ) {
          throw new Error(
            "HumbleOS ESG — sortie Rewrite invalide : " +
            validationRewriteESG.errors.join(" | ")
          );
        }

        var restaurationRewriteESG =
          restoreOutputESGRewrite_(
            sortieRewriteESG,
            replacementsByIdESG
          );

        var sortieSecuriseeESG =
          applyESGRewriteSafetyFallback_(
            payloadRewriteESG,
            restaurationRewriteESG.output,
            profil
          );

        /*
         * Les échecs de restauration sont des fallbacks de bloc,
         * au même titre qu'un contrôle factuel échoué.
         */
        var fallbackMapESG = {};

        (
          restaurationRewriteESG.failed_ids || []
        ).forEach(
          function(id) {
            fallbackMapESG[id] = true;
          }
        );

        (
          sortieSecuriseeESG.fallback_ids || []
        ).forEach(
          function(id) {
            fallbackMapESG[id] = true;
          }
        );

        sortieSecuriseeESG.fallback_ids =
          Object.keys(
            fallbackMapESG
          );

        aiRewrite.fallbackCount =
          sortieSecuriseeESG
            .fallback_ids
            .length;

        mergeESGRewrittenTexts_(
          analyseESGPresentation,
          diagnosticDigitalPresentation,
          sortieSecuriseeESG.output
        );

        aiRewrite.applied =
          true;

        console.log(
          "ESG AI Rewrite — provider=" +
          aiRewrite.providerUsed +
          " — " +
          payloadRewriteESG.texts.length +
          " bloc(s), fallback factuel : " +
          aiRewrite.fallbackCount +
          "."
        );
      }

    } catch (
      erreurRewriteESG
    ) {
      /*
       * Le produit ne dépend jamais d'un provider IA.
       * OpenAI puis HumbleOS ont échoué : les copies de
       * présentation restent déterministes.
       */
      console.error(
        "ESG AI Rewrite indisponible — rédaction déterministe conservée : " +
        (
          erreurRewriteESG &&
          erreurRewriteESG.message
            ? erreurRewriteESG.message
            : erreurRewriteESG
        )
      );

      analyseESGPresentation =
        clonerObjetESGRewrite_(
          analyseESG
        );

      diagnosticDigitalPresentation =
        clonerObjetESGRewrite_(
          diagnosticDigitalPublic
        );

      aiRewrite.providerUsed =
        "DETERMINISTIC_SAFE_FALLBACK";

      aiRewrite.applied =
          false;
      }
    } else {
      /*
       * Le nouveau Snapshot V1 possède sa propre génération
       * narrative par blocs : OpenAI primary → HumbleOS fallback.
       * On évite donc un double appel IA.
       */
      aiRewrite = {
        attempted:
          false,

        applied:
          false,

        providerUsed:
          "DELEGATED_TO_SNAPSHOT_RENDERER",

        providerFallbackUsed:
          false,

        fallbackCount:
          0,

        blockCount:
          0,

        attempts:
          []
      };
    }

    /*
     * ========================================================
     * 8. GÉNÉRATION DU RAPPORT ESG
     * ========================================================
     *
     * La structure, les scores et les tableaux restent ceux
     * du générateur existant.
     *
     * Seuls les champs rédactionnels autorisés des copies
     * de présentation peuvent avoir été reformulés.
     */
    var rapport =
      genererRapportSelonMoteurESGV2_(
        reportEngineMode,
        profil,
        analyseESGPresentation,
        diagnosticDigitalPresentation,
        offres,
        canonicalModel
      );


    if (
      rapport &&
      rapport.aiGeneration
    ) {
      aiRewrite =
        rapport.aiGeneration;
    }

    /*
     * ========================================================
     * 9. STOCKAGE COMPLET
     * ========================================================
     */
    var stockage =
      enregistrerDiagnosticCompletV2(
        profil,
        reponsesESG,
        reponsesDigitales,
        rapport,
        diagnosticDigitalInterne,
        qualification,
        consentements
      );

    /*
     * ========================================================
     * 10. RÉPONSE À L’APPLICATION
     * ========================================================
     */
    return {
      success: true,

      version:
        AFRIGREEN_V2_CONFIG.version,

      reportId:
        rapport.reportId,

      organisation:
        rapport.organisation,

      scoreESG:
        rapport.scoreGlobal,

      maturite:
        rapport.maturite,

      risque:
        rapport.risque,

      scoreDigital:
        diagnosticDigitalPublic
          .scoreGlobal,

      niveauDigital:
        diagnosticDigitalPublic
          .niveau,

      resumeDigital:
        diagnosticDigitalPublic
          .resume,

      recommandationsDigitales:
        diagnosticDigitalPublic
          .recommandations,

      docUrl:
        rapport.docUrl,

      pdfUrl:
        rapport.pdfUrl,

      pdfDownloadUrl:
        rapport.pdfDownloadUrl,

      offresAfriGreen24:
        offres,

      spreadsheetUrl:
        stockage.spreadsheetUrl,

      aiRewrite:
        aiRewrite,

      /*
       * Alias temporaire pour compatibilité avec d'éventuels
       * consommateurs historiques. À retirer après migration.
       */
      humbleOSRewrite:
        aiRewrite,

      reportEngineMode:
        reportEngineMode,

      canonicalModel: {
        schemaVersion:
          canonicalModel.schemaVersion,

        valid:
          canonicalValidation.valid,

        warnings:
          canonicalValidation.warnings ||
          [],

        entryMode:
          canonicalModel
            .intake
            .entryMode,

        sourceDocuments:
          canonicalModel
            .intake
            .sourceDocuments
            .length,

        evidenceCount:
          canonicalModel
            .evidence
            .length,

        evidenceCoverageScore:
          canonicalModel
            .scores
            .evidenceCoverageScore,

        dataConfidenceScore:
          canonicalModel
            .scores
            .dataConfidenceScore,

        dataQualityMethodology:
          canonicalModel
            .dataQualityProfile
            .methodologyVersion
      },

      message:
        "Votre diagnostic ESG et votre rapport ont été générés avec succès."
    };

  } catch (
    erreur
  ) {

    console.error(
      erreur.stack ||
      erreur.message ||
      erreur
    );

    throw new Error(
      erreur.message ||
      "La génération du diagnostic a échoué."
    );

  } finally {

    verrou.releaseLock();
  }
}


/**
 * ============================================================
 * ROUTEUR DU MOTEUR DOCUMENTAIRE ESG
 * ============================================================
 */
function obtenirModeMoteurRapportESGV2_() {
  var value =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          "ESG_REPORT_ENGINE_MODE"
        ) ||
      "LEGACY_V3"
    )
      .trim()
      .toUpperCase();

  if (
    [
      "LEGACY_V3",
      "SNAPSHOT_V1"
    ].indexOf(
      value
    ) === -1
  ) {
    console.warn(
      "ESG_REPORT_ENGINE_MODE invalide ; fallback LEGACY_V3 : " +
      value
    );

    return "LEGACY_V3";
  }

  return value;
}


function genererRapportSelonMoteurESGV2_(
  mode,
  profil,
  analyseESGPresentation,
  diagnosticDigitalPresentation,
  offres,
  canonicalModel
) {
  mode =
    String(
      mode ||
      "LEGACY_V3"
    ).toUpperCase();

  if (
    mode ===
    "SNAPSHOT_V1"
  ) {
    var snapshot =
      genererSnapshotESGV1(
        canonicalModel,
        profil
      );

    /*
     * Contrat de compatibilité temporaire avec le datastore
     * et la réponse applicative V2.
     */
    snapshot.organisation =
      profil.organizationName ||
      profil.nomOrganisation ||
      canonicalModel
        .organization
        .name ||
      "";

    snapshot.scoreGlobal =
      canonicalModel
        .scores
        .esgOverallScoreV2;

    snapshot.maturite =
      analyseESGPresentation &&
      analyseESGPresentation
        .diagnostic
        ? analyseESGPresentation
            .diagnostic
            .maturite
        : null;

    snapshot.risque =
      analyseESGPresentation &&
      analyseESGPresentation
        .diagnostic
        ? analyseESGPresentation
            .diagnostic
            .risque
        : null;

    snapshot.diagnostic =
      analyseESGPresentation
        .diagnostic;

    snapshot.recommandations =
      analyseESGPresentation
        .recommandations;

    snapshot.diagnosticDigital =
      diagnosticDigitalPresentation;

    /*
     * Les offres restent dans l'application mais ne sont
     * jamais injectées dans le document white-label.
     */
    snapshot.offresAfriGreen24 =
      offres || [];

    return snapshot;
  }

  return genererRapportInvestisseurESGV3(
    profil,
    analyseESGPresentation,
    diagnosticDigitalPresentation,
    offres
  );
}


function TEST_ESG_REPORT_ENGINE_ROUTER_LOCAL() {
  var properties =
    PropertiesService
      .getScriptProperties();

  var oldValue =
    properties.getProperty(
      "ESG_REPORT_ENGINE_MODE"
    );

  try {
    properties.setProperty(
      "ESG_REPORT_ENGINE_MODE",
      "SNAPSHOT_V1"
    );

    var snapshot =
      obtenirModeMoteurRapportESGV2_();

    properties.setProperty(
      "ESG_REPORT_ENGINE_MODE",
      "INVALID_MODE"
    );

    var fallback =
      obtenirModeMoteurRapportESGV2_();

    return {
      success:
        snapshot ===
          "SNAPSHOT_V1" &&
        fallback ===
          "LEGACY_V3",

      snapshot:
        snapshot,

      fallback:
        fallback
    };

  } finally {
    if (
      oldValue ===
      null ||
      oldValue ===
      undefined
    ) {
      properties.deleteProperty(
        "ESG_REPORT_ENGINE_MODE"
      );
    } else {
      properties.setProperty(
        "ESG_REPORT_ENGINE_MODE",
        oldValue
      );
    }
  }
}


/**
 * Validation minimale du profil.
 */
function validerProfilV2_(
  profil
) {
  var champs = [
    {
      keys: [
        "organizationName",
        "nomOrganisation"
      ],
      label:
        "Nom de l’organisation"
    },
    {
      keys: [
        "responsibleName",
        "nomResponsable"
      ],
      label:
        "Nom du responsable"
    },
    {
      keys: [
        "professionalEmail",
        "email"
      ],
      label:
        "Email professionnel"
    },
    {
      keys: [
        "phone",
        "telephone"
      ],
      label:
        "Téléphone"
    }
  ];

  champs.forEach(
    function(champ) {
      var valeur =
        obtenirValeurObjetV2_(
          profil,
          champ.keys
        );

      if (!valeur) {
        throw new Error(
          champ.label +
          " est obligatoire."
        );
      }
    }
  );

  var email =
    String(
      obtenirValeurObjetV2_(
        profil,
        [
          "professionalEmail",
          "email"
        ]
      ) || ""
    ).trim();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email)
  ) {
    throw new Error(
      "L’adresse email professionnelle est invalide."
    );
  }
}


function obtenirValeurObjetV2_(
  objet,
  cles
) {
  objet = objet || {};

  for (
    var index = 0;
    index < cles.length;
    index++
  ) {
    var valeur =
      objet[
        cles[index]
      ];

    if (
      valeur !== undefined &&
      valeur !== null &&
      valeur !== ""
    ) {
      return valeur;
    }
  }

  return "";
}


function normaliserConsentementsV2_(
  consentements
) {
  consentements =
    consentements || {};

  return {
    diagnostic:
      consentements.diagnostic === true,

    afriGreen24:
      consentements.afriGreen24 === true,

    mbDigital:
      consentements.mbDigital === true,

    privacyNoticeAccepted:
      consentements
        .privacyNoticeAccepted === true,

    collectedAt:
      new Date().toISOString()
  };
}


/**
 * ============================================================
 * QUESTIONNAIRE NUMÉRIQUE
 * ============================================================
 */

var ESG_DIGITAL_QUESTIONS_V2 = [
  {
    id: "DIG-WEB-001",

    dimension:
      "siteWeb",

    category:
      "SITE_WEB",

    type:
      "single",

    question_text:
      "Quel est le niveau actuel de votre site internet et de la publication de vos engagements ESG ?",

    options: [
      {
        value: 0,
        score: 0,
        label:
          "L’organisation ne dispose pas de site internet.",
        needs: [
          "CREATION_SITE_WEB"
        ]
      },
      {
        value: 1,
        score: 20,
        label:
          "Un site existe, mais il est ancien, incomplet ou peu professionnel.",
        needs: [
          "REFONTE_SITE_WEB"
        ]
      },
      {
        value: 2,
        score: 40,
        label:
          "Le site présente l’organisation, mais pas ses engagements ESG.",
        needs: [
          "SECTION_ESG",
          "CONTENU_ESG"
        ]
      },
      {
        value: 3,
        score: 60,
        label:
          "Le site présente quelques actions ESG, mais sans structure complète.",
        needs: [
          "SECTION_ESG"
        ]
      },
      {
        value: 4,
        score: 80,
        label:
          "Le site contient une section ESG structurée et régulièrement actualisée.",
        needs: []
      },
      {
        value: 5,
        score: 100,
        label:
          "Le site publie clairement les politiques, objectifs, résultats, preuves et rapports ESG.",
        needs: []
      }
    ]
  },

  {
    id: "DIG-LINK-002",

    dimension:
      "linkedin",

    category:
      "LINKEDIN",

    type:
      "single",

    question_text:
      "Quel est le niveau de présence de votre organisation sur LinkedIn ?",

    options: [
      {
        value: 0,
        score: 0,
        label:
          "L’organisation ne dispose pas de page LinkedIn.",
        needs: [
          "CREATION_LINKEDIN"
        ]
      },
      {
        value: 1,
        score: 20,
        label:
          "Une page existe, mais elle est incomplète ou inactive.",
        needs: [
          "OPTIMISATION_LINKEDIN"
        ]
      },
      {
        value: 2,
        score: 40,
        label:
          "La page est complète, mais les publications sont très rares.",
        needs: [
          "STRATEGIE_CONTENU"
        ]
      },
      {
        value: 3,
        score: 60,
        label:
          "L’organisation publie occasionnellement ses actualités et initiatives.",
        needs: [
          "STRATEGIE_CONTENU"
        ]
      },
      {
        value: 4,
        score: 80,
        label:
          "Les publications sont régulières et présentent certaines actions ESG.",
        needs: []
      },
      {
        value: 5,
        score: 100,
        label:
          "Une stratégie LinkedIn structurée valorise régulièrement les résultats ESG et le dialogue avec les parties prenantes.",
        needs: []
      }
    ]
  },

  {
    id: "DIG-COM-003",

    dimension:
      "communicationESG",

    category:
      "COMMUNICATION_ESG",

    type:
      "single",

    question_text:
      "Comment communiquez-vous actuellement vos engagements, actions et résultats ESG ?",

    options: [
      {
        value: 0,
        score: 0,
        label:
          "Aucune communication ESG n’est réalisée.",
        needs: [
          "COMMUNICATION_ESG"
        ]
      },
      {
        value: 1,
        score: 20,
        label:
          "Les informations sont communiquées uniquement de manière informelle.",
        needs: [
          "COMMUNICATION_ESG"
        ]
      },
      {
        value: 2,
        score: 40,
        label:
          "Des documents ou présentations sont partagés ponctuellement.",
        needs: [
          "CONTENU_ESG"
        ]
      },
      {
        value: 3,
        score: 60,
        label:
          "Les actions sont communiquées sur un ou deux canaux numériques.",
        needs: [
          "STRATEGIE_CONTENU"
        ]
      },
      {
        value: 4,
        score: 80,
        label:
          "Les résultats sont communiqués régulièrement sur plusieurs canaux.",
        needs: []
      },
      {
        value: 5,
        score: 100,
        label:
          "L’organisation publie un reporting clair, régulier, multicanal et soutenu par des preuves.",
        needs: []
      }
    ]
  },

  {
    id: "DIG-DATA-004",

    dimension:
      "automatisation",

    category:
      "OUTILS_NUMERIQUES",

    type:
      "single",

    question_text:
      "Quels outils utilisez-vous pour collecter, centraliser et suivre vos données ESG ?",

    options: [
      {
        value: 0,
        score: 0,
        label:
          "Les données ne sont pas collectées ou sont uniquement conservées sur papier.",
        needs: [
          "CENTRALISATION_DONNEES"
        ]
      },
      {
        value: 1,
        score: 20,
        label:
          "Les données sont enregistrées dans plusieurs fichiers non centralisés.",
        needs: [
          "CENTRALISATION_DONNEES"
        ]
      },
      {
        value: 2,
        score: 40,
        label:
          "Des tableurs sont utilisés, mais sans tableau de bord commun.",
        needs: [
          "TABLEAU_DE_BORD"
        ]
      },
      {
        value: 3,
        score: 60,
        label:
          "Un système centralisé ou un tableau de bord simple est utilisé.",
        needs: [
          "AUTOMATISATION"
        ]
      },
      {
        value: 4,
        score: 80,
        label:
          "Les indicateurs sont centralisés et partiellement automatisés.",
        needs: []
      },
      {
        value: 5,
        score: 100,
        label:
          "La collecte, le contrôle, le suivi et le reporting sont largement automatisés.",
        needs: []
      }
    ]
  },

  {
    id: "DIG-PRIOR-005",

    dimension:
      "priorites",

    category:
      "PRIORITES",

    type:
      "multi",

    maxSelections:
      3,

    question_text:
      "Quelles sont vos trois principales priorités numériques ?",

    options: [
      {
        value:
          "CREATION_SITE_WEB",
        label:
          "Créer un site internet professionnel",
        needs: [
          "CREATION_SITE_WEB"
        ]
      },
      {
        value:
          "REFONTE_SITE_WEB",
        label:
          "Moderniser ou refaire le site internet",
        needs: [
          "REFONTE_SITE_WEB"
        ]
      },
      {
        value:
          "SECTION_ESG",
        label:
          "Créer une section ESG ou impact",
        needs: [
          "SECTION_ESG"
        ]
      },
      {
        value:
          "CREATION_LINKEDIN",
        label:
          "Créer ou structurer la page LinkedIn",
        needs: [
          "CREATION_LINKEDIN"
        ]
      },
      {
        value:
          "STRATEGIE_CONTENU",
        label:
          "Développer une stratégie de contenu",
        needs: [
          "STRATEGIE_CONTENU"
        ]
      },
      {
        value:
          "COMMUNICATION_ESG",
        label:
          "Mieux communiquer les actions ESG",
        needs: [
          "COMMUNICATION_ESG"
        ]
      },
      {
        value:
          "TABLEAU_DE_BORD",
        label:
          "Créer un tableau de bord",
        needs: [
          "TABLEAU_DE_BORD"
        ]
      },
      {
        value:
          "AUTOMATISATION",
        label:
          "Automatiser la collecte et le reporting",
        needs: [
          "AUTOMATISATION"
        ]
      },
      {
        value:
          "INTELLIGENCE_ARTIFICIELLE",
        label:
          "Intégrer des outils d’intelligence artificielle",
        needs: [
          "INTELLIGENCE_ARTIFICIELLE"
        ]
      },
      {
        value:
          "AUCUNE_PRIORITE",
        label:
          "Aucune priorité définie actuellement",
        needs: []
      }
    ]
  }
];


var MB_DIGITAL_SERVICES_V2 = {
  CREATION_SITE_WEB: {
    code:
      "CREATION_SITE_WEB",
    titre:
      "Création de site internet"
  },

  REFONTE_SITE_WEB: {
    code:
      "REFONTE_SITE_WEB",
    titre:
      "Refonte de site internet"
  },

  SECTION_ESG: {
    code:
      "SECTION_ESG",
    titre:
      "Création d’une section ESG"
  },

  CREATION_LINKEDIN: {
    code:
      "CREATION_LINKEDIN",
    titre:
      "Création de page LinkedIn"
  },

  OPTIMISATION_LINKEDIN: {
    code:
      "OPTIMISATION_LINKEDIN",
    titre:
      "Optimisation de page LinkedIn"
  },

  STRATEGIE_CONTENU: {
    code:
      "STRATEGIE_CONTENU",
    titre:
      "Stratégie éditoriale"
  },

  COMMUNICATION_ESG: {
    code:
      "COMMUNICATION_ESG",
    titre:
      "Communication ESG"
  },

  CONTENU_ESG: {
    code:
      "CONTENU_ESG",
    titre:
      "Création de contenus ESG"
  },

  CENTRALISATION_DONNEES: {
    code:
      "CENTRALISATION_DONNEES",
    titre:
      "Centralisation des données"
  },

  TABLEAU_DE_BORD: {
    code:
      "TABLEAU_DE_BORD",
    titre:
      "Tableau de bord numérique"
  },

  AUTOMATISATION: {
    code:
      "AUTOMATISATION",
    titre:
      "Automatisation des processus"
  },

  INTELLIGENCE_ARTIFICIELLE: {
    code:
      "INTELLIGENCE_ARTIFICIELLE",
    titre:
      "Solutions d’intelligence artificielle"
  }
};


/**
 * Version publique des cinq questions.
 *
 * Les correspondances commerciales internes
 * ne sont pas envoyées au navigateur.
 */
function obtenirQuestionsDigitalesV2() {
  return ESG_DIGITAL_QUESTIONS_V2
    .map(
      function(question) {
        return {
          id:
            question.id,

          category:
            question.category,

          type:
            question.type,

          maxSelections:
            question.maxSelections || null,

          question_text:
            question.question_text,

          options:
            question.options.map(
              function(option) {
                return {
                  value:
                    option.value,

                  label:
                    option.label
                };
              }
            )
        };
      }
    );
}


/**
 * Analyse complète interne.
 */
function analyserDiagnosticDigitalV2(
  reponses
) {
  reponses = reponses || {};

  var scores = {
    siteWeb: 0,
    linkedin: 0,
    communicationESG: 0,
    automatisation: 0
  };

  var reponsesNormalisees = {};

  var besoins = [];

  ESG_DIGITAL_QUESTIONS_V2
    .slice(
      0,
      4
    )
    .forEach(
      function(question) {
        var valeur =
          extraireValeurDigitaleV2_(
            reponses[
              question.id
            ]
          );

        var option =
          trouverOptionDigitaleV2_(
            question,
            valeur
          );

        if (!option) {
          option =
            question.options[0];
        }

        scores[
          question.dimension
        ] =
          Number(
            option.score || 0
          );

        reponsesNormalisees[
          question.id
        ] = {
          value:
            option.value,

          label:
            option.label,

          score:
            option.score
        };

        besoins =
          besoins.concat(
            option.needs || []
          );
      }
    );

  var priorites =
    extraireListeDigitaleV2_(
      reponses[
        "DIG-PRIOR-005"
      ]
    )
      .slice(
        0,
        3
      );

  var questionPriorites =
    ESG_DIGITAL_QUESTIONS_V2[4];

  priorites.forEach(
    function(code) {
      var option =
        trouverOptionDigitaleV2_(
          questionPriorites,
          code
        );

      if (option) {
        besoins =
          besoins.concat(
            option.needs || []
          );
      }
    }
  );

  besoins =
    supprimerDoublonsV2_(
      besoins
    );

  var scoreGlobal =
    Math.round(
      (
        scores.siteWeb +
        scores.linkedin +
        scores.communicationESG +
        scores.automatisation
      ) / 4
    );

  var niveau =
    determinerNiveauDigitalV2_(
      scoreGlobal
    );

  var recommandations =
    genererRecommandationsDigitalesV2_(
      scores
    );

  var services =
    besoins
      .map(
        function(code) {
          return (
            MB_DIGITAL_SERVICES_V2[
              code
            ] || null
          );
        }
      )
      .filter(
        function(service) {
          return service !== null;
        }
      );

  var scoreOpportunite =
    Math.min(
      100,
      Math.max(
        0,
        (
          100 -
          scoreGlobal
        ) +
        (
          besoins.length * 4
        )
      )
    );

  var prioriteCommerciale =
    scoreOpportunite >= 80
      ? "HAUTE"
      : scoreOpportunite >= 55
        ? "MOYENNE"
        : "FAIBLE";

  return {
    success: true,

    scoreGlobal:
      scoreGlobal,

    niveau:
      niveau,

    detailScores:
      scores,

    reponses:
      reponsesNormalisees,

    prioritesSelectionnees:
      priorites,

    besoinsDetectes:
      besoins,

    servicesRecommandes:
      services,

    recommandations:
      recommandations,

    resume:
      genererResumeDigitalV2_(
        scoreGlobal,
        niveau
      ),

    qualificationProspect: {
      qualifie:
        scoreOpportunite >= 45,

      scoreOpportunite:
        scoreOpportunite,

      priorite:
        prioriteCommerciale,

      contactCommercialRecommande:
        scoreOpportunite >= 55
    }
  };
}


function extraireValeurDigitaleV2_(
  reponse
) {
  if (
    reponse === null ||
    reponse === undefined
  ) {
    return null;
  }

  if (
    typeof reponse === "object" &&
    !Array.isArray(reponse)
  ) {
    return reponse.value;
  }

  return reponse;
}


function extraireListeDigitaleV2_(
  reponse
) {
  var valeur =
    extraireValeurDigitaleV2_(
      reponse
    );

  if (
    Array.isArray(valeur)
  ) {
    return valeur;
  }

  if (
    valeur === null ||
    valeur === undefined ||
    valeur === ""
  ) {
    return [];
  }

  return [
    valeur
  ];
}


function trouverOptionDigitaleV2_(
  question,
  valeur
) {
  for (
    var index = 0;
    index < question.options.length;
    index++
  ) {
    if (
      String(
        question.options[index].value
      ) ===
      String(valeur)
    ) {
      return question.options[index];
    }
  }

  return null;
}


function supprimerDoublonsV2_(
  valeurs
) {
  var trouvees = {};

  return (
    valeurs || []
  ).filter(
    function(valeur) {
      if (
        !valeur ||
        trouvees[valeur]
      ) {
        return false;
      }

      trouvees[valeur] = true;

      return true;
    }
  );
}


function determinerNiveauDigitalV2_(
  score
) {
  if (
    score <= 20
  ) {
    return {
      code: "CRITIQUE",
      label:
        "Transparence numérique critique"
    };
  }

  if (
    score <= 40
  ) {
    return {
      code: "FAIBLE",
      label:
        "Transparence numérique faible"
    };
  }

  if (
    score <= 60
  ) {
    return {
      code: "STRUCTURATION",
      label:
        "Transparence numérique en structuration"
    };
  }

  if (
    score <= 80
  ) {
    return {
      code: "AVANCE",
      label:
        "Transparence numérique avancée"
    };
  }

  return {
    code: "MATURE",
    label:
      "Transparence numérique mature"
  };
}


function genererRecommandationsDigitalesV2_(
  scores
) {
  var actions = [];

  if (
    scores.siteWeb < 60
  ) {
    actions.push(
      "Mettre en place ou moderniser un site professionnel permettant de présenter clairement l’organisation, ses engagements et ses preuves ESG."
    );
  } else if (
    scores.siteWeb < 80
  ) {
    actions.push(
      "Structurer une section ESG dédiée avec politiques, objectifs, indicateurs, résultats et documents téléchargeables."
    );
  }

  if (
    scores.linkedin < 60
  ) {
    actions.push(
      "Structurer la page LinkedIn de l’organisation et définir un calendrier de publications professionnelles."
    );
  }

  if (
    scores.communicationESG < 60
  ) {
    actions.push(
      "Élaborer une stratégie de communication ESG fondée sur des résultats mesurables et des preuves vérifiables."
    );
  }

  if (
    scores.automatisation < 60
  ) {
    actions.push(
      "Centraliser les données ESG dans un outil commun et définir des responsables, fréquences et contrôles de qualité."
    );
  }

  if (
    actions.length === 0
  ) {
    actions.push(
      "Maintenir la régularité, la qualité et la vérifiabilité des informations ESG publiées."
    );
  }

  return actions.slice(
    0,
    5
  );
}


function genererResumeDigitalV2_(
  score,
  niveau
) {
  if (
    score <= 40
  ) {
    return {
      message:
        "L’organisation dispose d’une visibilité numérique limitée. Une partie importante de ses engagements, actions ou résultats ESG risque de rester difficilement accessible aux partenaires et financeurs."
    };
  }

  if (
    score <= 60
  ) {
    return {
      message:
        "La présence numérique de l’organisation est en cours de structuration. Des canaux existent, mais la publication des engagements et des preuves ESG doit être renforcée."
    };
  }

  if (
    score <= 80
  ) {
    return {
      message:
        "L’organisation présente un bon niveau de transparence numérique. Elle doit maintenant renforcer la régularité, la cohérence et la traçabilité des informations publiées."
    };
  }

  return {
    message:
      "L’organisation présente un niveau mature de transparence numérique ESG, avec des informations accessibles, structurées et régulièrement actualisées."
  };
}


/**
 * Copie publique sans données commerciales MB Digital.
 */
function construireDiagnosticDigitalPublicV2_(
  diagnostic
) {
  return {
    success: true,

    scoreGlobal:
      diagnostic.scoreGlobal,

    niveau:
      diagnostic.niveau,

    detailScores:
      diagnostic.detailScores,

    recommandations:
      diagnostic.recommandations,

    resume:
      diagnostic.resume
  };
}


/**
 * ============================================================
 * QUALIFICATION DES PROSPECTS
 * ============================================================
 */

function qualifierProspectV2(
  profil,
  analyseESG,
  diagnosticDigital,
  consentements
) {
  var diagnostic =
    analyseESG.diagnostic;

  return {
    afriGreen24:
      qualifierProspectAfriGreen24V2_(
        profil,
        diagnostic,
        consentements
      ),

    mbDigital:
      qualifierProspectMBDigitalV2_(
        diagnosticDigital,
        consentements
      )
  };
}


function qualifierProspectAfriGreen24V2_(
  profil,
  diagnostic,
  consentements
) {
  var objectifs =
    obtenirValeurObjetV2_(
      profil,
      [
        "diagnosticPurpose",
        "objectifDiagnostic"
      ]
    );

  if (
    Array.isArray(objectifs)
  ) {
    objectifs =
      objectifs.join(
        " "
      );
  }

  objectifs =
    String(
      objectifs || ""
    ).toLowerCase();

  var interetFinancement =
    objectifs.indexOf(
      "financement"
    ) !== -1 ||
    objectifs.indexOf(
      "investisseur"
    ) !== -1 ||
    objectifs.indexOf(
      "partenaire"
    ) !== -1;

  var scoreQualification = 20;

  if (
    diagnostic.scores.globalAjuste <= 60
  ) {
    scoreQualification += 25;
  }

  if (
    diagnostic.scores.preuves <= 60
  ) {
    scoreQualification += 15;
  }

  if (
    diagnostic.scores.qualiteDonnees <= 60
  ) {
    scoreQualification += 10;
  }

  if (
    interetFinancement
  ) {
    scoreQualification += 25;
  }

  if (
    diagnostic.nombreAlertesCritiques > 0
  ) {
    scoreQualification += 10;
  }

  scoreQualification =
    Math.min(
      100,
      scoreQualification
    );

  var segment =
    scoreQualification >= 75
      ? "PRIORITAIRE"
      : scoreQualification >= 50
        ? "A_NURTURER"
        : "INFORMATIF";

  return {
    score:
      scoreQualification,

    segment:
      segment,

    interetFinancement:
      interetFinancement,

    guideRecommande:
      true,

    accompagnementRecommande:
      scoreQualification >= 50,

    contactAutorise:
      consentements.afriGreen24 === true
  };
}


function qualifierProspectMBDigitalV2_(
  diagnosticDigital,
  consentements
) {
  var qualification =
    diagnosticDigital
      .qualificationProspect;

  var autorisation =
    consentements.mbDigital === true;

  var statut =
    qualification.qualifie !== true
      ? "NON_PRIORITAIRE"
      : autorisation
        ? "A_CONTACTER"
        : "SANS_CONSENTEMENT_COMMERCIAL";

  return {
    qualifie:
      qualification.qualifie,

    score:
      qualification.scoreOpportunite,

    priorite:
      qualification.priorite,

    besoins:
      diagnosticDigital
        .besoinsDetectes,

    services:
      diagnosticDigital
        .servicesRecommandes,

    contactAutorise:
      autorisation,

    statut:
      statut
  };
}


/**
 * ============================================================
 * OFFRES PUBLIQUES AFRIGREEN24
 * ============================================================
 */

function obtenirOffresAfriGreen24V2() {

  var proprietes =
    PropertiesService
      .getScriptProperties();


  return [

    {
      code:
        "AFRIGREEN24_GUIDE",

      titre:
        "Guide AfriGreen24",

      description:
        "Un guide pratique pour mieux comprendre les exigences ESG, renforcer les dossiers et améliorer la préparation aux opportunités de financement vert.",

      url:
        proprietes.getProperty(
          "AFRIGREEN_GUIDE_URL"
        ) || "",

      cta:
        "Découvrir le Guide"
    },


    {
      code:
        "AFRIGREEN24_ACCOMPAGNEMENT",

      titre:
        "Accompagnement AfriGreen24",

      description:
        "Un accompagnement pour comprendre les résultats du diagnostic, prioriser les actions et renforcer la préparation de l’organisation au financement vert.",

      url:
        proprietes.getProperty(
          "AFRIGREEN_OFFERS_URL"
        ) || "",

      cta:
        "Découvrir les accompagnements"
    },


    {
      code:
        "HUMBLE_LABS_PRESENCE",

      titre:
        "Renforcer votre présence en ligne",

      description:
        "Rendez votre organisation visible, compréhensible et crédible en ligne grâce à une présence digitale professionnelle : site internet, LinkedIn et communication cohérente.",

      url:
        "https://digital.afrigreen24.com/#diagnostic",

      cta:
        "Faire mon diagnostic digital gratuit"
    }

  ];
}


function selectionnerOffresAfriGreen24V2(
  qualification
) {

  var catalogue =
    obtenirOffresAfriGreen24V2();


  return catalogue.filter(
    function(offre) {

      /*
       * Le Guide est toujours proposé.
       */
      if (
        offre.code ===
        "AFRIGREEN24_GUIDE"
      ) {
        return true;
      }


      /*
       * Humble Labs est toujours proposé
       * comme transformation complémentaire.
       */
      if (
        offre.code ===
        "HUMBLE_LABS_PRESENCE"
      ) {
        return true;
      }


      /*
       * L'accompagnement AfriGreen24
       * dépend de la qualification ESG.
       */
      if (
        offre.code ===
        "AFRIGREEN24_ACCOMPAGNEMENT"
      ) {
        return (
          qualification &&
          qualification
            .accompagnementRecommande === true
        );
      }


      return false;

    }
  );
}


/**
 * ============================================================
 * GÉNÉRATEUR DE RAPPORT V2
 * ============================================================
 *
 * Cette fonction utilise les fonctions de mise en page
 * déjà présentes dans ESGReportGenerator.gs.
 *
 * Elle ne fait jamais appel à :
 * ajouterOffreHumbleLabsDigitalESG_()
 */

function genererRapportESGV2(
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
    analyseESG.success !== true
  ) {
    throw new Error(
      "L’analyse ESG transmise au rapport est invalide."
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
    "Rapport ESG V2 - " +
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

  ajouterSommaireRapportV2_(
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

  ajouterTransparenceNumeriqueV2_(
    corps,
    diagnosticDigital
  );


  ajouterConclusionInstitutionnelleESGV2_(
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

  appliquerPartageRapportV2_(
    documentId,
    pdf.id
  );

  var docUrl =
    "https://docs.google.com/document/d/" +
    documentId +
    "/edit";

  return {
    success: true,

    version:
      AFRIGREEN_V2_CONFIG.version,

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

    pdfId:
      pdf.id,

    pdfUrl:
      pdf.url,

    pdfDownloadUrl:
      pdf.downloadUrl,

    folderId:
      dossier.getId(),

    folderUrl:
      dossier.getUrl(),

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
      offres
  };
}


function ajouterSommaireRapportV2_(
  corps
) {
  ajouterTitreSectionESG_(
    corps,
    "Sommaire"
  );

  [
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
  ].forEach(
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


function ajouterTransparenceNumeriqueV2_(
  corps,
  diagnosticDigital
) {
  if (
    !diagnosticDigital ||
    diagnosticDigital.success !== true
  ) {
    return;
  }

  corps.appendPageBreak();

  ajouterTitreSectionESG_(
    corps,
    "11. Transparence et visibilité numérique ESG"
  );

  ajouterParagrapheESG_(
    corps,
    "Cette analyse complémentaire mesure la capacité de l’organisation à rendre ses engagements, politiques, actions, preuves et résultats ESG accessibles à ses parties prenantes."
  );

  ajouterParagrapheESG_(
    corps,
    "Ce score ne constitue pas une mesure directe de la performance ESG et ne modifie pas le score ESG principal."
  ).setItalic(
    true
  );

  var tableauScore =
    corps.appendTable([
      [
        "Indicateur",
        "Résultat"
      ],
      [
        "Score de transparence numérique ESG",
        diagnosticDigital.scoreGlobal +
        " / 100"
      ],
      [
        "Niveau",
        diagnosticDigital.niveau.label
      ]
    ]);

  styliserTableauStandardESG_(
    tableauScore
  );

  ajouterSousTitreESG_(
    corps,
    "Résultats détaillés"
  );

  var details =
    diagnosticDigital
      .detailScores || {};

  var tableauDetails =
    corps.appendTable([
      [
        "Dimension",
        "Score"
      ],
      [
        "Site internet et publication ESG",
        (
          details.siteWeb || 0
        ) +
        " / 100"
      ],
      [
        "LinkedIn et présence professionnelle",
        (
          details.linkedin || 0
        ) +
        " / 100"
      ],
      [
        "Communication ESG",
        (
          details.communicationESG || 0
        ) +
        " / 100"
      ],
      [
        "Collecte et suivi numérique",
        (
          details.automatisation || 0
        ) +
        " / 100"
      ]
    ]);

  styliserTableauStandardESG_(
    tableauDetails
  );

  ajouterSousTitreESG_(
    corps,
    "Interprétation"
  );

  ajouterParagrapheESG_(
    corps,
    diagnosticDigital
      .resume
      .message
  );

}


function ajouterRessourcesAfriGreen24V2_(
  corps,
  offres
) {
  corps.appendPageBreak();

  ajouterTitreSectionESG_(
    corps,
    "14. Ressources et accompagnement AfriGreen24"
  );

  ajouterParagrapheESG_(
    corps,
    "Le diagnostic constitue une première étape. Les priorités identifiées doivent maintenant être transformées en actions, responsabilités, indicateurs, preuves et procédures concrètes."
  );

  (
    offres || []
  ).forEach(
    function(offre) {
      ajouterEncadreESG_(
        corps,
        offre.titre,
        offre.description,
        "NORMAL"
      );

      if (
        offre.url
      ) {
        var lien =
          corps.appendParagraph(
            offre.cta
          );

        lien
          .setBold(
            true
          )
          .setForegroundColor(
            AFRIGREEN_V2_CONFIG
              .colours
              .primary
          )
          .setSpacingAfter(
            12
          );

        lien
          .editAsText()
          .setLinkUrl(
            offre.url
          );
      }
    }
  );

  ajouterParagrapheESG_(
    corps,
    "Contact AfriGreen24 : " +
    AFRIGREEN_V2_CONFIG.contactEmail
  ).setBold(
    true
  );
}


function ajouterConclusionInstitutionnelleESGV2_(
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

  ajouterParagrapheESG_(
    corps,
    organisation +
    " présente un score ESG ajusté de " +
    diagnostic.scores.globalAjuste +
    " / 100, correspondant au niveau de maturité « " +
    diagnostic.maturite.label +
    " » et au niveau de risque « " +
    diagnostic.risque.label +
    " »."
  );

  ajouterParagrapheESG_(
    corps,
    "Cette conclusion synthétise exclusivement les résultats du diagnostic réalisé à partir des informations déclarées et des éléments de preuve disponibles. Elle doit être interprétée avec les limites méthodologiques présentées dans le rapport."
  );
}


/**
 * Le partage public est désactivé par défaut.
 *
 * Pour l’activer :
 * Paramètres du projet > Propriétés du script
 * ESG_PUBLIC_REPORTS = true
 */
function appliquerPartageRapportV2_(
  documentId,
  pdfId
) {
  var actif =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        "ESG_PUBLIC_REPORTS"
      ) === "true";

  if (!actif) {
    return;
  }

  essayerPartagerRapportESG_(
    documentId,
    pdfId
  );
}


/**
 * ============================================================
 * STOCKAGE V2
 * ============================================================
 */

var ESG_DATASTORE_V2_CONFIG = {
  sheets: {
    digital:
      "Diagnostics_Numeriques",

    afriGreenProspects:
      "Prospects_AfriGreen24",

    mbDigitalProspects:
      "Prospects_MBDigital",

    consent:
      "Consentements"
  }
};


function enregistrerDiagnosticCompletV2(
  profil,
  reponsesESG,
  reponsesDigitales,
  rapport,
  diagnosticDigital,
  qualification,
  consentements
) {
  var stockagePrincipal =
    enregistrerRapportESGDansBase(
      profil,
      reponsesESG,
      rapport
    );

  var classeur =
    obtenirOuCreerBaseESG();

  initialiserFeuillesV2_(
    classeur
  );

  var diagnosticId =
    stockagePrincipal.diagnosticId;

  enregistrerDiagnosticNumeriqueV2_(
    classeur,
    diagnosticId,
    profil,
    reponsesDigitales,
    diagnosticDigital
  );

  enregistrerProspectAfriGreen24V2_(
    classeur,
    diagnosticId,
    profil,
    qualification.afriGreen24,
    consentements
  );

  /*
   * La ligne commerciale MB Digital n’est créée
   * que lorsque le consentement spécifique est donné.
   */
  if (
    consentements.mbDigital === true
  ) {
    enregistrerProspectMBDigitalV2_(
      classeur,
      diagnosticId,
      profil,
      qualification.mbDigital
    );
  }

  enregistrerConsentementsV2_(
    classeur,
    diagnosticId,
    profil,
    consentements
  );

  return {
    success: true,

    diagnosticId:
      diagnosticId,

    spreadsheetId:
      classeur.getId(),

    spreadsheetUrl:
      classeur.getUrl(),

    primaryStorage:
      stockagePrincipal
  };
}


function initialiserFeuillesV2_(
  classeur
) {
  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_V2_CONFIG
      .sheets
      .digital,
    [
      "Diagnostic ID",
      "Date",
      "Organisation",
      "Responsable",
      "Email",
      "Téléphone",
      "Score numérique",
      "Niveau numérique",
      "Score site web",
      "Score LinkedIn",
      "Score communication ESG",
      "Score outils numériques",
      "Priorités déclarées",
      "Besoins détectés",
      "Réponses JSON"
    ]
  );

  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_V2_CONFIG
      .sheets
      .afriGreenProspects,
    [
      "Diagnostic ID",
      "Date",
      "Organisation",
      "Responsable",
      "Email",
      "Téléphone",
      "Pays",
      "Score qualification",
      "Segment",
      "Intérêt financement",
      "Guide recommandé",
      "Accompagnement recommandé",
      "Contact autorisé",
      "Statut"
    ]
  );

  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_V2_CONFIG
      .sheets
      .mbDigitalProspects,
    [
      "Diagnostic ID",
      "Date",
      "Organisation",
      "Responsable",
      "Email",
      "Téléphone",
      "Pays",
      "Score opportunité",
      "Priorité",
      "Besoins",
      "Services potentiels",
      "Contact autorisé",
      "Statut",
      "Suivi commercial"
    ]
  );

  obtenirOuCreerFeuilleESG_(
    classeur,
    ESG_DATASTORE_V2_CONFIG
      .sheets
      .consent,
    [
      "Diagnostic ID",
      "Date",
      "Organisation",
      "Email",
      "Consentement diagnostic",
      "Consentement AfriGreen24",
      "Consentement MB Digital",
      "Notice de confidentialité acceptée",
      "Date de collecte"
    ]
  );
}


function enregistrerDiagnosticNumeriqueV2_(
  classeur,
  diagnosticId,
  profil,
  reponses,
  diagnostic
) {
  var details =
    diagnostic.detailScores || {};

  classeur
    .getSheetByName(
      ESG_DATASTORE_V2_CONFIG
        .sheets
        .digital
    )
    .appendRow([
      diagnosticId,
      new Date(),
      profil.organizationName || "",
      profil.responsibleName || "",
      profil.professionalEmail || "",
      profil.phone || "",
      diagnostic.scoreGlobal,
      diagnostic.niveau.label,
      details.siteWeb || 0,
      details.linkedin || 0,
      details.communicationESG || 0,
      details.automatisation || 0,
      (
        diagnostic
          .prioritesSelectionnees ||
        []
      ).join(", "),
      (
        diagnostic
          .besoinsDetectes ||
        []
      ).join(", "),
      JSON.stringify(
        reponses || {}
      )
    ]);
}


function enregistrerProspectAfriGreen24V2_(
  classeur,
  diagnosticId,
  profil,
  qualification,
  consentements
) {
  var statut =
    qualification.contactAutorise
      ? "CONTACT_AUTORISE"
      : "INFORMATION_UNIQUEMENT";

  classeur
    .getSheetByName(
      ESG_DATASTORE_V2_CONFIG
        .sheets
        .afriGreenProspects
    )
    .appendRow([
      diagnosticId,
      new Date(),
      profil.organizationName || "",
      profil.responsibleName || "",
      profil.professionalEmail || "",
      profil.phone || "",
      profil.mainCountry || "",
      qualification.score,
      qualification.segment,
      qualification.interetFinancement
        ? "Oui"
        : "Non",
      qualification.guideRecommande
        ? "Oui"
        : "Non",
      qualification
        .accompagnementRecommande
        ? "Oui"
        : "Non",
      consentements.afriGreen24
        ? "Oui"
        : "Non",
      statut
    ]);
}


function enregistrerProspectMBDigitalV2_(
  classeur,
  diagnosticId,
  profil,
  qualification
) {
  var titresServices =
    (
      qualification.services ||
      []
    ).map(
      function(service) {
        return service.titre;
      }
    );

  classeur
    .getSheetByName(
      ESG_DATASTORE_V2_CONFIG
        .sheets
        .mbDigitalProspects
    )
    .appendRow([
      diagnosticId,
      new Date(),
      profil.organizationName || "",
      profil.responsibleName || "",
      profil.professionalEmail || "",
      profil.phone || "",
      profil.mainCountry || "",
      qualification.score,
      qualification.priorite,
      (
        qualification.besoins ||
        []
      ).join(", "),
      titresServices.join(", "),
      qualification.contactAutorise
        ? "Oui"
        : "Non",
      qualification.statut,
      "À traiter"
    ]);
}


function enregistrerConsentementsV2_(
  classeur,
  diagnosticId,
  profil,
  consentements
) {
  classeur
    .getSheetByName(
      ESG_DATASTORE_V2_CONFIG
        .sheets
        .consent
    )
    .appendRow([
      diagnosticId,
      new Date(),
      profil.organizationName || "",
      profil.professionalEmail || "",
      consentements.diagnostic
        ? "Oui"
        : "Non",
      consentements.afriGreen24
        ? "Oui"
        : "Non",
      consentements.mbDigital
        ? "Oui"
        : "Non",
      consentements
        .privacyNoticeAccepted
        ? "Oui"
        : "Non",
      consentements.collectedAt
    ]);
}


/**
 * ============================================================
 * TESTS V2
 * ============================================================
 */

function testerAnalyseV2SansRapport() {
  var profil = {
    organizationName:
      "Organisation test V2",

    responsibleName:
      "Responsable test",

    professionalEmail:
      "contact@example.com",

    phone:
      "+237 600 000 000",

    mainCountry:
      "Cameroun",

    diagnosticPurpose: [
      "Rechercher un financement"
    ]
  };

  var reponsesESG = {};

  obtenirQuestionsESG()
    .forEach(
      function(question) {
        reponsesESG[
          question.question_id
        ] = {
          value: 3,
          evidenceLevel:
            "MEDIUM"
        };
      }
    );

  var reponsesDigitales = {
    "DIG-WEB-001": 1,
    "DIG-LINK-002": 2,
    "DIG-COM-003": 1,
    "DIG-DATA-004": 2,
    "DIG-PRIOR-005": [
      "REFONTE_SITE_WEB",
      "STRATEGIE_CONTENU",
      "TABLEAU_DE_BORD"
    ]
  };

  var analyseESG =
    executerDiagnosticEtRecommandationsESG(
      reponsesESG
    );

  var digital =
    analyserDiagnosticDigitalV2(
      reponsesDigitales
    );

  var qualification =
    qualifierProspectV2(
      profil,
      analyseESG,
      digital,
      {
        diagnostic: true,
        afriGreen24: true,
        mbDigital: true
      }
    );

  var resultat = {
    scoreESG:
      analyseESG
        .diagnostic
        .scores
        .globalAjuste,

    scoreDigital:
      digital.scoreGlobal,

    qualification:
      qualification
  };

  Logger.log(
    JSON.stringify(
      resultat,
      null,
      2
    )
  );

  return resultat;
}

function testerESGGlobalHumbleOS() {
  Logger.log("========================================");
  Logger.log("TEST GLOBAL ESG + HUMBLEOS");
  Logger.log("========================================");

  /*
   * IMPORTANT :
   * Cette fonction doit utiliser un payload conforme
   * au questionnaire ESG V2 réel.
   *
   * On récupère donc d'abord les données officielles
   * de l'application au lieu d'inventer les IDs.
   */
  var donnees = obtenirDonneesApplicationV2();

  if (
    !donnees ||
    !donnees.questionnaire ||
    !donnees.questionnaire.questions
  ) {
    throw new Error(
      "Impossible de charger le questionnaire ESG V2."
    );
  }

  var questionsESG =
    donnees.questionnaire.questions;

  var questionsDigitales =
    donnees.digitalQuestions || [];

  Logger.log(
    "Questions ESG détectées : " +
    questionsESG.length
  );

  Logger.log(
    "Questions digitales détectées : " +
    questionsDigitales.length
  );

  /*
   * ==============================================
   * PROFIL TEST
   * ==============================================
   */
  var profil = {
    organizationName:
      "GreenStep Shoes",

    responsibleName:
      "Test AfriGreen24",

    professionalEmail:
      "test@afrigreen24.com",

    phone:
      "+237600000000",

    mainCountry:
      "Cameroun",

    additionalCountries:
      [],

    organizationType:
      "PME",

    mainSector:
      "Commerce",

    employeeCount:
      "5",

    annualRevenueOrBudget:
      "25000000 FCFA",

    creationYear:
      "2024",

    interventionZone:
      "Cameroun",

    existingESGPolicy:
      "Non",

    existingESGReport:
      "Non",

    diagnosticPurpose:
      "Structurer la démarche ESG et améliorer la préparation au financement",

    logoUpload:
      ""
  };

  /*
   * ==============================================
   * RÉPONSES ESG
   * ==============================================
   *
   * On construit les réponses à partir des
   * questions réellement présentes.
   */
  var reponsesESG = {};

  questionsESG.forEach(
    function(question) {

      var id =
        question.id ||
        question.questionId;

      if (!id) {
        return;
      }

      /*
       * On choisit une réponse disponible dans
       * la définition officielle de la question
       * lorsqu'elle existe.
       */
      var valeur = null;

      if (
        question.options &&
        question.options.length
      ) {

        var premiereOption =
          question.options[0];

        if (
          typeof premiereOption === "object" &&
          premiereOption !== null
        ) {
          valeur =
            premiereOption.value !== undefined
              ? premiereOption.value
              : premiereOption.label;
        } else {
          valeur = premiereOption;
        }

      } else {

        /*
         * Pour les champs sans options,
         * valeur neutre de test.
         */
        valeur = "Non renseigné";

      }

      reponsesESG[id] = {
        value: valeur,
        evidenceLevel: "NONE",
        comment: ""
      };
    }
  );

  /*
   * ==============================================
   * RÉPONSES DIGITALES
   * ==============================================
   */
  var reponsesDigitales = {};

  questionsDigitales.forEach(
    function(question) {

      var id =
        question.id ||
        question.questionId;

      if (!id) {
        return;
      }

      if (
        question.options &&
        question.options.length
      ) {

        var premiereOption =
          question.options[0];

        reponsesDigitales[id] =
          typeof premiereOption === "object"
            ? (
                premiereOption.value !== undefined
                  ? premiereOption.value
                  : premiereOption.label
              )
            : premiereOption;

      } else {

        reponsesDigitales[id] =
          "Non renseigné";
      }
    }
  );

  /*
   * ==============================================
   * PAYLOAD GLOBAL
   * ==============================================
   */
  var payload = {
    profil: profil,

    reponsesESG:
      reponsesESG,

    reponsesDigitales:
      reponsesDigitales,

    consentements: {
      diagnostic: true,
      privacyNoticeAccepted: true,
      afriGreen24: true,
      mbDigital: true
    }
  };

  Logger.log(
    "Payload global construit."
  );

  Logger.log(
    "Lancement soumettreDiagnosticV2()..."
  );

  var debut =
    new Date().getTime();

  /*
   * ==============================================
   * TEST DE BOUT EN BOUT
   * ==============================================
   */
  var resultat =
    soumettreDiagnosticV2(
      payload
    );

  var duree =
    (
      new Date().getTime() -
      debut
    ) / 1000;

  /*
   * ==============================================
   * VALIDATION
   * ==============================================
   */
  if (
    !resultat ||
    resultat.success !== true
  ) {
    throw new Error(
      "Le test global ESG a échoué."
    );
  }

  Logger.log(
    "========================================"
  );

  Logger.log(
    "TEST GLOBAL ESG RÉUSSI"
  );

  Logger.log(
    "========================================"
  );

  Logger.log(
    "Durée : " +
    duree +
    " secondes"
  );

  Logger.log(
    "Organisation : " +
    resultat.organisation
  );

  Logger.log(
    "Score ESG : " +
    resultat.scoreESG
  );

  Logger.log(
    "Maturité : " +
    JSON.stringify(
      resultat.maturite
    )
  );

  Logger.log(
    "Risque : " +
    JSON.stringify(
      resultat.risque
    )
  );

  Logger.log(
    "Score Digital : " +
    resultat.scoreDigital
  );

  Logger.log(
    "Google Doc : " +
    resultat.docUrl
  );

  Logger.log(
    "PDF : " +
    resultat.pdfUrl
  );

  Logger.log(
    "PDF Download : " +
    resultat.pdfDownloadUrl
  );

  Logger.log(
    "Spreadsheet : " +
    resultat.spreadsheetUrl
  );

  Logger.log(
    "========================================"
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