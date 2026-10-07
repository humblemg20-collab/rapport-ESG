function appliquerBrandingESG(
  documentId,
  donnees
) {
  if (!documentId) {
    throw new Error(
      "ID du document ESG manquant."
    );
  }

  donnees =
    donnees || {};

  var payload =
    donnees.logoUpload ||
    (
      donnees.profil &&
      donnees.profil.logoUpload
        ? donnees.profil.logoUpload
        : null
    );

  if (
    !payload ||
    !payload.dataUrl
  ) {
    return insererLogoDansGoogleDoc(
      documentId,
      null
    );
  }

  payload.organisation =
    payload.organisation ||
    donnees.organizationName ||
    donnees.nomOrganisation ||
    (
      donnees.profil
        ? (
            donnees.profil.organizationName ||
            donnees.profil.nomOrganisation
          )
        : ""
    ) ||
    "organisation";

  var upload =
    enregistrerLogoEntreprise(
      payload
    );

  if (
    !upload.success ||
    !upload.fileId
  ) {
    return insererLogoDansGoogleDoc(
      documentId,
      null
    );
  }

  var insertion =
    insererLogoDansGoogleDoc(
      documentId,
      upload.fileId
    );

  return {
    success: true,
    hasLogo: true,
    documentId: documentId,
    logoFileId:
      upload.fileId,
    logoDriveUrl:
      upload.driveUrl,
    insertion:
      insertion
  };
}
