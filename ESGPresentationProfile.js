/**
 * ============================================================
 * ESG PRESENTATION PROFILE V2
 * ============================================================
 *
 * Presentation-only contract.
 * No ESG score, risk, recommendation or business rule is recalculated here.
 */

var ESG_PRESENTATION_CONTRACT_VERSION_V2 =
  "ESG_PRESENTATION_CONTRACT_V2";

var ESG_PRESENTATION_ENGINE_VERSION_V2 =
  "ESG_PRESENTATION_ENGINE_V2";

var ESG_DESIGN_PROFILE_V2 = {
  INVESTOR_PREMIUM:
    "INVESTOR_PREMIUM_V1",

  INSTITUTIONAL:
    "INSTITUTIONAL_V1",

  IMPACT:
    "IMPACT_V1"
};

var ESG_SECTOR_PROFILE_V2 = {
  GENERIC:
    "GENERIC",

  ENERGY:
    "ENERGY",

  AGRICULTURE:
    "AGRICULTURE",

  FINTECH:
    "FINTECH",

  MANUFACTURING:
    "MANUFACTURING",

  HEALTH:
    "HEALTH",

  INFRASTRUCTURE:
    "INFRASTRUCTURE",

  NGO_IMPACT:
    "NGO_IMPACT"
};


function obtenirDesignProfileESGV2_(
  requested
) {
  var value =
    String(
      requested ||
      ESG_DESIGN_PROFILE_V2
        .INVESTOR_PREMIUM
    )
      .trim()
      .toUpperCase();

  /*
   * V2 foundation: one validated visual profile only.
   * Declared future profiles never activate silently.
   */
  if (
    value !==
    ESG_DESIGN_PROFILE_V2
      .INVESTOR_PREMIUM
  ) {
    console.warn(
      "ESG_DESIGN_PROFILE_V2 non activé ; fallback INVESTOR_PREMIUM_V1 : " +
      value
    );

    return ESG_DESIGN_PROFILE_V2
      .INVESTOR_PREMIUM;
  }

  return value;
}


function obtenirSectorProfileESGV2_(
  canonicalModel,
  requested
) {
  var explicit =
    String(
      requested || ""
    )
      .trim()
      .toUpperCase();

  var allowed =
    Object.keys(
      ESG_SECTOR_PROFILE_V2
    ).map(
      function(key) {
        return ESG_SECTOR_PROFILE_V2[
          key
        ];
      }
    );

  if (
    allowed.indexOf(
      explicit
    ) !== -1
  ) {
    return explicit;
  }

  var sector =
    String(
      canonicalModel &&
      canonicalModel.organization
        ? canonicalModel
            .organization
            .sector || ""
        : ""
    )
      .trim()
      .toLowerCase();

  if (
    /energie|énergie|solar|solaire|power|electric/.test(
      sector
    )
  ) {
    return ESG_SECTOR_PROFILE_V2
      .ENERGY;
  }

  if (
    /agri|food|aliment|farm/.test(
      sector
    )
  ) {
    return ESG_SECTOR_PROFILE_V2
      .AGRICULTURE;
  }

  if (
    /fintech|finance|bank|paiement/.test(
      sector
    )
  ) {
    return ESG_SECTOR_PROFILE_V2
      .FINTECH;
  }

  if (
    /manufact|industrie|factory|usine/.test(
      sector
    )
  ) {
    return ESG_SECTOR_PROFILE_V2
      .MANUFACTURING;
  }

  if (
    /health|santé|medical|médical/.test(
      sector
    )
  ) {
    return ESG_SECTOR_PROFILE_V2
      .HEALTH;
  }

  if (
    /infrastructure|construction|transport|logistique/.test(
      sector
    )
  ) {
    return ESG_SECTOR_PROFILE_V2
      .INFRASTRUCTURE;
  }

  if (
    /ngo|ong|association|foundation|fondation|impact/.test(
      sector
    )
  ) {
    return ESG_SECTOR_PROFILE_V2
      .NGO_IMPACT;
  }

  return ESG_SECTOR_PROFILE_V2
    .GENERIC;
}


function construireBrandProfileESGV2_(
  canonicalModel,
  profil
) {
  canonicalModel =
    canonicalModel || {};

  profil =
    profil || {};

  var organization =
    canonicalModel.organization ||
    {};

  return {
    organizationName:
      String(
        organization.name ||
        profil.organizationName ||
        profil.nomOrganisation ||
        ""
      ),

    logoFileId:
      String(
        profil.logoFileId ||
        profil.logoDriveId ||
        profil.organizationLogoFileId ||
        ""
      ),

    primaryColor:
      normaliserCouleurHexESGV2_(
        profil.primaryColor ||
        profil.brandPrimaryColor ||
        ""
      ),

    secondaryColor:
      normaliserCouleurHexESGV2_(
        profil.secondaryColor ||
        profil.brandSecondaryColor ||
        ""
      ),

    sector:
      String(
        organization.sector ||
        ""
      ),

    mainCountry:
      String(
        organization.mainCountry ||
        ""
      ),

    whiteLabel:
      true
  };
}


function normaliserCouleurHexESGV2_(
  value
) {
  value =
    String(
      value || ""
    ).trim();

  if (
    /^#[0-9A-Fa-f]{6}$/.test(
      value
    )
  ) {
    return value.toUpperCase();
  }

  return "";
}


function construirePresentationSpecESGV2_(
  documentModel,
  profil,
  options
) {
  options =
    options || {};

  if (
    !documentModel ||
    documentModel.schemaVersion !==
      ESG_REPORT_SCHEMA_VERSION
  ) {
    throw new Error(
      "ESG_PRESENTATION_MODEL_INVALID"
    );
  }

  if (
    !documentModel.report ||
    !Array.isArray(
      documentModel
        .report
        .sections
    ) ||
    !documentModel
      .report
      .sections
      .length
  ) {
    throw new Error(
      "ESG_PRESENTATION_SECTIONS_MISSING"
    );
  }

  return {
    contractVersion:
      ESG_PRESENTATION_CONTRACT_VERSION_V2,

    engineVersion:
      ESG_PRESENTATION_ENGINE_VERSION_V2,

    reportProfile:
      String(
        documentModel
          .report
          .profile ||
        ESG_REPORT_PROFILE_V1
          .SNAPSHOT
      ),

    designProfile:
      obtenirDesignProfileESGV2_(
        options.designProfile ||
        ""
      ),

    sectorProfile:
      obtenirSectorProfileESGV2_(
        documentModel,
        options.sectorProfile ||
        ""
      ),

    language:
      String(
        documentModel
          .report
          .language ||
        "fr"
      ),

    brandProfile:
      construireBrandProfileESGV2_(
        documentModel,
        profil
      ),

    documentModel:
      documentModel
  };
}


function TEST_ESG_PRESENTATION_PROFILE_V2_LOCAL() {
  var model =
    creerESGReportSchemaV1Vide_();

  model.organization.name =
    "Kivu Solar Test";

  model.organization.sector =
    "Énergie solaire";

  model.report.profile =
    ESG_REPORT_PROFILE_V1
      .SNAPSHOT;

  model.report.sections = [
    {
      sectionId:
        "SNAP-COVER",

      title:
        "Cover",

      blocks:
        []
    }
  ];

  var spec =
    construirePresentationSpecESGV2_(
      model,
      {
        primaryColor:
          "#123456"
      },
      {
        designProfile:
          ESG_DESIGN_PROFILE_V2
            .INVESTOR_PREMIUM
      }
    );

  return {
    success:
      spec.contractVersion ===
        ESG_PRESENTATION_CONTRACT_VERSION_V2 &&
      spec.designProfile ===
        ESG_DESIGN_PROFILE_V2
          .INVESTOR_PREMIUM &&
      spec.sectorProfile ===
        ESG_SECTOR_PROFILE_V2
          .ENERGY &&
      spec.brandProfile
        .primaryColor ===
        "#123456" &&
      spec.brandProfile
        .whiteLabel ===
        true,

    designProfile:
      spec.designProfile,

    sectorProfile:
      spec.sectorProfile
  };
}
