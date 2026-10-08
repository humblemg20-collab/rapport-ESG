/**
 * ============================================================
 * ESG TEST FIXTURES
 * ============================================================
 *
 * One canonical Kivu Solar fixture reused by Google Docs and Premium renderer
 * smoke tests. This prevents test-data drift between presentation channels.
 */

function construireFixtureKivuSolarESGV2_() {
  var profil = {
    organizationName:
      "Kivu Solar Test",

    mainCountry:
      "RDC",

    organizationType:
      "Entreprise",

    mainSector:
      "Énergie solaire",

    employeeCount:
      "36",

    creationYear:
      "2021",

    interventionZone:
      "Afrique centrale"
  };

  var reponses = {};

  obtenirQuestionsESG()
    .forEach(
      function(
        question,
        index
      ) {
        reponses[
          question.question_id
        ] = {
          value:
            index %
            6,

          evidenceLevel:
            index %
              3 ===
              0
              ? "MEDIUM"
              : "DECLARATIVE",

          comment:
            "Test Snapshot renderer.",

          inputMethod:
            "MANUAL",

          userConfirmed:
            true
        };
      }
    );

  var analyse =
    executerDiagnosticEtRecommandationsESG(
      reponses
    );

  var model =
    adapterAnalyseLegacyVersSchemaESGV1(
      profil,
      analyse,
      {},
      {
        profile:
          "SNAPSHOT",

        rawResponses:
          reponses,

        intake: {
          entryMode:
            "manual"
        }
      }
    );

  model =
    executerEvidenceEngineESGV1(
      model
    ).model;

  model =
    executerDataQualityEngineESGV1(
      model
    ).model;

  return {
    profil:
      profil,

    reponses:
      reponses,

    analyse:
      analyse,

    model:
      model
  };
}


function TEST_ESG_KIVU_FIXTURE_V2_LOCAL() {
  var fixture =
    construireFixtureKivuSolarESGV2_();

  var validation =
    validerESGReportSchemaV1(
      fixture.model
    );

  return {
    success:
      validation.valid ===
        true &&
      fixture.model.organization.name ===
        "Kivu Solar Test" &&
      (
        fixture.model
          .assessment
          .responses ||
        []
      ).length >
        0,

    validation:
      validation,

    counts: {
      responses:
        (
          fixture.model
            .assessment
            .responses ||
          []
        ).length,

      risks:
        (
          fixture.model
            .risks ||
          []
        ).length,

      recommendedIndicators:
        (
          fixture.model
            .recommendedIndicators ||
          []
        ).length,

      recommendations:
        (
          fixture.model
            .recommendations ||
          []
        ).length,

      roadmapActions:
        (
          fixture.model
            .roadmapActions ||
          []
        ).length
    }
  };
}
