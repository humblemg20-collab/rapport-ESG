function testInsertionLogoDocAvecFileId() {
  var DOCUMENT_ID = "1EIXzCIzeWbJ-W2i4y7tTJT1C0H5ewJTMGNuV5IEDJjQ";
  var LOGO_FILE_ID = "REMPLACER_PAR_UN_LOGO_DRIVE_DE_TEST";
  Logger.log(JSON.stringify(
    insererLogoDansGoogleDoc(DOCUMENT_ID, LOGO_FILE_ID),
    null,
    2
  ));
}

function testInsertionLogoSlidesAvecFileId() {
  var PRESENTATION_ID = "REMPLACER_PAR_UN_SLIDES_DE_TEST";
  var LOGO_FILE_ID = "REMPLACER_PAR_UN_LOGO_DRIVE_DE_TEST";
  Logger.log(JSON.stringify(
    insererLogoDansGoogleSlides(PRESENTATION_ID, LOGO_FILE_ID),
    null,
    2
  ));
}
function testerFluxESGCompletAvecLogoSimule() {

  // =====================================================
  // 1. RÉCUPÉRER UN VRAI PNG DE TEST
  // =====================================================

  var logoUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

  var response =
    UrlFetchApp.fetch(logoUrl);

  var logoBlob =
    response
      .getBlob()
      .setName("logo-test.png");


  // =====================================================
  // 2. ENREGISTRER LE LOGO DANS DRIVE
  // =====================================================

  var logoFile =
    DriveApp.createFile(
      logoBlob
    );


  Logger.log(
    "Logo créé : " +
    logoFile.getUrl()
  );


  // =====================================================
  // 3. CRÉER LE DOCUMENT ESG DE TEST
  // =====================================================

  var doc =
    DocumentApp.create(
      "TEST ESG - EcoCycle Africa"
    );


  var body =
    doc.getBody();


  // Marqueur utilisé par notre système
  body.appendParagraph(
    "{{LOGO_ENTREPRISE}}"
  );


  body.appendParagraph(
    "RAPPORT ESG"
  )
  .setHeading(
    DocumentApp
      .ParagraphHeading
      .TITLE
  );


  body.appendParagraph(
    "EcoCycle Africa"
  )
  .setHeading(
    DocumentApp
      .ParagraphHeading
      .HEADING1
  );


  body.appendParagraph(
    "Diagnostic ESG & Transformation Durable"
  );


  body.appendHorizontalRule();


  body.appendParagraph(
    "PROFIL DE L'ORGANISATION"
  )
  .setHeading(
    DocumentApp
      .ParagraphHeading
      .HEADING2
  );


  body.appendParagraph(
    "Organisation : EcoCycle Africa"
  );


  body.appendParagraph(
    "Pays : Cameroun"
  );


  body.appendParagraph(
    "Secteur : Recyclage et économie circulaire"
  );


  body.appendParagraph(
    "Responsable : Entrepreneur Test"
  );


  body.appendParagraph(
    "Email : test@ecocycle-africa.com"
  );


  body.appendParagraph(
    "SYNTHÈSE ESG"
  )
  .setHeading(
    DocumentApp
      .ParagraphHeading
      .HEADING2
  );


  body.appendParagraph(
    "Score ESG global : 74/100"
  );


  body.appendParagraph(
    "Niveau de maturité : Avancé"
  );


  body.appendParagraph(
    "EcoCycle Africa présente une base ESG structurée. " +
    "Les priorités identifiées concernent principalement " +
    "la formalisation des indicateurs environnementaux, " +
    "le suivi des impacts sociaux et le renforcement " +
    "des mécanismes de gouvernance."
  );


  body.appendParagraph(
    "PRIORITÉS RECOMMANDÉES"
  )
  .setHeading(
    DocumentApp
      .ParagraphHeading
      .HEADING2
  );


  body.appendListItem(
    "Formaliser les indicateurs environnementaux."
  );


  body.appendListItem(
    "Mettre en place un tableau de bord ESG."
  );


  body.appendListItem(
    "Documenter les politiques sociales."
  );


  body.appendListItem(
    "Renforcer la gouvernance et la traçabilité."
  );


  body.appendParagraph(
    "Document de test généré automatiquement par AfriGreen24."
  );


  doc.saveAndClose();


  var documentId =
    doc.getId();


  // =====================================================
  // 4. INSÉRER LE PNG AVEC NOTRE VRAI MOTEUR
  // =====================================================

  insererLogoDansGoogleDoc(
    documentId,
    logoFile.getId()
  );


  // Petite attente pour laisser Docs enregistrer
  Utilities.sleep(1500);


  // =====================================================
  // 5. EXPORTER LE DOCUMENT FINAL EN PDF
  // =====================================================

  var documentFile =
    DriveApp.getFileById(
      documentId
    );


  var pdfBlob =
    documentFile
      .getAs(
        MimeType.PDF
      )
      .setName(
        "TEST ESG - EcoCycle Africa - FINAL.pdf"
      );


  var pdfFile =
    DriveApp.createFile(
      pdfBlob
    );


  // =====================================================
  // 6. RÉSULTAT
  // =====================================================

  var resultat = {

    success: true,

    organisation:
      "EcoCycle Africa",

    logoId:
      logoFile.getId(),

    logoUrl:
      logoFile.getUrl(),

    documentId:
      documentId,

    documentUrl:
      "https://docs.google.com/document/d/" +
      documentId +
      "/edit",

    pdfId:
      pdfFile.getId(),

    pdfUrl:
      pdfFile.getUrl(),

    pdfDownloadUrl:
      "https://drive.google.com/uc?export=download&id=" +
      pdfFile.getId()

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