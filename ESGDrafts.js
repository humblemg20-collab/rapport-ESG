/**
 * ============================================================
 * AFRIGREEN24 — ESG DRAFTS / REPRISE DE DIAGNOSTIC
 * VERSION 1.0.0
 * ============================================================
 *
 * Objectif :
 * - créer un code de reprise ;
 * - sauvegarder automatiquement un diagnostic ESG ;
 * - reprendre le diagnostic depuis un autre appareil ;
 * - conserver les brouillons pendant 30 jours ;
 * - sécuriser la reprise avec EMAIL + CODE ;
 * - ne jamais stocker le code en clair.
 *
 * Dépendance existante :
 * - obtenirOuCreerBaseESG()
 */


var ESG_DRAFT_CONFIG = {

  sheetName:
    "Brouillons_ESG",

  validityDays:
    30,

  codePrefix:
    "ESG",

  maxJsonChunkLength:
    45000,

  statuses: {
    draft:
      "BROUILLON",

    completed:
      "TERMINE",

    expired:
      "EXPIRE"
  }

};



/**
 * ============================================================
 * INITIALISATION
 * ============================================================
 *
 * À exécuter une fois manuellement pour vérifier
 * que l'onglet Brouillons_ESG est correctement créé.
 */
function initialiserBrouillonsESG() {

  var feuille =
    obtenirFeuilleBrouillonsESG_();

  return {

    success:
      true,

    sheetName:
      feuille.getName(),

    spreadsheetUrl:
      feuille
        .getParent()
        .getUrl()

  };

}



/**
 * ============================================================
 * CRÉATION DU CODE DE REPRISE
 * ============================================================
 *
 * Payload attendu :
 *
 * {
 *   email: "...",
 *   organization: "...",
 *   state: {
 *     profil: {},
 *     reponsesESG: {},
 *     reponsesDigitales: {},
 *     consentements: {}
 *   },
 *   currentStep: 12,
 *   progress: 32
 * }
 */
function creerCodeRepriseESG(
  payload
) {

  payload =
    payload || {};


  var email =
    normaliserEmailBrouillonESG_(
      payload.email
    );


  if (!email) {

    throw new Error(
      "Une adresse email professionnelle valide est nécessaire pour créer un code de reprise."
    );

  }


  var organisation =
    nettoyerTexteBrouillonESG_(
      payload.organization ||
      payload.organisation ||
      "",
      200
    );


  var etat =
    payload.state ||
    {};


  var currentStep =
    normaliserEntierBrouillonESG_(
      payload.currentStep,
      0,
      1000
    );


  var progression =
    normaliserEntierBrouillonESG_(
      payload.progress,
      0,
      100
    );


  var verrou =
    LockService
      .getScriptLock();


  verrou.waitLock(
    20000
  );


  try {

    var feuille =
      obtenirFeuilleBrouillonsESG_();


    var draftId =
      creerDraftIdESG_();


    var code =
      creerCodeLisibleESG_();


    var codeHash =
      creerHashCodeRepriseESG_(
        email,
        code
      );


    var maintenant =
      new Date();


    var expiration =
      new Date(
        maintenant.getTime() +
        (
          ESG_DRAFT_CONFIG
            .validityDays *
          24 *
          60 *
          60 *
          1000
        )
      );


    var json =
      JSON.stringify(
        etat
      );


    var morceaux =
      decouperPayloadESG_(
        json
      );


    feuille.appendRow([

      draftId,

      codeHash,

      email,

      organisation,

      maintenant,

      maintenant,

      expiration,

      currentStep,

      progression,

      morceaux[0],

      morceaux[1],

      morceaux[2],

      ESG_DRAFT_CONFIG
        .statuses
        .draft,

      0,

      "",

      ""

    ]);


    var emailSent =
      envoyerCodeRepriseESG_(
        email,
        code,
        organisation,
        expiration
      );


    return {

      success:
        true,

      draftId:
        draftId,

      code:
        code,

      email:
        email,

      organization:
        organisation,

      expiresAt:
        expiration.toISOString(),

      validityDays:
        ESG_DRAFT_CONFIG
          .validityDays,

      emailSent:
        emailSent

    };


  } finally {

    verrou.releaseLock();

  }

}



/**
 * ============================================================
 * SAUVEGARDE AUTOMATIQUE
 * ============================================================
 *
 * Payload :
 *
 * {
 *   draftId: "...",
 *   email: "...",
 *   code: "ESG-XXXX-XXXX",
 *   state: {...},
 *   currentStep: 18,
 *   progress: 45
 * }
 */
function sauvegarderBrouillonESG(
  payload
) {

  payload =
    payload || {};


  var draftId =
    nettoyerTexteBrouillonESG_(
      payload.draftId,
      100
    );


  var email =
    normaliserEmailBrouillonESG_(
      payload.email
    );


  var code =
    normaliserCodeRepriseESG_(
      payload.code
    );


  if (
    !draftId ||
    !email ||
    !code
  ) {

    throw new Error(
      "Impossible de sauvegarder le diagnostic : informations de reprise incomplètes."
    );

  }


  var verrou =
    LockService
      .getScriptLock();


  verrou.waitLock(
    20000
  );


  try {

    var feuille =
      obtenirFeuilleBrouillonsESG_();


    var ligne =
      trouverLigneBrouillonParIdESG_(
        feuille,
        draftId
      );


    if (!ligne) {

      throw new Error(
        "Ce brouillon ESG est introuvable."
      );

    }


    var donnees =
      lireLigneBrouillonESG_(
        feuille,
        ligne
      );


    verifierAccesBrouillonESG_(
      donnees,
      email,
      code
    );


    verifierBrouillonActifESG_(
      donnees
    );


    var json =
      JSON.stringify(
        payload.state ||
        {}
      );


    var morceaux =
      decouperPayloadESG_(
        json
      );


    var currentStep =
      normaliserEntierBrouillonESG_(
        payload.currentStep,
        0,
        1000
      );


    var progression =
      normaliserEntierBrouillonESG_(
        payload.progress,
        0,
        100
      );


    var maintenant =
      new Date();


    feuille
      .getRange(
        ligne,
        6
      )
      .setValue(
        maintenant
      );


    feuille
      .getRange(
        ligne,
        8
      )
      .setValue(
        currentStep
      );


    feuille
      .getRange(
        ligne,
        9
      )
      .setValue(
        progression
      );


    feuille
      .getRange(
        ligne,
        10,
        1,
        3
      )
      .setValues([
        [
          morceaux[0],
          morceaux[1],
          morceaux[2]
        ]
      ]);


    return {

      success:
        true,

      draftId:
        draftId,

      savedAt:
        maintenant.toISOString(),

      currentStep:
        currentStep,

      progress:
        progression

    };


  } finally {

    verrou.releaseLock();

  }

}



/**
 * ============================================================
 * REPRISE DU DIAGNOSTIC
 * ============================================================
 *
 * L'utilisateur fournit :
 *
 * EMAIL + CODE
 *
 * {
 *   email: "...",
 *   code: "ESG-XXXX-XXXX"
 * }
 */
function reprendreBrouillonESG(
  payload
) {

  payload =
    payload || {};


  var email =
    normaliserEmailBrouillonESG_(
      payload.email
    );


  var code =
    normaliserCodeRepriseESG_(
      payload.code
    );


  if (
    !email ||
    !code
  ) {

    throw new Error(
      "Veuillez renseigner votre email et votre code de reprise."
    );

  }


  var feuille =
    obtenirFeuilleBrouillonsESG_();


  var codeHash =
    creerHashCodeRepriseESG_(
      email,
      code
    );


  var derniereLigne =
    feuille.getLastRow();


  if (
    derniereLigne < 2
  ) {

    throw new Error(
      "Aucun brouillon ESG n'a été trouvé."
    );

  }


  var donnees =
    feuille
      .getRange(
        2,
        1,
        derniereLigne - 1,
        16
      )
      .getValues();


  /*
   * Recherche du plus récent au plus ancien.
   */
  for (
    var index =
      donnees.length - 1;

    index >= 0;

    index--
  ) {

    var ligne =
      donnees[index];


    var emailLigne =
      normaliserEmailBrouillonESG_(
        ligne[2]
      );


    var hashLigne =
      String(
        ligne[1] || ""
      );


    if (
      emailLigne !== email ||
      hashLigne !== codeHash
    ) {

      continue;

    }


    var numeroLigne =
      index + 2;


    var brouillon =
      transformerLigneBrouillonESG_(
        ligne
      );


    verifierBrouillonActifESG_(
      brouillon
    );


    var payloadJSON =
      String(
        ligne[9] || ""
      ) +
      String(
        ligne[10] || ""
      ) +
      String(
        ligne[11] || ""
      );


    var etat = {};


    if (
      payloadJSON
    ) {

      try {

        etat =
          JSON.parse(
            payloadJSON
          );


      } catch (erreur) {

        throw new Error(
          "Les données sauvegardées sont illisibles. Veuillez contacter AfriGreen24."
        );

      }

    }


    var nombreReprises =
      Number(
        ligne[13] || 0
      ) + 1;


    var maintenant =
      new Date();


    feuille
      .getRange(
        numeroLigne,
        14
      )
      .setValue(
        nombreReprises
      );


    feuille
      .getRange(
        numeroLigne,
        15
      )
      .setValue(
        maintenant
      );


    return {

      success:
        true,

      draftId:
        brouillon.draftId,

      organization:
        brouillon.organization,

      email:
        email,

      currentStep:
        brouillon.currentStep,

      progress:
        brouillon.progress,

      state:
        etat,

      createdAt:
        brouillon.createdAt,

      lastSavedAt:
        brouillon.lastSavedAt,

      expiresAt:
        brouillon.expiresAt,

      resumeCount:
        nombreReprises

    };

  }


  throw new Error(
    "Email ou code de reprise incorrect."
  );

}



/**
 * ============================================================
 * MARQUER LE BROUILLON COMME TERMINÉ
 * ============================================================
 *
 * À appeler après génération réussie du rapport ESG.
 */
function marquerBrouillonTermineESG(
  payload
) {

  payload =
    payload || {};


  var draftId =
    nettoyerTexteBrouillonESG_(
      payload.draftId,
      100
    );


  var email =
    normaliserEmailBrouillonESG_(
      payload.email
    );


  var code =
    normaliserCodeRepriseESG_(
      payload.code
    );


  var reportId =
    nettoyerTexteBrouillonESG_(
      payload.reportId ||
      "",
      150
    );


  if (
    !draftId ||
    !email ||
    !code
  ) {

    return {
      success:
        false
    };

  }


  var verrou =
    LockService
      .getScriptLock();


  verrou.waitLock(
    20000
  );


  try {

    var feuille =
      obtenirFeuilleBrouillonsESG_();


    var ligne =
      trouverLigneBrouillonParIdESG_(
        feuille,
        draftId
      );


    if (!ligne) {

      return {
        success:
          false
      };

    }


    var donnees =
      lireLigneBrouillonESG_(
        feuille,
        ligne
      );


    verifierAccesBrouillonESG_(
      donnees,
      email,
      code
    );


    feuille
      .getRange(
        ligne,
        13
      )
      .setValue(
        ESG_DRAFT_CONFIG
          .statuses
          .completed
      );


    feuille
      .getRange(
        ligne,
        16
      )
      .setValue(
        reportId
      );


    feuille
      .getRange(
        ligne,
        6
      )
      .setValue(
        new Date()
      );


    return {

      success:
        true,

      draftId:
        draftId,

      reportId:
        reportId,

      status:
        ESG_DRAFT_CONFIG
          .statuses
          .completed

    };


  } finally {

    verrou.releaseLock();

  }

}



/**
 * ============================================================
 * NETTOYAGE DES BROUILLONS EXPIRÉS
 * ============================================================
 *
 * Peut être exécuté manuellement ou via déclencheur quotidien.
 *
 * Les données ne sont pas supprimées :
 * leur statut devient simplement EXPIRE.
 */
function nettoyerBrouillonsExpiresESG() {

  var feuille =
    obtenirFeuilleBrouillonsESG_();


  var derniereLigne =
    feuille.getLastRow();


  if (
    derniereLigne < 2
  ) {

    return {

      success:
        true,

      expired:
        0

    };

  }


  var maintenant =
    new Date();


  var valeurs =
    feuille
      .getRange(
        2,
        1,
        derniereLigne - 1,
        16
      )
      .getValues();


  var compteur =
    0;


  valeurs.forEach(
    function(ligne, index) {

      var expiration =
        ligne[6];


      var statut =
        String(
          ligne[12] || ""
        );


      if (
        statut !==
        ESG_DRAFT_CONFIG
          .statuses
          .draft
      ) {

        return;

      }


      if (
        !expiration
      ) {

        return;

      }


      var dateExpiration =
        expiration instanceof Date
          ? expiration
          : new Date(
              expiration
            );


      if (
        dateExpiration.getTime() >=
        maintenant.getTime()
      ) {

        return;

      }


      feuille
        .getRange(
          index + 2,
          13
        )
        .setValue(
          ESG_DRAFT_CONFIG
            .statuses
            .expired
        );


      compteur++;

    }
  );


  return {

    success:
      true,

    expired:
      compteur

  };

}



/**
 * ============================================================
 * FEUILLE BROUILLONS
 * ============================================================
 */
function obtenirFeuilleBrouillonsESG_() {

  var classeur =
    obtenirOuCreerBaseESG();


  var feuille =
    classeur.getSheetByName(
      ESG_DRAFT_CONFIG
        .sheetName
    );


  if (!feuille) {

    feuille =
      classeur.insertSheet(
        ESG_DRAFT_CONFIG
          .sheetName
      );

  }


  var entetes = [

    "Draft ID",

    "Code Hash",

    "Email",

    "Organisation",

    "Date création",

    "Dernière sauvegarde",

    "Expiration",

    "Étape actuelle",

    "Progression %",

    "Payload JSON 1",

    "Payload JSON 2",

    "Payload JSON 3",

    "Statut",

    "Nombre reprises",

    "Dernière reprise",

    "Rapport ID"

  ];


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


    feuille
      .getRange(
        1,
        1,
        1,
        entetes.length
      )
      .setFontWeight(
        "bold"
      )
      .setBackground(
        "#176B4D"
      )
      .setFontColor(
        "#FFFFFF"
      );


    feuille.setFrozenRows(
      1
    );

  }


  return feuille;

}



/**
 * ============================================================
 * IDENTIFIANT BROUILLON
 * ============================================================
 */
function creerDraftIdESG_() {

  return (
    "ESG-DRAFT-" +
    Utilities
      .getUuid()
      .substring(
        0,
        12
      )
      .toUpperCase()
  );

}



/**
 * ============================================================
 * CODE LISIBLE
 * ============================================================
 *
 * Exemple :
 *
 * ESG-K7M4-P9Q2
 */
function creerCodeLisibleESG_() {

  var alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


  var graine =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.getUuid() +
      "|" +
      new Date().getTime() +
      "|" +
      Math.random()
    );


  var caracteres =
    [];


  for (
    var index = 0;

    index < 8;

    index++
  ) {

    var valeur =
      graine[index];


    if (
      valeur < 0
    ) {

      valeur +=
        256;

    }


    caracteres.push(
      alphabet.charAt(
        valeur %
        alphabet.length
      )
    );

  }


  return (
    ESG_DRAFT_CONFIG
      .codePrefix +
    "-" +
    caracteres
      .slice(
        0,
        4
      )
      .join("") +
    "-" +
    caracteres
      .slice(
        4,
        8
      )
      .join("")
  );

}



/**
 * ============================================================
 * HASH DU CODE
 * ============================================================
 *
 * Le code en clair n'est JAMAIS stocké dans Sheets.
 */
function creerHashCodeRepriseESG_(
  email,
  code
) {

  var pepper =
    obtenirPepperBrouillonsESG_();


  var valeur =
    normaliserEmailBrouillonESG_(
      email
    ) +
    "|" +
    normaliserCodeRepriseESG_(
      code
    ) +
    "|" +
    pepper;


  var digest =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      valeur,
      Utilities.Charset.UTF_8
    );


  return digest
    .map(
      function(byte) {

        var valeurByte =
          byte;


        if (
          valeurByte < 0
        ) {

          valeurByte +=
            256;

        }


        return (
          "0" +
          valeurByte.toString(
            16
          )
        ).slice(
          -2
        );

      }
    )
    .join("");

}



/**
 * ============================================================
 * PEPPER DE SÉCURITÉ
 * ============================================================
 */
function obtenirPepperBrouillonsESG_() {

  var proprietes =
    PropertiesService
      .getScriptProperties();


  var pepper =
    proprietes.getProperty(
      "ESG_DRAFT_PEPPER"
    );


  if (!pepper) {

    pepper =
      Utilities
        .getUuid() +
      "-" +
      Utilities
        .getUuid();


    proprietes.setProperty(
      "ESG_DRAFT_PEPPER",
      pepper
    );

  }


  return pepper;

}



/**
 * ============================================================
 * VÉRIFICATION ACCÈS
 * ============================================================
 */
function verifierAccesBrouillonESG_(
  brouillon,
  email,
  code
) {

  if (!brouillon) {

    throw new Error(
      "Brouillon introuvable."
    );

  }


  var hashAttendu =
    creerHashCodeRepriseESG_(
      email,
      code
    );


  if (
    brouillon.email !==
      normaliserEmailBrouillonESG_(
        email
      ) ||
    brouillon.codeHash !==
      hashAttendu
  ) {

    throw new Error(
      "Email ou code de reprise incorrect."
    );

  }

}



/**
 * ============================================================
 * VÉRIFICATION EXPIRATION / STATUT
 * ============================================================
 */
function verifierBrouillonActifESG_(
  brouillon
) {

  var statut =
    String(
      brouillon.status || ""
    );


  if (
    statut ===
    ESG_DRAFT_CONFIG
      .statuses
      .completed
  ) {

    throw new Error(
      "Ce diagnostic ESG a déjà été finalisé."
    );

  }


  if (
    statut ===
    ESG_DRAFT_CONFIG
      .statuses
      .expired
  ) {

    throw new Error(
      "Ce code de reprise a expiré."
    );

  }


  if (
    brouillon.expiresAt
  ) {

    var expiration =
      new Date(
        brouillon.expiresAt
      );


    if (
      expiration.getTime() <
      new Date().getTime()
    ) {

      throw new Error(
        "Ce code de reprise a expiré."
      );

    }

  }

}



/**
 * ============================================================
 * RECHERCHE PAR DRAFT ID
 * ============================================================
 */
function trouverLigneBrouillonParIdESG_(
  feuille,
  draftId
) {

  var derniereLigne =
    feuille.getLastRow();


  if (
    derniereLigne < 2
  ) {

    return null;

  }


  var ids =
    feuille
      .getRange(
        2,
        1,
        derniereLigne - 1,
        1
      )
      .getValues();


  for (
    var index = 0;

    index <
    ids.length;

    index++
  ) {

    if (
      String(
        ids[index][0]
      ) ===
      String(
        draftId
      )
    ) {

      return (
        index + 2
      );

    }

  }


  return null;

}



/**
 * ============================================================
 * LECTURE D'UNE LIGNE
 * ============================================================
 */
function lireLigneBrouillonESG_(
  feuille,
  ligne
) {

  var valeurs =
    feuille
      .getRange(
        ligne,
        1,
        1,
        16
      )
      .getValues()[0];


  return transformerLigneBrouillonESG_(
    valeurs
  );

}



function transformerLigneBrouillonESG_(
  ligne
) {

  return {

    draftId:
      String(
        ligne[0] || ""
      ),

    codeHash:
      String(
        ligne[1] || ""
      ),

    email:
      normaliserEmailBrouillonESG_(
        ligne[2]
      ),

    organization:
      String(
        ligne[3] || ""
      ),

    createdAt:
      convertirDateISOStringESG_(
        ligne[4]
      ),

    lastSavedAt:
      convertirDateISOStringESG_(
        ligne[5]
      ),

    expiresAt:
      convertirDateISOStringESG_(
        ligne[6]
      ),

    currentStep:
      Number(
        ligne[7] || 0
      ),

    progress:
      Number(
        ligne[8] || 0
      ),

    status:
      String(
        ligne[12] || ""
      ),

    resumeCount:
      Number(
        ligne[13] || 0
      ),

    lastResumeAt:
      convertirDateISOStringESG_(
        ligne[14]
      ),

    reportId:
      String(
        ligne[15] || ""
      )

  };

}



/**
 * ============================================================
 * DÉCOUPAGE JSON
 * ============================================================
 *
 * Google Sheets limite la taille d'une cellule.
 * Le payload est donc réparti sur trois cellules.
 */
function decouperPayloadESG_(
  json
) {

  json =
    String(
      json || ""
    );


  var taille =
    ESG_DRAFT_CONFIG
      .maxJsonChunkLength;


  if (
    json.length >
    taille * 3
  ) {

    throw new Error(
      "Le diagnostic contient trop de données pour être sauvegardé automatiquement."
    );

  }


  return [

    json.substring(
      0,
      taille
    ),

    json.substring(
      taille,
      taille * 2
    ),

    json.substring(
      taille * 2,
      taille * 3
    )

  ];

}



/**
 * ============================================================
 * ENVOI EMAIL DU CODE
 * ============================================================
 */
function envoyerCodeRepriseESG_(
  email,
  code,
  organisation,
  expiration
) {

  var dateExpiration =
    Utilities.formatDate(
      expiration,
      Session
        .getScriptTimeZone(),
      "dd/MM/yyyy"
    );


  var sujet =
    "Votre code de reprise — Diagnostic ESG AfriGreen24";


  var texte = [

    "Bonjour,",

    "",

    "Votre diagnostic ESG AfriGreen24 a été sauvegardé.",

    "",

    organisation
      ? "Organisation : " +
        organisation
      : "",

    "Code de reprise : " +
      code,

    "",

    "Ce code est valable jusqu'au " +
      dateExpiration +
      ".",

    "",

    "Pour reprendre votre diagnostic, utilisez votre adresse email professionnelle et ce code.",

    "",

    "Conservez ce code de manière confidentielle.",

    "",

    "AfriGreen24"

  ]
    .filter(
      function(ligne) {

        return ligne !==
          null &&
          ligne !==
          undefined;

      }
    )
    .join(
      "\n"
    );


  try {

    MailApp.sendEmail({
      to:
        email,

      subject:
        sujet,

      body:
        texte,

      name:
        "AfriGreen24"
    });


    return true;


  } catch (erreur) {

    console.error(
      "Code de reprise créé mais email non envoyé : " +
      erreur.message
    );


    return false;

  }

}



/**
 * ============================================================
 * OUTILS
 * ============================================================
 */
function normaliserEmailBrouillonESG_(
  email
) {

  var valeur =
    String(
      email || ""
    )
      .trim()
      .toLowerCase();


  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      valeur
    )
  ) {

    return "";

  }


  return valeur;

}



function normaliserCodeRepriseESG_(
  code
) {

  return String(
    code || ""
  )
    .trim()
    .toUpperCase()
    .replace(
      /\s+/g,
      ""
    );

}



function nettoyerTexteBrouillonESG_(
  valeur,
  maxLength
) {

  return String(
    valeur == null
      ? ""
      : valeur
  )
    .replace(
      /\u0000/g,
      ""
    )
    .trim()
    .substring(
      0,
      maxLength
    );

}



function normaliserEntierBrouillonESG_(
  valeur,
  minimum,
  maximum
) {

  var nombre =
    parseInt(
      valeur,
      10
    );


  if (
    isNaN(
      nombre
    )
  ) {

    nombre =
      minimum;

  }


  return Math.max(
    minimum,
    Math.min(
      maximum,
      nombre
    )
  );

}



function convertirDateISOStringESG_(
  valeur
) {

  if (!valeur) {

    return "";

  }


  var date =
    valeur instanceof Date
      ? valeur
      : new Date(
          valeur
        );


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toISOString();

}