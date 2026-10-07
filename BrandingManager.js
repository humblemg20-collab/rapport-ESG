function insererLogoDansGoogleDoc(
  documentId,
  logoFileId
) {
  if (!documentId) {
    throw new Error(
      "documentId manquant."
    );
  }

  var doc =
    DocumentApp.openById(
      documentId
    );

  var body =
    doc.getBody();

  if (!logoFileId) {
    body.replaceText(
      "\\{\\{LOGO_ENTREPRISE\\}\\}",
      ""
    );

    doc.saveAndClose();

    return {
      success: true,
      inserted: false
    };
  }

  var file =
    DriveApp.getFileById(
      logoFileId
    );

  var blob =
    file.getBlob();

  var found =
    body.findText(
      "\\{\\{LOGO_ENTREPRISE\\}\\}"
    );

  var paragraph;

  if (found) {
    var text =
      found
        .getElement()
        .asText();

    var start =
      found.getStartOffset();

    var end =
      found.getEndOffsetInclusive();

    if (
      start >= 0 &&
      end >= start
    ) {
      text.deleteText(
        start,
        end
      );
    }

    var parent =
      text.getParent();

    if (
      parent.getType() ===
      DocumentApp.ElementType.PARAGRAPH
    ) {
      paragraph =
        parent.asParagraph();
    } else {
      paragraph =
        body.insertParagraph(
          0,
          ""
        );
    }
  } else {
    // Aucun template requis :
    // si le marqueur n'existe pas, le logo est ajouté
    // automatiquement en haut de la couverture.
    paragraph =
      body.insertParagraph(
        0,
        ""
      );
  }

  var image =
    paragraph.appendInlineImage(
      blob
    );

  redimensionnerInlineImageBranding_(
    image,
    AFRIGREEN24_BRANDING_CONFIG
      .docMaxWidth,
    AFRIGREEN24_BRANDING_CONFIG
      .docMaxHeight
  );

  paragraph
    .setAlignment(
      DocumentApp
        .HorizontalAlignment
        .CENTER
    )
    .setSpacingAfter(
      10
    );

  doc.saveAndClose();

  return {
    success: true,
    inserted: true,
    documentId: documentId,
    logoFileId: logoFileId
  };
}


function redimensionnerInlineImageBranding_(
  image,
  maxWidth,
  maxHeight
) {
  var width =
    image.getWidth();

  var height =
    image.getHeight();

  if (
    !width ||
    !height
  ) {
    return image;
  }

  var ratio =
    Math.min(
      maxWidth / width,
      maxHeight / height,
      1
    );

  image.setWidth(
    Math.round(
      width * ratio
    )
  );

  image.setHeight(
    Math.round(
      height * ratio
    )
  );

  return image;
}
