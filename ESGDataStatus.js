/**
 * ============================================================
 * AFRIGREEN24 — ESG DATA STATUS V1
 * ============================================================
 *
 * Statuts canoniques du futur ESG Document Engine.
 * Aucun scoring dans ce fichier.
 */

var ESG_DATA_STATUS_V1 = {
  CONFIRMED: "CONFIRMED",
  DECLARED: "DECLARED",
  CALCULATED: "CALCULATED",
  ESTIMATE: "ESTIMATE",
  NOT_AVAILABLE: "NOT_AVAILABLE",
  NOT_ASSESSED: "NOT_ASSESSED"
};

var ESG_VALIDATION_STATUS_V1 = {
  UNREVIEWED: "UNREVIEWED",
  INTERNALLY_VERIFIED: "INTERNALLY_VERIFIED",
  EXTERNALLY_ASSURED: "EXTERNALLY_ASSURED"
};

var ESG_APPLICABILITY_STATUS_V1 = {
  APPLICABLE: "APPLICABLE",
  NOT_APPLICABLE: "NOT_APPLICABLE"
};


function estDataStatusESGV1Valide_(value) {
  return Object.keys(ESG_DATA_STATUS_V1)
    .some(function(key) {
      return ESG_DATA_STATUS_V1[key] === value;
    });
}


function estValidationStatusESGV1Valide_(value) {
  return Object.keys(ESG_VALIDATION_STATUS_V1)
    .some(function(key) {
      return ESG_VALIDATION_STATUS_V1[key] === value;
    });
}


function estApplicabilityStatusESGV1Valide_(value) {
  return Object.keys(ESG_APPLICABILITY_STATUS_V1)
    .some(function(key) {
      return ESG_APPLICABILITY_STATUS_V1[key] === value;
    });
}


/**
 * Conversion conservatrice d'un résultat de question legacy.
 *
 * IMPORTANT :
 * un niveau de preuve STRONG/MEDIUM dans le moteur actuel ne
 * signifie pas qu'une pièce a été vérifiée indépendamment.
 * On ne transforme donc jamais automatiquement DECLARED en CONFIRMED.
 */
function determinerStatutsDepuisResultatLegacyESG_(resultat) {
  resultat = resultat || {};

  if (resultat.nonApplicable === true) {
    return {
      dataStatus: ESG_DATA_STATUS_V1.NOT_ASSESSED,
      validationStatus: ESG_VALIDATION_STATUS_V1.UNREVIEWED,
      applicabilityStatus: ESG_APPLICABILITY_STATUS_V1.NOT_APPLICABLE
    };
  }

  if (resultat.reponseManquante === true) {
    return {
      dataStatus: ESG_DATA_STATUS_V1.NOT_AVAILABLE,
      validationStatus: ESG_VALIDATION_STATUS_V1.UNREVIEWED,
      applicabilityStatus: ESG_APPLICABILITY_STATUS_V1.APPLICABLE
    };
  }

  return {
    dataStatus: ESG_DATA_STATUS_V1.DECLARED,
    validationStatus: ESG_VALIDATION_STATUS_V1.UNREVIEWED,
    applicabilityStatus: ESG_APPLICABILITY_STATUS_V1.APPLICABLE
  };
}


function TEST_ESG_DATA_STATUS_V1_LOCAL() {
  var errors = [];

  [
    ESG_DATA_STATUS_V1.CONFIRMED,
    ESG_DATA_STATUS_V1.DECLARED,
    ESG_DATA_STATUS_V1.CALCULATED,
    ESG_DATA_STATUS_V1.ESTIMATE,
    ESG_DATA_STATUS_V1.NOT_AVAILABLE,
    ESG_DATA_STATUS_V1.NOT_ASSESSED
  ].forEach(function(status) {
    if (!estDataStatusESGV1Valide_(status)) {
      errors.push("Data status invalide : " + status);
    }
  });

  var na = determinerStatutsDepuisResultatLegacyESG_({
    nonApplicable: true
  });

  if (
    na.dataStatus !== ESG_DATA_STATUS_V1.NOT_ASSESSED ||
    na.applicabilityStatus !== ESG_APPLICABILITY_STATUS_V1.NOT_APPLICABLE
  ) {
    errors.push("Mapping Non applicable incorrect.");
  }

  var missing = determinerStatutsDepuisResultatLegacyESG_({
    reponseManquante: true
  });

  if (
    missing.dataStatus !== ESG_DATA_STATUS_V1.NOT_AVAILABLE
  ) {
    errors.push("Mapping donnée manquante incorrect.");
  }

  return {
    success: errors.length === 0,
    errors: errors
  };
}
