/**
 * ============================================================
 * AFRIGREEN24 — ESG INTAKE & PROVENANCE V1
 * ============================================================
 *
 * Une seule destination canonique pour deux portes d'entrée :
 * - MANUAL
 * - DOCUMENT_IMPORT
 *
 * Le scoring ignore ces métadonnées.
 * Elles servent à la traçabilité, aux preuves et au futur
 * ESG_REPORT_SCHEMA_V1.
 */

var ESG_INPUT_METHOD_V1 = {
  MANUAL: "MANUAL",
  DOCUMENT_EXTRACTION:
    "DOCUMENT_EXTRACTION"
};


function normaliserContexteIntakeESG_(
  intake
) {
  intake = intake || {};

  var mode =
    String(
      intake.entryMode || "manual"
    ).toLowerCase();

  var entryMode =
    mode === "import"
      ? "DOCUMENT_IMPORT"
      : "MANUAL";

  return {
    entryMode:
      entryMode,

    capturedAt:
      String(
        intake.capturedAt ||
        new Date()
          .toISOString()
      ),

    sourceDocuments:
      normaliserDocumentsSourceESG_(
        intake.sourceDocuments ||
        []
      ),

    profileProvenance:
      intake.profileProvenance &&
      typeof intake.profileProvenance ===
        "object"
        ? intake.profileProvenance
        : {},

    questionProvenance:
      intake.questionProvenance &&
      typeof intake.questionProvenance ===
        "object"
        ? intake.questionProvenance
        : {}
  };
}


function normaliserDocumentsSourceESG_(
  documents
) {
  var seen = {};

  return (documents || [])
    .map(
      function(document, index) {
        document =
          document || {};

        var id =
          String(
            document.sourceDocumentId ||
            document.documentId ||
            ""
          ).trim();

        if (!id) {
          id =
            "SOURCE-DOC-" +
            (index + 1);
        }

        return {
          sourceDocumentId:
            id,

          name:
            String(
              document.name ||
              document.sourceName ||
              ""
            ),

          mimeType:
            String(
              document.mimeType ||
              ""
            ),

          sizeBytes:
            valeurNombreIntakeOuNullESG_(
              document.sizeBytes ||
              document.size
            ),

          extractionMethod:
            String(
              document.extractionMethod ||
              ""
            ),

          aiProvider:
            String(
              document.aiProvider ||
              document.providerUsed ||
              ""
            ),

          aiFallbackUsed:
            document.aiFallbackUsed ===
              true ||
            document.fallbackUsed ===
              true,

          importedAt:
            String(
              document.importedAt ||
              ""
            ),

          persisted:
            document.persisted ===
              true,

          reused:
            document.reused ===
              true,

          sha256:
            String(
              document.sha256 ||
              ""
            )
        };
      }
    )
    .filter(
      function(document) {
        if (
          seen[
            document.sourceDocumentId
          ]
        ) {
          return false;
        }

        seen[
          document.sourceDocumentId
        ] = true;

        return true;
      }
    );
}


function construireProvenanceReponseESGV1_(
  questionId,
  rawResponse,
  intake
) {
  rawResponse =
    rawResponse || {};

  intake =
    normaliserContexteIntakeESG_(
      intake
    );

  var supplied =
    intake.questionProvenance[
      questionId
    ] || {};

  var inputMethod =
    String(
      rawResponse.inputMethod ||
      supplied.inputMethod ||
      ""
    ).toUpperCase();

  if (
    inputMethod !==
    ESG_INPUT_METHOD_V1
      .DOCUMENT_EXTRACTION
  ) {
    inputMethod =
      ESG_INPUT_METHOD_V1
        .MANUAL;
  }

  return {
    inputMethod:
      inputMethod,

    extractionStatus:
      String(
        rawResponse.extractionStatus ||
        supplied.extractionStatus ||
        ""
      ).toUpperCase(),

    sourceDocumentId:
      String(
        rawResponse.sourceDocumentId ||
        supplied.sourceDocumentId ||
        ""
      ),

    sourceName:
      String(
        rawResponse.sourceName ||
        supplied.sourceName ||
        ""
      ),

    sourceExcerpt:
      String(
        rawResponse.sourceExcerpt ||
        supplied.sourceExcerpt ||
        rawResponse.evidence ||
        supplied.evidence ||
        ""
      ),

    extractionConfidence:
      valeurNombreIntakeOuNullESG_(
        rawResponse.extractionConfidence !==
          undefined
          ? rawResponse.extractionConfidence
          : supplied.confidence
      ),

    evidenceMatchedSource:
      rawResponse.evidenceMatchedSource ===
        true ||
      supplied.evidenceMatchedSource ===
        true,

    userConfirmed:
      rawResponse.userConfirmed ===
        true ||
      supplied.userConfirmed ===
        true ||
      inputMethod ===
        ESG_INPUT_METHOD_V1.MANUAL
  };
}


function construireProvenanceProfilESGV1_(
  fieldId,
  intake
) {
  intake =
    normaliserContexteIntakeESG_(
      intake
    );

  var supplied =
    intake.profileProvenance[
      fieldId
    ] || {};

  var inputMethod =
    String(
      supplied.inputMethod ||
      ""
    ).toUpperCase();

  if (
    inputMethod !==
    ESG_INPUT_METHOD_V1
      .DOCUMENT_EXTRACTION
  ) {
    inputMethod =
      ESG_INPUT_METHOD_V1
        .MANUAL;
  }

  return {
    inputMethod:
      inputMethod,

    extractionStatus:
      String(
        supplied.extractionStatus ||
        ""
      ).toUpperCase(),

    sourceDocumentId:
      String(
        supplied.sourceDocumentId ||
        ""
      ),

    sourceName:
      String(
        supplied.sourceName ||
        ""
      ),

    sourceExcerpt:
      String(
        supplied.sourceExcerpt ||
        supplied.evidence ||
        ""
      ),

    extractionConfidence:
      valeurNombreIntakeOuNullESG_(
        supplied.confidence
      ),

    evidenceMatchedSource:
      supplied.evidenceMatchedSource ===
        true,

    userConfirmed:
      supplied.userConfirmed ===
        true ||
      inputMethod ===
        ESG_INPUT_METHOD_V1.MANUAL
  };
}


function valeurNombreIntakeOuNullESG_(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  var number =
    Number(value);

  return isFinite(number)
    ? number
    : null;
}


function TEST_ESG_INTAKE_PROVENANCE_V1_LOCAL() {
  var manual =
    construireProvenanceReponseESGV1_(
      "E-POL-001",
      {
        value: 3
      },
      {
        entryMode:
          "manual"
      }
    );

  var imported =
    construireProvenanceReponseESGV1_(
      "E-POL-001",
      {
        inputMethod:
          "DOCUMENT_EXTRACTION",
        sourceDocumentId:
          "DOC-001",
        extractionStatus:
          "FOUND",
        extractionConfidence:
          0.94
      },
      {
        entryMode:
          "import"
      }
    );

  return {
    success:
      manual.inputMethod ===
        "MANUAL" &&
      manual.userConfirmed ===
        true &&
      imported.inputMethod ===
        "DOCUMENT_EXTRACTION" &&
      imported.sourceDocumentId ===
        "DOC-001"
  };
}
