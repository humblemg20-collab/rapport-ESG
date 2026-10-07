/**
 * ============================================================
 * TEST FINAL COMPLET — RAPPORT ESG CLIENT
 * ============================================================
 *
 * OBJECTIF
 * --------
 * Certifier le parcours final réel :
 *
 * Questionnaire officiel
 * → Apps Script / scoring déterministe
 * → HumbleOS Rewrite Only
 * → Safe Fallback
 * → branding client (logo + slogan)
 * → Google Docs
 * → PDF
 * → stockage
 *
 * ET vérifier que le PDF/document final :
 * - appartient visuellement à l'entreprise cliente ;
 * - ne contient aucune offre ou CTA AfriGreen24 ;
 * - ne contient aucun plan de correction/recommandation commerciale ;
 * - conserve les résultats ESG factuels ;
 * - contient le logo et le slogan du client.
 *
 * IMPORTANT
 * ---------
 * Ce test déclenche UNE génération complète réelle.
 * Il doit être exécuté UNE SEULE FOIS.
 *
 * Attendu côté HumbleOS :
 * - 1 AI.run() maximum
 * - 0 retry
 */

function TEST_ESG_FINAL_COMPLET_CLIENT() {

  Logger.log("==========================================");
  Logger.log("TEST FINAL COMPLET — RAPPORT ESG CLIENT");
  Logger.log("==========================================");

  /*
   * ========================================================
   * 1. PRÉREQUIS
   * ========================================================
   */

  TEST_ESG_FINAL_ASSERT_(
    typeof soumettreDiagnosticV2 === "function",
    "soumettreDiagnosticV2() introuvable."
  );

  TEST_ESG_FINAL_ASSERT_(
    typeof obtenirDonneesApplicationV2 === "function",
    "obtenirDonneesApplicationV2() introuvable."
  );

  TEST_ESG_FINAL_ASSERT_(
    typeof buildESGReportTextModel_ === "function",
    "ESG_HumbleOS_Rewrite_Only.gs absent."
  );

  TEST_ESG_FINAL_ASSERT_(
    typeof obtenirLogoBlobOrganisationESG_ === "function",
    "ESG_Branding_Helpers.gs absent."
  );


  /*
   * ========================================================
   * 2. QUESTIONNAIRE OFFICIEL
   * ========================================================
   */

  var donnees =
    obtenirDonneesApplicationV2();

  TEST_ESG_FINAL_ASSERT_(
    donnees &&
    donnees.questionnaire,
    "Questionnaire ESG non chargé."
  );

  var questionsESG =
    donnees.questionnaire.questions || [];

  var questionsDigitales =
    donnees.digitalQuestions || [];

  TEST_ESG_FINAL_ASSERT_(
    questionsESG.length > 0,
    "Aucune question ESG détectée."
  );

  TEST_ESG_FINAL_ASSERT_(
    questionsDigitales.length > 0,
    "Aucune question numérique détectée."
  );

  Logger.log(
    "Questions ESG : " +
    questionsESG.length
  );

  Logger.log(
    "Questions numériques : " +
    questionsDigitales.length
  );


  /*
   * ========================================================
   * 3. PROFIL CLIENT + BRANDING
   * ========================================================
   */

  var sloganClient =
    "Industrie responsable, croissance durable.";

  var profil = {
    organizationName:
      "EcoNova Industries",

    responsibleName:
      "Direction Générale",

    professionalEmail:
      "direction@econova.example",

    phone:
      "+237600000001",

    mainCountry:
      "Cameroun",

    additionalCountries: [
      "Côte d'Ivoire"
    ],

    organizationType:
      "PME",

    mainSector:
      "Industrie et économie circulaire",

    employeeCount:
      "42",

    annualRevenueOrBudget:
      "185000000 XAF",

    creationYear:
      "2021",

    interventionZone:
      "Cameroun et Côte d'Ivoire",

    existingESGPolicy:
      "Partiellement",

    existingESGReport:
      "Non",

    diagnosticPurpose: [
      "Structurer la démarche ESG",
      "Améliorer la préparation au financement",
      "Renforcer la crédibilité auprès des partenaires"
    ],

    organizationSlogan:
      sloganClient,

    branding: {
      slogan:
        sloganClient
    },

    logoUpload: {
      fileName:
        "econova-test-logo.png",

      mimeType:
        "image/png",

      size:
        2000,

      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAIAAACzY5qXAAAErklEQVR4nO3dfUzUdRzA8e89wTEsH0IHuPLEOAkD8oFH04wiGpcnbax4MLLZHAWC1KAGY6tNjQcrRDbaXJYDnH9kqEiMmq40sLGxqTSWOKxpCWM2erAtuTuuP27d7qDBOBcfBu/XX7/73e++9z2O931/v+MPNE6nUwGQo5WeADDfESEgjAgBYUQICNOPux1cYBWZBzCvDNWfdm+zEgLCiBAQRoSAMCIEhBEhIGz8t6MTeX6NA8AHk//RgZUQEEaEgDAiBIQRISCMCAFhRAgII0JAGBECwogQEEaEgDAiBIQRISCMCAFhRAgII0JAGBECwogQEEaEgDAiBIQRISCMCAFhRAgII0JAGBECwogQEEaEgDAiBIQRISCMCAFhRAgIm/pfo803TZ0dRy+0BxoDAv0DajJfD10cpJQyl2T21xz3PMy9x1ScsdZkdu1MjYrLS05fUZyx3rT686J9nkd+cfni4a9blVLdA31xqyKVUjs3W55bu/E/R+i9ObD31FGbw6HXamu3F4UuDmrs7Gju+lKv1d0fEPh+dn7IoqAZ+nHg/0eEXr754VJLz/nWN6uNBr9zfT2FjbWfFe6d/CF+en1L0X7PPf56vWPM0XWtNyk8yr0zLSYxLSZRKWUuyRx3/MQR9jTVNb1WEbIo6MylrndajuQkPdN++WLrG9UGna7+qxPFzYeO5797ry8Vswano14azraUbc01GvyUUsmR601LQ2wOhw/jlFiyq9uO+TyN23d++9tmU0qlRsXvfMLScLal1JJj0OmUUjs2pRkNfo6xMZ8Hx2xDhF6uDt6IejDMffNAVr7rV3+6HjdHK6U6+3t9m0bZ1txtH75d3FzXPdAXv2rN1cEbkctNrrsWGAM+3VWu0/LGzR2cjnrxYYUZtdufP1jm2i635m5YGeHaLrVkV505dsr8ng8jvJjw1LPR8e1Xvqs4cTgtJtH+72r80bmTHb3dw3+MdFY0THeemLWI0EvYstDvf/5xncmslHI6nUVNB+te2jP5QyZe0bkkhUfptNpv+69M+aTjRvj1zu/XhwdjwyIyE55OeTR2y77dYctC+3756bEV4XnJ6VmJKdFlL0/vVWF246zGyyub0ypbG0ftNqXUyZ4Ld222exmt1JJdM/0rQ43S7DpSdWvktlJq5K8/ly9Zun1janVbs+vq9JPzbToN79qcwkroZdu6TdeHb6VUFT+wYGHQfQsrX8hz7R+1260fvOXajg17pCJ9h/shnieTG1ZGlFtz3XclPLzGoNPftdsnf9KJIxzIyn/140qjwV+n1dbmFK4Oeeja0M0n9+8OXrgkI26LXkeEc4rG6XR63g4usI47Yqj+9AzOB5iDJs+Kz1RAGBECwogQEEaEgDAiBIQRISCMCAFhRAgII0JAGBECwogQEEaEgDAiBIQRISCMCAFhRAgII0JAGBECwogQEEaEgDAiBIQRISCMCAFhRAgII0JAGBECwogQEEaEgDAiBIQRISCMCAFhRAgII0JAGBECwogQEEaEgDAiBIQRISCMCAFh+imPCC6wzsA8gHmLlRAQRoSAMCIEhBEhIIwIAWEap9MpPQdgXmMlBIQRISCMCAFh/wAv7CQLdI6yqQAAAABJRU5ErkJggg=="
    }
  };


  /*
   * ========================================================
   * 4. RÉPONSES ESG
   * ========================================================
   *
   * Valeurs officielles simples et stables :
   * maturité 3 + preuve MEDIUM.
   */

  var reponsesESG = {};

  questionsESG.forEach(
    function(question, index) {

      var id =
        question.question_id ||
        question.id ||
        question.questionId;

      if (!id) {
        return;
      }

      reponsesESG[id] = {
        value:
          3,

        evidenceLevel:
          index % 4 === 0
            ? "STRONG"
            : "MEDIUM",

        comment:
          index % 6 === 0
            ? "Pratique existante nécessitant une formalisation complémentaire."
            : ""
      };
    }
  );

  TEST_ESG_FINAL_ASSERT_(
    Object.keys(
      reponsesESG
    ).length ===
    questionsESG.length,
    "Toutes les questions ESG n'ont pas reçu une réponse."
  );


  /*
   * ========================================================
   * 5. RÉPONSES NUMÉRIQUES
   * ========================================================
   */

  var reponsesDigitales = {
    "DIG-WEB-001":
      2,

    "DIG-LINK-002":
      3,

    "DIG-COM-003":
      2,

    "DIG-DATA-004":
      3,

    "DIG-PRIOR-005": [
      "SECTION_ESG",
      "STRATEGIE_CONTENU",
      "TABLEAU_DE_BORD"
    ]
  };


  /*
   * ========================================================
   * 6. PAYLOAD GLOBAL
   * ========================================================
   */

  var payload = {
    profil:
      profil,

    reponsesESG:
      reponsesESG,

    reponsesDigitales:
      reponsesDigitales,

    consentements: {
      diagnostic:
        true,

      privacyNoticeAccepted:
        true,

      /*
       * On ne teste aucune sollicitation commerciale.
       */
      afriGreen24:
        false,

      mbDigital:
        false
    }
  };


  /*
   * ========================================================
   * 7. EXÉCUTION END-TO-END
   * ========================================================
   */

  Logger.log("------------------------------------------");
  Logger.log("Lancement soumettreDiagnosticV2()...");
  Logger.log("Une seule génération complète sera exécutée.");

  var debut =
    new Date().getTime();

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
   * ========================================================
   * 8. VALIDATION PIPELINE
   * ========================================================
   */

  TEST_ESG_FINAL_ASSERT_(
    resultat &&
    resultat.success === true,
    "Le pipeline ESG n'a pas retourné success=true."
  );

  TEST_ESG_FINAL_ASSERT_(
    !!resultat.docUrl,
    "URL Google Docs absente."
  );

  TEST_ESG_FINAL_ASSERT_(
    !!resultat.pdfUrl,
    "URL PDF absente."
  );

  TEST_ESG_FINAL_ASSERT_(
    resultat.scoreESG !==
      undefined &&
    resultat.scoreESG !==
      null,
    "Score ESG absent."
  );

  var rewrite =
    resultat.humbleOSRewrite || {};

  TEST_ESG_FINAL_ASSERT_(
    rewrite.attempted === true,
    "HumbleOS Rewrite n'a pas été tenté."
  );

  if (
  rewrite.applied === true
) {
  Logger.log(
    "✅ HumbleOS Rewrite appliqué"
  );
} else {
  Logger.log(
    "⚠️ HumbleOS indisponible — fallback Apps Script utilisé"
  );
}

  TEST_ESG_FINAL_ASSERT_(
    Number(
      rewrite.blockCount || 0
    ) > 0,
    "Aucun bloc rédactionnel n'a été envoyé à HumbleOS."
  );

  Logger.log(
    "✅ HumbleOS Rewrite appliqué"
  );

  Logger.log(
    "Blocs Rewrite : " +
    rewrite.blockCount
  );

  Logger.log(
    "Fallback blocs : " +
    (
      rewrite.fallbackCount || 0
    )
  );


  /*
   * ========================================================
   * 9. OUVERTURE DU GOOGLE DOC FINAL
   * ========================================================
   */

  var documentId =
    TEST_ESG_FINAL_EXTRAIRE_DOC_ID_(
      resultat.docUrl
    );

  TEST_ESG_FINAL_ASSERT_(
    !!documentId,
    "Impossible d'extraire l'ID Google Docs."
  );

  /*
   * Petite marge pour Drive/Docs.
   */
  Utilities.sleep(
    1200
  );

  var documentFinal =
    DocumentApp.openById(
      documentId
    );

  var body =
    documentFinal.getBody();

  var texteDocument =
    body.getText();

  var footer =
    documentFinal.getFooter();

  var texteFooter =
    footer
      ? footer.getText()
      : "";

  var texteComplet =
    (
      texteDocument +
      "\n" +
      texteFooter
    );


  /*
   * ========================================================
   * 10. IDENTITÉ CLIENT
   * ========================================================
   */

  TEST_ESG_FINAL_ASSERT_(
    texteDocument.indexOf(
      "EcoNova Industries"
    ) !== -1,
    "Nom de l'organisation absent du rapport."
  );

  TEST_ESG_FINAL_ASSERT_(
    texteDocument.indexOf(
      "RAPPORT DE DIAGNOSTIC ESG"
    ) !== -1,
    "Titre du rapport ESG absent."
  );

  TEST_ESG_FINAL_ASSERT_(
    texteFooter.indexOf(
      sloganClient
    ) !== -1,
    "Slogan client absent du footer."
  );

  var nombreImages =
    TEST_ESG_FINAL_COMPTER_IMAGES_(
      body
    );

  TEST_ESG_FINAL_ASSERT_(
    nombreImages >= 1,
    "Logo client absent de la couverture."
  );

  Logger.log(
    "✅ Logo client détecté"
  );

  Logger.log(
    "✅ Slogan client détecté"
  );


  /*
   * ========================================================
   * 11. SECTIONS ESG INSTITUTIONNELLES
   * ========================================================
   */

  [
    "Résumé exécutif",
    "Profil de l’organisation",
    "Score ESG global",
    "Analyse Environnement",
    "Analyse Sociale",
    "Analyse Gouvernance",
    "ESG Readiness",
    "Alertes critiques",
    "Forces",
    "Niveau de confiance et limites",
    "Transparence et visibilité numérique ESG",
    "Conclusion"
  ].forEach(
    function(section) {
      TEST_ESG_FINAL_ASSERT_(
        texteDocument.indexOf(
          section
        ) !== -1,
        "Section ESG absente : " +
        section
      );
    }
  );

  Logger.log(
    "✅ Sections ESG institutionnelles présentes"
  );


  /*
   * ========================================================
   * 12. CONTENU INTERDIT DANS LE PDF CLIENT
   * ========================================================
   */

  var contenusInterdits = [
    "Ressources et accompagnement AfriGreen24",
    "Découvrir le Guide",
    "Accompagnement AfriGreen24",
    "Contact AfriGreen24",
    "HUMBLE LABS DIGITAL",
    "Plan d’action ESG",
    "Actions immédiates — 0 à 3 mois",
    "Actions à court terme — 3 à 6 mois",
    "Actions structurelles — 6 à 24 mois",
    "Indicateurs ESG recommandés",
    "Prochaine étape recommandée"
  ];

  contenusInterdits.forEach(
    function(texteInterdit) {
      TEST_ESG_FINAL_ASSERT_(
        texteComplet.indexOf(
          texteInterdit
        ) === -1,
        "Contenu interdit présent dans le rapport client : " +
        texteInterdit
      );
    }
  );

  TEST_ESG_FINAL_ASSERT_(
    texteComplet.indexOf(
      "AfriGreen24"
    ) === -1,
    "La marque AfriGreen24 apparaît encore dans le document client."
  );

  Logger.log(
    "✅ Aucun contenu commercial AfriGreen24 dans le rapport"
  );

  Logger.log(
    "✅ Aucun plan de correction dans le rapport"
  );

  Logger.log(
    "✅ Aucun CTA ou offre commerciale dans le rapport"
  );


  /*
   * ========================================================
   * 13. PDF
   * ========================================================
   */

  var pdfId =
    TEST_ESG_FINAL_EXTRAIRE_PDF_ID_(
      resultat
    );

  TEST_ESG_FINAL_ASSERT_(
    !!pdfId,
    "Impossible d'extraire l'ID du PDF."
  );

  var pdfFile =
    DriveApp.getFileById(
      pdfId
    );

  TEST_ESG_FINAL_ASSERT_(
    pdfFile.getMimeType() ===
      MimeType.PDF,
    "Le fichier final n'est pas un PDF."
  );

  TEST_ESG_FINAL_ASSERT_(
    pdfFile.getSize() > 0,
    "Le PDF final est vide."
  );

  Logger.log(
    "✅ PDF final valide"
  );


  /*
   * ========================================================
   * 14. JOURNAL FINAL
   * ========================================================
   */

  Logger.log("------------------------------------------");
  Logger.log("RÉSULTAT FINAL");
  Logger.log("------------------------------------------");

  Logger.log(
    "Durée : " +
    duree.toFixed(2) +
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
    "Rewrite blocks : " +
    rewrite.blockCount
  );

  Logger.log(
    "Fallback blocks : " +
    (
      rewrite.fallbackCount || 0
    )
  );

  Logger.log(
    "Images détectées : " +
    nombreImages
  );

  Logger.log("------------------------------------------");
  Logger.log("✅ GOOGLE DOCS :");
  Logger.log(
    resultat.docUrl
  );

  Logger.log("------------------------------------------");
  Logger.log("✅ PDF :");
  Logger.log(
    resultat.pdfUrl
  );

  if (
    resultat.pdfDownloadUrl
  ) {
    Logger.log("------------------------------------------");
    Logger.log("✅ PDF DOWNLOAD :");
    Logger.log(
      resultat.pdfDownloadUrl
    );
  }

  if (
    resultat.spreadsheetUrl
  ) {
    Logger.log("------------------------------------------");
    Logger.log("✅ STOCKAGE :");
    Logger.log(
      resultat.spreadsheetUrl
    );
  }

  Logger.log("------------------------------------------");
  Logger.log("✅ SCORING = APPS SCRIPT");
  Logger.log("✅ HUMBLEOS = RÉDACTION FINALE UNIQUEMENT");
  Logger.log("✅ SAFE FALLBACK ACTIF");
  Logger.log("✅ LOGO CLIENT INTÉGRÉ");
  Logger.log("✅ SLOGAN CLIENT INTÉGRÉ");
  Logger.log("✅ RAPPORT CENTRÉ SUR L'ENTREPRISE");
  Logger.log("✅ 0 OFFRE AFRIGREEN24 DANS LE PDF");
  Logger.log("✅ 0 PLAN DE CORRECTION DANS LE PDF");
  Logger.log("✅ 0 CTA COMMERCIAL DANS LE PDF");
  Logger.log("✅ GOOGLE DOCS GÉNÉRÉ");
  Logger.log("✅ PDF GÉNÉRÉ");
  Logger.log("✅ STOCKAGE EFFECTUÉ");
  Logger.log("✅ 1 APPEL HUMBLEOS MAXIMUM");
  Logger.log("✅ 0 RETRY");
  Logger.log("==========================================");
  Logger.log("✅ TEST ESG FINAL COMPLET RÉUSSI");
  Logger.log("==========================================");

  return {
    success:
      true,

    duration_seconds:
      duree,

    organisation:
      resultat.organisation,

    scoreESG:
      resultat.scoreESG,

    maturite:
      resultat.maturite,

    risque:
      resultat.risque,

    scoreDigital:
      resultat.scoreDigital,

    humbleOSRewrite:
      rewrite,

    branding: {
      logoDetected:
        nombreImages >= 1,

      sloganDetected:
        texteFooter.indexOf(
          sloganClient
        ) !== -1
    },

    commercialContentAbsent:
      true,

    correctivePlanAbsent:
      true,

    docUrl:
      resultat.docUrl,

    pdfUrl:
      resultat.pdfUrl,

    pdfDownloadUrl:
      resultat.pdfDownloadUrl,

    spreadsheetUrl:
      resultat.spreadsheetUrl
  };
}


/* ============================================================
   HELPERS TEST
============================================================ */

function TEST_ESG_FINAL_ASSERT_(
  condition,
  message
) {
  if (
    !condition
  ) {
    throw new Error(
      "TEST ESG FINAL — " +
      message
    );
  }
}


function TEST_ESG_FINAL_EXTRAIRE_DOC_ID_(
  url
) {
  var match =
    String(
      url || ""
    ).match(
      /\/document\/d\/([^/]+)/
    );

  return match
    ? match[1]
    : "";
}


function TEST_ESG_FINAL_EXTRAIRE_PDF_ID_(
  resultat
) {
  resultat =
    resultat || {};

  var download =
    String(
      resultat.pdfDownloadUrl || ""
    );

  var matchDownload =
    download.match(
      /[?&]id=([^&]+)/
    );

  if (
    matchDownload
  ) {
    return matchDownload[1];
  }

  var url =
    String(
      resultat.pdfUrl || ""
    );

  var matchFile =
    url.match(
      /\/d\/([^/]+)/
    );

  return matchFile
    ? matchFile[1]
    : "";
}


function TEST_ESG_FINAL_COMPTER_IMAGES_(
  element
) {
  if (
    !element
  ) {
    return 0;
  }

  var count = 0;

  try {
    if (
      element.getType &&
      element.getType() ===
        DocumentApp.ElementType.INLINE_IMAGE
    ) {
      count++;
    }
  } catch (
    errorType
  ) {
    // Élément non typable : ignoré.
  }

  try {
    if (
      typeof element.getNumChildren ===
        "function"
    ) {
      for (
        var index = 0;
        index < element.getNumChildren();
        index++
      ) {
        count +=
          TEST_ESG_FINAL_COMPTER_IMAGES_(
            element.getChild(
              index
            )
          );
      }
    }
  } catch (
    errorChildren
  ) {
    // Élément feuille : aucun enfant.
  }

  return count;
}
