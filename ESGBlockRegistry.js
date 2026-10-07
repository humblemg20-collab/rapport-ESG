/**
 * ============================================================
 * AFRIGREEN24 — ESG BLOCK REGISTRY V1
 * ============================================================
 *
 * Catalogue déterministe des composants documentaires.
 * Le renderer reçoit des blocs déjà décidés ; il ne décide
 * jamais des règles métier.
 */

var ESG_BLOCK_REGISTRY_V1 = {
  COVER_BLOCK: {
    requiredData: [
      "organizationName"
    ],
    fallbackType:
      "COVER_BLOCK"
  },

  SECTION_COVER_BLOCK: {
    requiredData: [
      "title"
    ],
    fallbackType:
      "TEXT_BLOCK"
  },

  REPORT_METADATA_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  EXECUTIVE_SUMMARY_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  SCORE_BLOCK: {
    requiredData: [
      "scores"
    ],
    fallbackType:
      "TEXT_BLOCK"
  },

  DATA_QUALITY_BLOCK: {
    requiredData: [
      "dataQualityProfile"
    ],
    fallbackType:
      "TEXT_BLOCK"
  },

  ORGANIZATION_BLOCK: {
    requiredData: [
      "organization"
    ],
    fallbackType:
      "TEXT_BLOCK"
  },

  VALUE_CHAIN_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  STAKEHOLDER_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  MATERIALITY_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TABLE_BLOCK"
  },

  PILLAR_BLOCK: {
    requiredData: [
      "pillar"
    ],
    fallbackType:
      "TEXT_BLOCK"
  },

  KPI_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TABLE_BLOCK"
  },

  KPI_DASHBOARD_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "KPI_BLOCK"
  },

  TARGET_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "KPI_BLOCK"
  },

  CHART_BLOCK: {
    requiredData: [
      "chartType"
    ],
    fallbackType:
      "TABLE_BLOCK"
  },

  TABLE_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  TEXT_BLOCK: {
    requiredData:
      [],
    fallbackType:
      null
  },

  IMAGE_BLOCK: {
    requiredData: [
      "mediaId"
    ],
    fallbackType:
      null
  },

  IMAGE_GALLERY_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "IMAGE_BLOCK"
  },

  QUOTE_BLOCK: {
    requiredData: [
      "quote"
    ],
    fallbackType:
      null
  },

  CASE_STUDY_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  RISK_BLOCK: {
    requiredData:
      [],
    fallbackType:
      null
  },

  RISK_MATRIX_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "RISK_BLOCK"
  },

  POLICY_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  EVIDENCE_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  IMPACT_BLOCK: {
    requiredData:
      [],
    fallbackType:
      null
  },

  SDG_BLOCK: {
    requiredData:
      [],
    fallbackType:
      null
  },

  RECOMMENDATION_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  ROADMAP_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TABLE_BLOCK"
  },

  FUNDING_READINESS_BLOCK: {
    requiredData:
      [],
    fallbackType:
      null
  },

  FRAMEWORK_INDEX_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  METHODOLOGY_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  },

  DISCLAIMER_BLOCK: {
    requiredData:
      [],
    fallbackType:
      "TEXT_BLOCK"
  }
};


function creerBlocESGV1_(
  blockId,
  type,
  required,
  data,
  options
) {
  options =
    options || {};

  if (
    !ESG_BLOCK_REGISTRY_V1[
      type
    ]
  ) {
    throw new Error(
      "Type de bloc ESG inconnu : " +
      String(
        type || ""
      )
    );
  }

  var registry =
    ESG_BLOCK_REGISTRY_V1[
      type
    ];

  return {
    blockId:
      String(
        blockId || ""
      ),

    type:
      type,

    required:
      required ===
      true,

    data:
      data || {},

    dataRefs:
      options.dataRefs ||
      [],

    visibilityRule:
      options.visibilityRule ||
      null,

    renderConfig:
      options.renderConfig ||
      {},

    fallbackType:
      options.fallbackType !==
        undefined
        ? options.fallbackType
        : registry
            .fallbackType,

    validationRules:
      options.validationRules ||
      []
  };
}


function validerBlocESGV1_(
  block
) {
  var errors = [];
  var warnings = [];

  if (
    !block ||
    typeof block !==
      "object"
  ) {
    return {
      valid:
        false,
      errors: [
        "Bloc absent."
      ],
      warnings:
        []
    };
  }

  var registry =
    ESG_BLOCK_REGISTRY_V1[
      block.type
    ];

  if (!registry) {
    errors.push(
      "Type de bloc inconnu : " +
      String(
        block.type || ""
      )
    );

    return {
      valid:
        false,
      errors:
        errors,
      warnings:
        warnings
    };
  }

  if (
    !String(
      block.blockId || ""
    ).trim()
  ) {
    errors.push(
      "blockId manquant."
    );
  }

  var data =
    block.data || {};

  (
    registry.requiredData ||
    []
  ).forEach(
    function(field) {
      if (
        data[field] ===
          undefined ||
        data[field] ===
          null ||
        data[field] ===
          ""
      ) {
        errors.push(
          block.type +
          " : donnée requise absente : " +
          field
        );
      }
    }
  );

  if (
    block.type ===
      "IMAGE_BLOCK" &&
    data.rightsValidated !==
      true
  ) {
    errors.push(
      "IMAGE_BLOCK sans droits validés."
    );
  }

  if (
    block.type ===
      "RISK_MATRIX_BLOCK" &&
    data.matrixEligible !==
      true
  ) {
    errors.push(
      "RISK_MATRIX_BLOCK non éligible."
    );
  }

  if (
    block.type ===
      "MATERIALITY_BLOCK" &&
    data.mode ===
      "ADVANCED_MATRIX" &&
    data.matrixEligible !==
      true
  ) {
    errors.push(
      "MATERIALITY_BLOCK Advanced non éligible."
    );
  }

  if (
    block.type ===
      "CHART_BLOCK" &&
    data.chartDataValid !==
      true
  ) {
    errors.push(
      "CHART_BLOCK sans données graphiques valides."
    );
  }

  return {
    valid:
      errors.length ===
      0,

    errors:
      errors,

    warnings:
      warnings
  };
}


function TEST_ESG_BLOCK_REGISTRY_V1_LOCAL() {
  var good =
    creerBlocESGV1_(
      "B-1",
      "SCORE_BLOCK",
      true,
      {
        scores: {
          overall:
            70
        }
      }
    );

  var goodValidation =
    validerBlocESGV1_(
      good
    );

  var badChart =
    creerBlocESGV1_(
      "B-2",
      "CHART_BLOCK",
      false,
      {
        chartType:
          "LINE",
        chartDataValid:
          false
      }
    );

  var badValidation =
    validerBlocESGV1_(
      badChart
    );

  return {
    success:
      goodValidation.valid ===
        true &&
      badValidation.valid ===
        false,

    good:
      goodValidation,

    bad:
      badValidation
  };
}
