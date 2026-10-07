/**
 * ============================================================
 * AFRIGREEN24 — ESG BRANDING HELPERS
 * ============================================================
 *
 * Objectif :
 * - exploiter le logo déjà envoyé dans profil.logoUpload ;
 * - exploiter le slogan dans profil.organizationSlogan /
 *   profil.branding.slogan ;
 * - ne modifier aucun score ou logique ESG.
 *
 * Le générateur ESG peut utiliser :
 * - obtenirSloganOrganisationESG_(profil)
 * - obtenirLogoBlobOrganisationESG_(profil)
 */

function obtenirSloganOrganisationESG_(
  profil
) {
  profil = profil || {};

  var branding =
    profil.branding || {};

  return String(
    branding.slogan ||
    profil.organizationSlogan ||
    profil.slogan ||
    ""
  ).trim();
}


function obtenirLogoBlobOrganisationESG_(
  profil
) {
  profil = profil || {};

  var upload =
    profil.logoUpload ||
    null;

  if (
    !upload ||
    !upload.dataUrl
  ) {
    return null;
  }

  var mimeType =
    String(
      upload.mimeType || ""
    ).trim();

  if (
    [
      "image/png",
      "image/jpeg"
    ].indexOf(
      mimeType
    ) === -1
  ) {
    return null;
  }

  var dataUrl =
    String(
      upload.dataUrl
    );

  var commaIndex =
    dataUrl.indexOf(
      ","
    );

  if (
    commaIndex === -1
  ) {
    return null;
  }

  var base64 =
    dataUrl.slice(
      commaIndex + 1
    );

  var bytes;

  try {
    bytes =
      Utilities.base64Decode(
        base64
      );
  } catch (
    error
  ) {
    return null;
  }

  var fileName =
    String(
      upload.fileName ||
      "logo"
    );

  return Utilities.newBlob(
    bytes,
    mimeType,
    fileName
  );
}
