function testerBrandingESGAvecLogoDrive() {
  var DOCUMENT_ID =
    "REMPLACER_PAR_ID_DOCUMENT_TEST";

  var LOGO_FILE_ID =
    "REMPLACER_PAR_ID_LOGO_PNG_OU_JPG";

  var resultat =
    insererLogoDansGoogleDoc(
      DOCUMENT_ID,
      LOGO_FILE_ID
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
function testerRapportESGFinalAvecLogo() {

  // =====================================================
  // 1. CRÉER UN VRAI PNG DE TEST
  // =====================================================

  var logoUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

  var logoResponse =
    UrlFetchApp.fetch(
      logoUrl
    );

  var logoBlob =
    logoResponse
      .getBlob()
      .setName(
        "logo-test.png"
      );

  var logoFile =
    DriveApp.createFile(
      logoBlob
    );


  // =====================================================
  // 2. CONVERTIR LE LOGO EN DATA URL
  // =====================================================

  var logoBase64 =
    Utilities.base64Encode(
      logoBlob.getBytes()
    );

  var logoDataUrl =
    "data:image/png;base64," +
    logoBase64;


  // =====================================================
  // 3. PROFIL ESG DE TEST
  // =====================================================

  var profilTest = {

    organizationName:
      "EcoCycle Africa",

    responsibleName:
      "Entrepreneur Test",

    professionalEmail:
      "test@ecocycle-africa.com",

    phone:
      "+237 600 000 000",

    mainCountry:
      "Cameroun",

    organizationType:
      "PME",

    mainSector:
      "Recyclage et économie circulaire",

    employeeCount:
      18,

    interventionZone:
      "Nationale",

    diagnosticPurpose: [
      "Rechercher un financement",
      "Améliorer notre performance ESG"
    ],

    // IMPORTANT :
    // on simule exactement le logo
    // envoyé par la Web App.

    logoUpload: {

      fileName:
        "logo-test.png",

      mimeType:
        "image/png",

      size:
        logoBlob
          .getBytes()
          .length,

      dataUrl:
        logoDataUrl,

      organisation:
        "EcoCycle Africa"

    }

  };


  // =====================================================
  // 4. RÉPONSES ESG SIMULÉES
  // =====================================================

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
            "Réponse ESG de test."

        };

      }
    );


  // Quelques forces

  if (
    reponsesTest[
      "E-ENER-001"
    ]
  ) {

    reponsesTest[
      "E-ENER-001"
    ] = {

      value:
        5,

      evidenceLevel:
        "STRONG",

      comment:
        "Suivi énergétique structuré."

    };

  }


  if (
    reponsesTest[
      "S-TRN-001"
    ]
  ) {

    reponsesTest[
      "S-TRN-001"
    ] = {

      value:
        4,

      evidenceLevel:
        "STRONG"

    };

  }


  // Quelques faiblesses

  if (
    reponsesTest[
      "G-COMP-001"
    ]
  ) {

    reponsesTest[
      "G-COMP-001"
    ] = {

      value:
        1,

      evidenceLevel:
        "DECLARATIVE"

    };

  }


  if (
    reponsesTest[
      "E-POLL-001"
    ]
  ) {

    reponsesTest[
      "E-POLL-001"
    ] = {

      value:
        1,

      evidenceLevel:
        "NONE"

    };

  }


  // =====================================================
  // 5. DIAGNOSTIC NUMÉRIQUE
  // =====================================================

  var diagnosticDigitalTest = {

    success:
      true,

    scoreGlobal:
      68,

    niveau: {
      label:
        "En structuration"
    },

    resume: {

      message:
        "L'organisation dispose d'une présence numérique partielle mais doit renforcer la publication de ses engagements ESG.",

      detailScores: {

        siteWeb:
          70,

        linkedin:
          65,

        communicationESG:
          55,

        automatisation:
          60

      }

    },

    recommandations: {

      actionsPrioritaires: [

        {
          action:
            "Créer une page ESG dédiée sur le site web."
        },

        {
          action:
            "Publier régulièrement les actions ESG sur LinkedIn."
        },

        {
          action:
            "Structurer le suivi numérique des indicateurs ESG."
        }

      ]

    },

    servicesRecommandes: [],

    qualificationProspect: {

      contactCommercialRecommande:
        false

    }

  };


  // =====================================================
  // 6. GÉNÉRER LE VRAI RAPPORT ESG
  // =====================================================

  var resultat =
    genererRapportESG(

      profilTest,

      reponsesTest,

      diagnosticDigitalTest

    );


  // =====================================================
  // 7. JOURNAL FINAL
  // =====================================================

  Logger.log(
    JSON.stringify(
      {

        success:
          resultat.success,

        organisation:
          resultat.organisation,

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

        logoTestDriveUrl:
          logoFile.getUrl()

      },
      null,
      2
    )
  );


  return resultat;

}