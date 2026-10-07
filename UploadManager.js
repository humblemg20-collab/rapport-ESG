function enregistrerLogoEntreprise(payload) {
  if (!AFRIGREEN24_BRANDING_CONFIG.actif) {
    return { success: false, skipped: true, reason: "Branding désactivé" };
  }

  if (!payload || !payload.dataUrl) {
    return { success: true, skipped: true, fileId: null };
  }

  var parsed = extraireLogoDataUrl_(payload.dataUrl);
  validerLogo_(parsed.mimeType, parsed.bytes);

  var folder = getBrandingUploadFolder_();

  var organisation = nettoyerNomFichierBranding_(
    payload.organisation || "organisation"
  );

  var extension =
    parsed.mimeType === "image/png"
      ? "png"
      : "jpg";

  var timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || "GMT",
    "yyyyMMdd_HHmmss"
  );

  var fileName =
    "logo_" +
    organisation +
    "_" +
    timestamp +
    "." +
    extension;

  var blob = Utilities.newBlob(
    parsed.bytes,
    parsed.mimeType,
    fileName
  );

  var file = folder.createFile(blob);

  file.setDescription(
    "Logo envoyé via AfriGreen24 pour personnalisation du rapport ESG."
  );

  return {
    success: true,
    skipped: false,
    fileId: file.getId(),
    fileName: file.getName(),
    mimeType: parsed.mimeType,
    size: parsed.bytes.length,
    driveUrl: file.getUrl()
  };
}


function extraireLogoDataUrl_(dataUrl) {
  var match =
    /^data:(image\/(?:png|jpeg));base64,(.+)$/i.exec(
      String(dataUrl || "")
    );

  if (!match) {
    throw new Error(
      "Logo invalide. Formats acceptés : PNG ou JPG/JPEG."
    );
  }

  return {
    mimeType: match[1].toLowerCase(),
    bytes: Utilities.base64Decode(match[2])
  };
}


function validerLogo_(mimeType, bytes) {
  if (
    AFRIGREEN24_BRANDING_CONFIG.allowedMimeTypes.indexOf(
      mimeType
    ) === -1
  ) {
    throw new Error(
      "Format de logo non accepté. Utilisez PNG ou JPG/JPEG."
    );
  }

  if (!bytes || !bytes.length) {
    throw new Error(
      "Le fichier logo est vide."
    );
  }

  if (
    bytes.length >
    AFRIGREEN24_BRANDING_CONFIG.maxLogoBytes
  ) {
    throw new Error(
      "Le logo dépasse la taille maximale autorisée de 2 Mo."
    );
  }
}


function getBrandingUploadFolder_() {
  var props =
    PropertiesService.getScriptProperties();

  var propertyName =
    AFRIGREEN24_BRANDING_CONFIG
      .scriptPropertyFolderId;

  var savedId =
    props.getProperty(
      propertyName
    );

  if (savedId) {
    try {
      return DriveApp.getFolderById(
        savedId
      );
    } catch (e) {
      props.deleteProperty(
        propertyName
      );
    }
  }

  var folders =
    DriveApp.getFoldersByName(
      AFRIGREEN24_BRANDING_CONFIG
        .uploadFolderName
    );

  var folder =
    folders.hasNext()
      ? folders.next()
      : DriveApp.createFolder(
          AFRIGREEN24_BRANDING_CONFIG
            .uploadFolderName
        );

  props.setProperty(
    propertyName,
    folder.getId()
  );

  return folder;
}


function nettoyerNomFichierBranding_(value) {
  var cleaned =
    String(
      value || "organisation"
    )
      .trim()
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );

  return (
    cleaned ||
    "organisation"
  );
}
