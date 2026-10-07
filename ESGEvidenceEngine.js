/**
 * ============================================================
 * AFRIGREEN24 — ESG EVIDENCE ENGINE V1
 * ============================================================
 *
 * Transforme la provenance documentaire déjà vérifiée par
 * le Fact Guard en objets Evidence canoniques.
 *
 * IMPORTANT :
 * - FOUND n'est pas CONFIRMED ;
 * - ce moteur ne modifie aucun score métier ;
 * - ce moteur ne transforme pas automatiquement une réponse
 *   déclarative en donnée confirmée ;
 * - une preuve n'est INTERNALLY_VERIFIED que si :
 *   1) l'extrait a été retrouvé dans la source au moment de l'import ;
 *   2) le document source canonique est encore résolvable côté serveur.
 */

var ESG_EVIDENCE_ENGINE_VERSION_V1 =
  "ESG_EVIDENCE_ENGINE_V1";


function executerEvidenceEngineESGV1(
  canonicalModel
) {
  if (
    !canonicalModel ||
    canonicalModel.schemaVersion !==
      ESG_REPORT_SCHEMA_VERSION
  ) {
    throw new Error(
      "Canonical model invalide pour Evidence Engine V1."
    );
  }

  var model =
    JSON.parse(
      JSON.stringify(
        canonicalModel
      )
    );

  var responses =
    model.assessment &&
    Array.isArray(
      model.assessment.responses
    )
      ? model.assessment.responses
      : [];

  var sourceIds = [];

  responses.forEach(
    function(response) {
      if (
        response &&
        response.inputMethod ===
          ESG_INPUT_METHOD_V1
            .DOCUMENT_EXTRACTION &&
        response.sourceDocumentId
      ) {
        sourceIds.push(
          response.sourceDocumentId
        );
      }
    }
  );

  var repositorySources =
    resoudreDocumentsSourcesESGV1_(
      sourceIds
    );

  var documentMetadata =
    construireIndexMetadataSourcesEvidenceESG_(
      model
    );

  var evidence = [];
  var evidenceIds = {};
  var warnings = [];

  responses.forEach(
    function(response) {
      response.evidenceIds =
        Array.isArray(
          response.evidenceIds
        )
          ? response.evidenceIds
          : [];

      if (
        !response ||
        response.inputMethod !==
          ESG_INPUT_METHOD_V1
            .DOCUMENT_EXTRACTION
      ) {
        return;
      }

      var excerpt =
        String(
          response.sourceExcerpt ||
          ""
        ).trim();

      var sourceDocumentId =
        String(
          response.sourceDocumentId ||
          ""
        ).trim();

      if (
        !excerpt ||
        !sourceDocumentId
      ) {
        return;
      }

      var sourceRecord =
        repositorySources[
          sourceDocumentId
        ] ||
        null;

      var sourceMeta =
        documentMetadata[
          sourceDocumentId
        ] ||
        {};

      var factGuardVerified =
        response
          .evidenceMatchedSource ===
        true;

      var validationStatus =
        factGuardVerified &&
        sourceRecord &&
        sourceRecord.persisted ===
          true
          ? ESG_VALIDATION_STATUS_V1
              .INTERNALLY_VERIFIED
          : ESG_VALIDATION_STATUS_V1
              .UNREVIEWED;

      var evidenceId =
        construireEvidenceIdESGV1_(
          response.questionId,
          sourceDocumentId
        );

      if (
        !evidenceIds[
          evidenceId
        ]
      ) {
        evidenceIds[
          evidenceId
        ] = true;

        evidence.push({
          evidenceId:
            evidenceId,

          evidenceType:
            "DOCUMENT_EXCERPT",

          title:
            "Extrait documentaire — " +
            String(
              response.questionId ||
              "Question ESG"
            ),

          source:
            String(
              response.sourceName ||
              sourceMeta.name ||
              "Document source"
            ),

          sourceRef:
            sourceDocumentId,

          dateOrPeriod:
            null,

          /*
           * Référence interne uniquement.
           * Le renderer white-label ne doit pas l'afficher.
           */
          fileId:
            sourceRecord
              ? sourceRecord.fileId
              : null,

          url:
            null,

          validationStatus:
            validationStatus,

          assuranceStatus:
            null,

          rightsStatus:
            "CLIENT_PROVIDED_INTERNAL",

          sourceExcerpt:
            excerpt,

          factGuardVerified:
            factGuardVerified,

          sourcePersisted:
            !!(
              sourceRecord &&
              sourceRecord.persisted ===
                true
            ),

          relatedResponseIds: [
            response.responseId
          ],

          notes:
            validationStatus ===
              ESG_VALIDATION_STATUS_V1
                .INTERNALLY_VERIFIED
              ? "Extrait retrouvé dans le document source et source canonique disponible."
              : "Preuve documentaire non encore vérifiable de bout en bout."
        });
      } else {
        var existing =
          evidence.filter(
            function(item) {
              return (
                item.evidenceId ===
                evidenceId
              );
            }
          )[0];

        if (
          existing &&
          existing
            .relatedResponseIds
            .indexOf(
              response.responseId
            ) === -1
        ) {
          existing
            .relatedResponseIds
            .push(
              response.responseId
            );
        }
      }

      if (
        response.evidenceIds
          .indexOf(
            evidenceId
          ) === -1
      ) {
        response.evidenceIds.push(
          evidenceId
        );
      }

      if (!sourceRecord) {
        warnings.push(
          "Source documentaire non résolue pour " +
          String(
            response.questionId ||
            response.responseId ||
            "réponse"
          ) +
          " (" +
          sourceDocumentId +
          ")."
        );
      }

      if (!factGuardVerified) {
        warnings.push(
          "Fact Guard non confirmé pour " +
          String(
            response.questionId ||
            response.responseId ||
            "réponse"
          ) +
          "."
        );
      }
    }
  );

  model.evidence =
    evidence;

  var coverage =
    calculerCouvertureEvidenceESGV1_(
      responses,
      evidence
    );

  model.scores
    .evidenceCoverageScore =
    coverage.score;

  model.dataQualityProfile
    .evidenceCoverageScore =
    coverage.score;

  model.dataQualityProfile
    .warnings =
    (
      model
        .dataQualityProfile
        .warnings ||
      []
    ).concat(
      warnings
    );

  model.dataQualityProfile
    .evidenceEngineVersion =
    ESG_EVIDENCE_ENGINE_VERSION_V1;

  model.dataQualityProfile
    .limitations =
    (
      model
        .dataQualityProfile
        .limitations ||
      []
    ).filter(
      function(message) {
        return (
          String(
            message || ""
          ).indexOf(
            "Evidence Engine V1 n'a pas été exécuté"
          ) === -1
        );
      }
    );

  return {
    success:
      true,

    model:
      model,

    evidenceCount:
      evidence.length,

    coverage:
      coverage,

    warnings:
      warnings
  };
}


function construireIndexMetadataSourcesEvidenceESG_(
  model
) {
  var result = {};

  (
    model &&
    model.intake &&
    Array.isArray(
      model
        .intake
        .sourceDocuments
    )
      ? model
          .intake
          .sourceDocuments
      : []
  ).forEach(
    function(document) {
      if (
        document &&
        document
          .sourceDocumentId
      ) {
        result[
          document
            .sourceDocumentId
        ] =
          document;
      }
    }
  );

  return result;
}


function construireEvidenceIdESGV1_(
  questionId,
  sourceDocumentId
) {
  function clean_(
    value
  ) {
    return String(
      value ||
      ""
    )
      .toUpperCase()
      .replace(
        /[^A-Z0-9_-]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      );
  }

  return (
    "EV-" +
    clean_(
      questionId ||
      "RESPONSE"
    ) +
    "-" +
    clean_(
      sourceDocumentId ||
      "SOURCE"
    )
  );
}


function calculerCouvertureEvidenceESGV1_(
  responses,
  evidence
) {
  var verifiedEvidenceIds = {};

  (evidence || [])
    .forEach(
      function(item) {
        if (
          item &&
          (
            item
              .validationStatus ===
              ESG_VALIDATION_STATUS_V1
                .INTERNALLY_VERIFIED ||
            item
              .validationStatus ===
              ESG_VALIDATION_STATUS_V1
                .EXTERNALLY_ASSURED
          )
        ) {
          verifiedEvidenceIds[
            item.evidenceId
          ] =
            true;
        }
      }
    );

  var applicable = 0;
  var evidenced = 0;

  (responses || [])
    .forEach(
      function(response) {
        if (
          !response ||
          response
            .applicabilityStatus ===
            ESG_APPLICABILITY_STATUS_V1
              .NOT_APPLICABLE
        ) {
          return;
        }

        applicable++;

        var hasVerifiedEvidence =
          (
            response.evidenceIds ||
            []
          ).some(
            function(
              evidenceId
            ) {
              return !!(
                verifiedEvidenceIds[
                  evidenceId
                ]
              );
            }
          );

        if (
          hasVerifiedEvidence
        ) {
          evidenced++;
        }
      }
    );

  var score =
    applicable > 0
      ? Math.round(
          (
            evidenced /
            applicable *
            100
          ) *
          100
        ) /
        100
      : 0;

  return {
    score:
      score,

    applicableResponses:
      applicable,

    evidencedResponses:
      evidenced
  };
}


/**
 * Test sans Drive : on teste les règles de calcul de couverture.
 */
function TEST_ESG_EVIDENCE_ENGINE_RULES_LOCAL() {
  var responses = [
    {
      applicabilityStatus:
        "APPLICABLE",
      evidenceIds: [
        "EV-1"
      ]
    },
    {
      applicabilityStatus:
        "APPLICABLE",
      evidenceIds: []
    },
    {
      applicabilityStatus:
        "NOT_APPLICABLE",
      evidenceIds: []
    }
  ];

  var evidence = [
    {
      evidenceId:
        "EV-1",
      validationStatus:
        "INTERNALLY_VERIFIED"
    }
  ];

  var result =
    calculerCouvertureEvidenceESGV1_(
      responses,
      evidence
    );

  return {
    success:
      result.score ===
        50 &&
      result.applicableResponses ===
        2 &&
      result.evidencedResponses ===
        1,

    result:
      result
  };
}
