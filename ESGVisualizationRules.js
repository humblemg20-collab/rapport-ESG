/**
 * ============================================================
 * AFRIGREEN24 — ESG VISUALIZATION RULES V1
 * ============================================================
 *
 * Sélection déterministe des représentations de données.
 * L'IA n'intervient jamais dans le choix du type de graphique.
 */

var ESG_VISUALIZATION_TYPE_V1 = {
  KPI_CARD:
    "KPI_CARD",

  DELTA_CARD:
    "DELTA_CARD",

  TARGET_PROGRESS:
    "TARGET_PROGRESS",

  LINE_CHART:
    "LINE_CHART",

  BAR_CHART:
    "BAR_CHART",

  DONUT_CHART:
    "DONUT_CHART",

  STACKED_BAR:
    "STACKED_BAR",

  RISK_HEATMAP:
    "RISK_HEATMAP",

  MATERIALITY_MATRIX:
    "MATERIALITY_MATRIX",

  TABLE:
    "TABLE",

  TEXT:
    "TEXT"
};


function selectionnerVisualisationKPIESGV1_(
  kpi
) {
  kpi =
    kpi || {};

  var history =
    Array.isArray(
      kpi.history
    )
      ? kpi.history
          .filter(
            function(point) {
              return (
                point &&
                point.period !==
                  undefined &&
                point.value !==
                  undefined &&
                isFinite(
                  Number(
                    point.value
                  )
                )
              );
            }
          )
      : [];

  if (
    history.length >=
    3
  ) {
    return {
      type:
        ESG_VISUALIZATION_TYPE_V1
          .LINE_CHART,

      reason:
        "THREE_OR_MORE_PERIODS",

      chartDataValid:
        true
    };
  }

  var categories =
    Array.isArray(
      kpi.categories
    )
      ? kpi.categories
          .filter(
            function(item) {
              return (
                item &&
                item.name !==
                  undefined &&
                isFinite(
                  Number(
                    item.value
                  )
                )
              );
            }
          )
      : [];

  if (
    categories.length >=
      2 &&
    categories.length <=
      6
  ) {
    var total =
      categories.reduce(
        function(sum, item) {
          return (
            sum +
            Number(
              item.value
            )
          );
        },
        0
      );

    var compositionEligible =
      kpi.composition ===
        true &&
      total >=
        99 &&
      total <=
        101;

    if (
      compositionEligible
    ) {
      return {
        type:
          categories.length <=
            5
            ? ESG_VISUALIZATION_TYPE_V1
                .DONUT_CHART
            : ESG_VISUALIZATION_TYPE_V1
                .STACKED_BAR,

        reason:
          "PART_TO_WHOLE",

        chartDataValid:
          true
      };
    }

    return {
      type:
        ESG_VISUALIZATION_TYPE_V1
          .BAR_CHART,

      reason:
        "HOMOGENEOUS_CATEGORIES",

      chartDataValid:
        true
    };
  }

  var hasBaseline =
    valeurKPIExisteESGV1_(
      kpi.baselineValue
    );

  var hasCurrent =
    valeurKPIExisteESGV1_(
      kpi.currentValue
    );

  var hasTarget =
    valeurKPIExisteESGV1_(
      kpi.targetValue
    ) &&
    kpi.targetYear !==
      null &&
    kpi.targetYear !==
      undefined &&
    kpi.targetYear !==
      "";

  if (
    hasBaseline &&
    hasCurrent &&
    hasTarget
  ) {
    return {
      type:
        ESG_VISUALIZATION_TYPE_V1
          .TARGET_PROGRESS,

      reason:
        "BASELINE_CURRENT_TARGET",

      chartDataValid:
        true
    };
  }

  if (
    hasBaseline &&
    hasCurrent
  ) {
    return {
      type:
        ESG_VISUALIZATION_TYPE_V1
          .DELTA_CARD,

      reason:
        "BASELINE_CURRENT",

      chartDataValid:
        true
    };
  }

  if (hasCurrent) {
    return {
      type:
        ESG_VISUALIZATION_TYPE_V1
          .KPI_CARD,

      reason:
        "CURRENT_VALUE_ONLY",

      chartDataValid:
        true
    };
  }

  return {
    type:
      ESG_VISUALIZATION_TYPE_V1
        .TEXT,

    reason:
      "INSUFFICIENT_DATA",

    chartDataValid:
      false
  };
}


function evaluerRiskHeatmapESGV1_(
  risks
) {
  var scored =
    (risks || [])
      .filter(
        function(risk) {
          return (
            risk &&
            isFinite(
              Number(
                risk.likelihood
              )
            ) &&
            isFinite(
              Number(
                risk.impact
              )
            )
          );
        }
      );

  return {
    eligible:
      scored.length >=
      3,

    scoredRiskCount:
      scored.length,

    type:
      scored.length >=
        3
        ? ESG_VISUALIZATION_TYPE_V1
            .RISK_HEATMAP
        : ESG_VISUALIZATION_TYPE_V1
            .TABLE
  };
}


function evaluerMaterialityMatrixESGV1_(
  materiality
) {
  materiality =
    materiality || {};

  var topics =
    Array.isArray(
      materiality.topics
    )
      ? materiality.topics
      : [];

  var eligibleTopics =
    topics.filter(
      function(topic) {
        return (
          topic &&
          isFinite(
            Number(
              topic
                .impactMateriality
            )
          ) &&
          isFinite(
            Number(
              topic
                .financialMateriality
            )
          )
        );
      }
    );

  var advanced =
    materiality.level ===
      "ADVANCED";

  return {
    eligible:
      advanced &&
      eligibleTopics.length >=
        2,

    topicCount:
      eligibleTopics.length,

    type:
      advanced &&
      eligibleTopics.length >=
        2
        ? ESG_VISUALIZATION_TYPE_V1
            .MATERIALITY_MATRIX
        : ESG_VISUALIZATION_TYPE_V1
            .TABLE
  };
}


function valeurKPIExisteESGV1_(
  value
) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    isFinite(
      Number(
        value
      )
    )
  );
}


function TEST_ESG_VISUALIZATION_RULES_V1_LOCAL() {
  var currentOnly =
    selectionnerVisualisationKPIESGV1_({
      currentValue:
        120
    });

  var target =
    selectionnerVisualisationKPIESGV1_({
      baselineValue:
        160,
      currentValue:
        120,
      targetValue:
        80,
      targetYear:
        2030
    });

  var history =
    selectionnerVisualisationKPIESGV1_({
      history: [
        {
          period:
            2024,
          value:
            160
        },
        {
          period:
            2025,
          value:
            145
        },
        {
          period:
            2026,
          value:
            120
        }
      ]
    });

  var heatmap =
    evaluerRiskHeatmapESGV1_([
      {
        likelihood:
          4,
        impact:
          5
      },
      {
        likelihood:
          3,
        impact:
          4
      },
      {
        likelihood:
          2,
        impact:
          3
      }
    ]);

  return {
    success:
      currentOnly.type ===
        "KPI_CARD" &&
      target.type ===
        "TARGET_PROGRESS" &&
      history.type ===
        "LINE_CHART" &&
      heatmap.eligible ===
        true
  };
}
