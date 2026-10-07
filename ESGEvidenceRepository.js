/**
 * ============================================================
 * AFRIGREEN24 — ESG EVIDENCE REPOSITORY V1
 * ============================================================
 *
 * Stockage interne des documents sources uploadés.
 * Le rapport client reste white-label : ce repository n'est
 * jamais rendu dans le PDF.
 *
 * Principes :
 * - ID source déterministe basé sur SHA-256 ;
 * - document privé par défaut ;
 * - déduplication par ID + extension ;
 * - aucune URL Drive exposée au navigateur ;
 * - reprise possible à partir du sourceDocumentId.
 */

var ESG_EVIDENCE_REPOSITORY_CONFIG_V1 = {
  version:
    "1.0.0",

  folderName:
    "AfriGreen24 - ESG Source Documents",

  folderProperty:
    "ESG_SOURCE_DOCUMENTS_FOLDER_ID"
};


function persisterDocumentSourceESGV1_(
  blob,
  metadata
) {
  metadata =
    metadata || {};

  if (
    !blob ||
    typeof blob.getBytes !==
      "function"
  ) {
    throw new Error(
      "Blob source ESG invalide."
    );
  }

  var bytes =
    blob.getBytes();

  if (
    !bytes ||
    !bytes.length
  ) {
    throw new Error(
      "Document source ESG vide."
    );
  }

  var sha256 =
    calculerSHA256ESG_(
      bytes
    );

  var sourceDocumentId =
    "SRC-" +
    sha256
      .substring(
        0,
        24
      )
      .toUpperCase();

  var originalName =
    String(
      metadata.originalName ||
      blob.getName() ||
      "document"
    ).trim();

  var extension =
    obtenirExtensionFichierESG_(
      originalName
    );

  var storageName =
    sourceDocumentId +
    (
      extension
        ? "." +
          extension
        : ""
    );

  var folder =
    obtenirOuCreerDossierSourcesESGV1_();

  var existing =
    folder.getFilesByName(
      storageName
    );

  var file;
  var reused =
    false;

  if (
    existing.hasNext()
  ) {
    file =
      existing.next();

    reused =
      true;
  } else {
    file =
      folder.createFile(
        blob.copyBlob()
      );

    file.setName(
      storageName
    );

    var description = {
      sourceDocumentId:
        sourceDocumentId,

      originalName:
        originalName,

      mimeType:
        String(
          metadata.mimeType ||
          blob.getContentType() ||
          ""
        ),

      sha256:
        sha256,

      createdAt:
        new Date()
          .toISOString()
    };

    try {
      file.setDescription(
        JSON.stringify(
          description
        )
      );
    } catch (_) {}
  }

  return {
    sourceDocumentId:
      sourceDocumentId,

    originalName:
      originalName,

    storageName:
      storageName,

    mimeType:
      String(
        metadata.mimeType ||
        blob.getContentType() ||
        ""
      ),

    sizeBytes:
      bytes.length,

    sha256:
      sha256,

    persisted:
      true,

    reused:
      reused,

    persistedAt:
      new Date()
        .toISOString()
  };
}


function obtenirOuCreerDossierSourcesESGV1_() {
  var properties =
    PropertiesService
      .getScriptProperties();

  var folderId =
    String(
      properties.getProperty(
        ESG_EVIDENCE_REPOSITORY_CONFIG_V1
          .folderProperty
      ) ||
      ""
    ).trim();

  if (folderId) {
    try {
      return DriveApp
        .getFolderById(
          folderId
        );
    } catch (
      invalidFolder
    ) {
      console.warn(
        "Dossier sources ESG configuré inaccessible ; recréation."
      );
    }
  }

  var folders =
    DriveApp
      .getFoldersByName(
        ESG_EVIDENCE_REPOSITORY_CONFIG_V1
          .folderName
      );

  var folder =
    folders.hasNext()
      ? folders.next()
      : DriveApp
          .createFolder(
            ESG_EVIDENCE_REPOSITORY_CONFIG_V1
              .folderName
          );

  properties.setProperty(
    ESG_EVIDENCE_REPOSITORY_CONFIG_V1
      .folderProperty,
    folder.getId()
  );

  return folder;
}


function resoudreDocumentSourceESGV1_(
  sourceDocumentId
) {
  sourceDocumentId =
    String(
      sourceDocumentId ||
      ""
    ).trim();

  if (!sourceDocumentId) {
    return null;
  }

  var folder;

  try {
    folder =
      obtenirOuCreerDossierSourcesESGV1_();
  } catch (_) {
    return null;
  }

  var files =
    folder.getFiles();

  while (
    files.hasNext()
  ) {
    var file =
      files.next();

    var name =
      String(
        file.getName() ||
        ""
      );

    if (
      name.indexOf(
        sourceDocumentId
      ) === 0
    ) {
      return {
        sourceDocumentId:
          sourceDocumentId,

        fileId:
          file.getId(),

        name:
          name,

        mimeType:
          file.getMimeType(),

        sizeBytes:
          file.getSize(),

        persisted:
          true
      };
    }
  }

  return null;
}


function calculerSHA256ESG_(
  bytes
) {
  var digest =
    Utilities
      .computeDigest(
        Utilities
          .DigestAlgorithm
          .SHA_256,
        bytes
      );

  return digest
    .map(
      function(byte) {
        var value =
          byte < 0
            ? byte + 256
            : byte;

        return (
          "0" +
          value.toString(
            16
          )
        ).slice(
          -2
        );
      }
    )
    .join("");
}


function obtenirExtensionFichierESG_(
  fileName
) {
  var match =
    String(
      fileName ||
      ""
    ).match(
      /.([A-Za-z0-9]{1,10})$/
    );

  return match
    ? match[1]
        .toLowerCase()
    : "";
}


function TEST_ESG_EVIDENCE_REPOSITORY_HASH_LOCAL() {
  var bytes =
    Utilities
      .newBlob(
        "ESG_SOURCE_TEST",
        "text/plain",
        "source-test.txt"
      )
      .getBytes();

  var hashA =
    calculerSHA256ESG_(
      bytes
    );

  var hashB =
    calculerSHA256ESG_(
      bytes
    );

  return {
    success:
      hashA ===
        hashB &&
      hashA.length ===
        64 &&
      obtenirExtensionFichierESG_(
        "rapport.ESG.PDF"
      ) ===
        "pdf",

    hash:
      hashA
  };
}
