/**
 * ============================================================
 * AFRIGREEN24 — IMPORT DOCUMENTAIRE ESG VIA HUMBLEOS
 * Fichier : ESGImportHumbleOS.gs
 * ============================================================
 *
 * Pipeline :
 *
 * document client
 *      ↓
 * extraction texte
 *      ↓
 * détection du type de document
 *      ├─ NARRATIVE_ESG
 *      └─ STRUCTURED_ESG_REPORT
 *      ↓
 * construction des 65 fieldDefinitions
 *      ↓
 * extraction déterministe des rapports AfriGreen24 structurés
 *      ↓
 * OpenAI Responses API (PRIMARY)
 *      ↓
 * HumbleOS /extract-esg (FALLBACK uniquement)
 *      ↓
 * Fact Guard
 *      ↓
 * normalisation canonique
 *      ↓
 * FOUND / TO_CONFIRM / MISSING
 *      ↓
 * Script.html
 *
 * IMPORTANT :
 * - aucun scoring ESG ici ;
 * - aucune recommandation ;
 * - aucune génération de rapport ;
 * - aucune invention d'information ;
 * - ESGQuestions.gs reste la source métier ;
 * - ESGImportSchema.gs reste le contrat canonique.
 */


var ESG_IMPORT_FOUND_THRESHOLD = 0.82;

var ESG_IMPORT_MAX_BYTES =
  8 * 1024 * 1024;


/**
 * ============================================================
 * POINT D'ENTRÉE APPELÉ PAR Script.html
 * ============================================================
 */
function analyserFichierESGImporte(payload) {
  var fichierTemporaireId = null;

  try {
    if (!payload) {
      throw new Error(
        "Payload d’import ESG absent."
      );
    }


    /*
     * ----------------------------------------------------------
     * 1. CONSTRUCTION DU BLOB
     * ----------------------------------------------------------
     */
    var blob =
      construireBlobImportESG_(
        payload
      );


    /*
     * ----------------------------------------------------------
     * 2. EXTRACTION DU TEXTE
     * ----------------------------------------------------------
     */
    var extraction =
      extraireTexteImportESG_(
        blob
      );

    fichierTemporaireId =
      extraction.tempFileId ||
      null;


    var sourceText =
      nettoyerTexteImportESG_(
        extraction.text
      );


    if (!sourceText) {
      throw new Error(
        "Aucun texte exploitable n’a pu être extrait du document."
      );
    }


    /*
     * ----------------------------------------------------------
     * 3. DÉTECTION DU TYPE DE DOCUMENT
     * ----------------------------------------------------------
     *
     * NARRATIVE_ESG :
     * politiques, procédures, rapports narratifs, registres...
     *
     * STRUCTURED_ESG_REPORT :
     * rapport ESG déjà évalué avec scores, niveaux de preuve,
     * maturité, résultats détaillés, etc.
     */
    var documentMode =
      detecterModeDocumentImportESG_(
        sourceText
      );


    Logger.log(
      "ESG IMPORT — documentMode=" +
      documentMode
    );


    /*
     * ----------------------------------------------------------
     * 4. CONSTRUCTION DES FIELD DEFINITIONS
     * ----------------------------------------------------------
     *
     * 15 champs profil
     * +
     * 50 questions ESG
     * =
     * 65 définitions
     */
    var definitions =
      construireDefinitionsChampsESG_();


    /*
     * ----------------------------------------------------------
     * 5. EXTRACTION DÉTERMINISTE DES RAPPORTS AFRIGREEN24
     * ----------------------------------------------------------
     *
     * Un rapport ESG AfriGreen24 structuré contient déjà, dans
     * l'annexe technique, les 50 lignes numérotées avec un score
     * sur 100. Ce format ne doit pas repasser par une interprétation
     * probabiliste pour retrouver des réponses que notre propre
     * moteur a déjà calculées.
     *
     * Règle canonique :
     * 0/20/40/60/80/100 -> 0/1/2/3/4/5.
     *
     * Les valeurs déterministes gagnent sur l'extraction IA.
     * L'IA reste utile pour les documents narratifs et les champs
     * profil qui ne sont pas explicitement structurés.
     */
    var structuredDeterministic =
      extraireQuestionsRapportAfriGreen24Deterministe_(
        sourceText,
        documentMode
      );

    /*
     * FALLBACK PAR CHAMP, PAS PAR FORMAT.
     *
     * Une détection de section structurée ne suffit PAS à supprimer les
     * 50 questions de l'IA. La conversion PDF -> Google Docs peut rendre
     * certaines lignes illisibles par le parser déterministe.
     *
     * Seuls les chemins réellement extraits et validés de manière
     * déterministe sont retirés du contrat IA. Les autres restent
     * disponibles pour le fallback OpenAI/HumbleOS.
     */
    var definitionsForAI =
      construireDefinitionsIAImportESG_(
        definitions,
        structuredDeterministic.fields
      );

    console.log(
      JSON.stringify({
        event:
          "esg_import_field_fallback_plan",

        structuredFormatDetected:
          structuredDeterministic.detected ===
          true,

        deterministicQuestionCount:
          structuredDeterministic.questionCount,

        definitionsTotal:
          definitions.length,

        definitionsForAI:
          definitionsForAI.length,

        questionDefinitionsForAI:
          definitionsForAI.filter(
            function(definition) {
              return (
                String(
                  definition.path || ""
                ).indexOf(
                  "question."
                ) === 0
              );
            }
          ).length
      })
    );

    /*
     * ----------------------------------------------------------
     * 5B. AI GATEWAY
     * ----------------------------------------------------------
     *
     * OpenAI reste le provider principal pour les champs non déterministes.
     * HumbleOS n'est appelé qu'en fallback.
     */
    var aiExtraction =
      extraireChampsESGAvecAIGateway_(
        sourceText,
        definitionsForAI,
        documentMode
      );


    var fields =
      aiExtraction.fields;

    fields =
      fusionnerExtractionDeterministeImportESG_(
        fields,
        structuredDeterministic.fields
      );


    /*
     * ----------------------------------------------------------
     * 6. FACT GUARD + NORMALISATION + STATUTS
     * ----------------------------------------------------------
     */
    var resultat =
      construireResultatImportESG_(
        fields,
        sourceText,
        payload.fileName ||
          "Document ESG"
      );

    resultat.structuredDeterministicExtraction = {
      detected:
        structuredDeterministic.detected ===
        true,

      questionCount:
        structuredDeterministic.questionCount,

      missingQuestionNumbers:
        structuredDeterministic
          .missingQuestionNumbers,

      duplicateQuestionNumbers:
        structuredDeterministic
          .duplicateQuestionNumbers,

      invalidScores:
        structuredDeterministic
          .invalidScores,

      sourceSectionDetected:
        structuredDeterministic
          .sourceSectionDetected
    };


    resultat.success =
      true;

    resultat.documentMode =
      documentMode;

    resultat.extractionMethod =
      extraction.method || "";


    /*
     * ----------------------------------------------------------
     * 7. PROVENANCE DOCUMENTAIRE
     * ----------------------------------------------------------
     *
     * Le fichier sert au préremplissage ET pourra devenir
     * une source de preuve canonique.
     */
    var sourcePersistence;

    try {
      sourcePersistence =
        persisterDocumentSourceESGV1_(
          blob,
          {
            originalName:
              payload.fileName ||
              "Document ESG",

            mimeType:
              payload.mimeType ||
              blob.getContentType() ||
              ""
          }
        );

    } catch (
      persistenceError
    ) {
      console.error(
        "Persistance source ESG impossible : " +
        (
          persistenceError &&
          persistenceError.message
            ? persistenceError.message
            : persistenceError
        )
      );

      sourcePersistence = {
        sourceDocumentId:
          "EPHEMERAL-" +
          Utilities.getUuid(),

        originalName:
          String(
            payload.fileName ||
            "Document ESG"
          ),

        mimeType:
          String(
            payload.mimeType ||
            blob.getContentType() ||
            ""
          ),

        sizeBytes:
          Number(
            payload.fileSize ||
            blob.getBytes().length ||
            0
          ) || null,

        sha256:
          "",

        persisted:
          false,

        reused:
          false,

        persistedAt:
          null
      };
    }


    resultat.sourceDocument = {
      sourceDocumentId:
        sourcePersistence
          .sourceDocumentId,

      name:
        sourcePersistence
          .originalName,

      mimeType:
        sourcePersistence
          .mimeType,

      sizeBytes:
        sourcePersistence
          .sizeBytes,

      sha256:
        sourcePersistence
          .sha256 ||
        "",

      persisted:
        sourcePersistence
          .persisted ===
        true,

      reused:
        sourcePersistence
          .reused ===
        true,

      persistedAt:
        sourcePersistence
          .persistedAt ||
        null,

      extractionMethod:
        extraction.method ||
        "",

      aiProvider:
        aiExtraction.providerUsed ||
        "",

      aiFallbackUsed:
        aiExtraction.fallbackUsed ===
        true,

      importedAt:
        new Date()
          .toISOString()
    };


    resultat.aiProvider =
      aiExtraction.providerUsed ||
      "";

    resultat.aiFallbackUsed =
      aiExtraction.fallbackUsed ===
      true;

    resultat.aiAttempts =
      aiExtraction.attempts ||
      [];


    ajouterProvenanceResultatImportESG_(
      resultat,
      resultat.sourceDocument
    );


    return resultat;

  } catch (e) {

    console.error(
      "Import ESG échoué : " +
      (
        e && e.stack
          ? e.stack
          : e
      )
    );


    return {
      success: false,

      sourceName:
        payload &&
        payload.fileName
          ? payload.fileName
          : "",

      profile: {},

      questions: {},

      analysis: {
        found: 0,
        toConfirm: 0,
        missing: 0
      },

      error:
        e && e.message
          ? e.message
          : String(e)
    };

  } finally {

    /*
     * Nettoyage du Google Doc temporaire créé
     * lors de la conversion PDF / DOC / DOCX.
     */
    if (fichierTemporaireId) {
      try {

        DriveApp
          .getFileById(
            fichierTemporaireId
          )
          .setTrashed(
            true
          );

      } catch (
        cleanupError
      ) {

        console.warn(
          "Nettoyage fichier ESG temporaire impossible : " +
          cleanupError
        );
      }
    }
  }
}


/**
 * ============================================================
 * CONSTRUCTION DU BLOB
 * ============================================================
 */
function construireBlobImportESG_(payload) {
  var fileName =
    String(
      payload.fileName || ""
    ).trim();


  var mimeType =
    String(
      payload.mimeType ||
      "application/octet-stream"
    ).trim();


  var base64 =
    String(
      payload.base64 || ""
    );


  if (!fileName) {
    throw new Error(
      "Nom du fichier ESG manquant."
    );
  }


  if (!base64) {
    throw new Error(
      "Contenu du fichier ESG manquant."
    );
  }


  /*
   * Tolère :
   *
   * data:application/pdf;base64,XXXX
   *
   * ou directement :
   *
   * XXXX
   */
  var virgule =
    base64.indexOf(",");


  if (
    base64.indexOf(
      "base64,"
    ) !== -1 &&
    virgule !== -1
  ) {
    base64 =
      base64.substring(
        virgule + 1
      );
  }


  var bytes =
    Utilities.base64Decode(
      base64
    );


  if (
    bytes.length >
    ESG_IMPORT_MAX_BYTES
  ) {
    throw new Error(
      "Le fichier ESG dépasse la limite de 8 Mo."
    );
  }


  return Utilities.newBlob(
    bytes,
    mimeType,
    fileName
  );
}


/**
 * ============================================================
 * EXTRACTION TEXTE
 * ============================================================
 *
 * TXT :
 * lecture directe.
 *
 * PDF / DOC / DOCX :
 * conversion temporaire vers Google Docs.
 *
 * Le service avancé Google Drive doit être activé.
 */
function extraireTexteImportESG_(blob) {
  var mime =
    String(
      blob.getContentType() || ""
    ).toLowerCase();


  var nom =
    String(
      blob.getName() || ""
    ).toLowerCase();


  /*
   * ----------------------------------------------------------
   * TXT
   * ----------------------------------------------------------
   */
  if (
    mime === "text/plain" ||
    /\.txt$/i.test(nom)
  ) {
    return {
      text:
        blob.getDataAsString(
          "UTF-8"
        ),

      method:
        "PLAIN_TEXT",

      tempFileId:
        null
    };
  }


  /*
   * ----------------------------------------------------------
   * FORMATS AUTORISÉS
   * ----------------------------------------------------------
   */
  var autorise =
    mime ===
      "application/pdf" ||

    mime ===
      "application/msword" ||

    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||

    /\.pdf$/i.test(nom) ||

    /\.doc$/i.test(nom) ||

    /\.docx$/i.test(nom);


  if (!autorise) {
    throw new Error(
      "Format ESG non supporté. Utilisez PDF, DOC, DOCX ou TXT."
    );
  }


  /*
   * ----------------------------------------------------------
   * CONVERSION GOOGLE DOCS
   * ----------------------------------------------------------
   */
  var metadata = {
    name:
      "TEMP_ESG_" +
      new Date().getTime() +
      "_" +
      blob.getName(),

    mimeType:
      MimeType.GOOGLE_DOCS
  };


  var fichierGoogle;


  try {

    fichierGoogle =
      Drive.Files.create(
        metadata,
        blob,
        {
          fields:
            "id,name"
        }
      );

  } catch (e) {

    throw new Error(
      "Impossible de convertir le document ESG en Google Docs : " +
      (
        e.message || e
      )
    );
  }


  if (
    !fichierGoogle ||
    !fichierGoogle.id
  ) {
    throw new Error(
      "Conversion Google Docs ESG invalide."
    );
  }


  var doc;


  try {

    doc =
      DocumentApp.openById(
        fichierGoogle.id
      );

  } catch (e2) {

    try {

      DriveApp
        .getFileById(
          fichierGoogle.id
        )
        .setTrashed(
          true
        );

    } catch (_) {}


    throw new Error(
      "Impossible d’ouvrir le document ESG converti : " +
      (
        e2.message || e2
      )
    );
  }


  return {
    text:
      doc
        .getBody()
        .getText(),

    method:
      "GOOGLE_DOCS_CONVERSION",

    tempFileId:
      fichierGoogle.id
  };
}


/**
 * ============================================================
 * NETTOYAGE DU TEXTE
 * ============================================================
 */
function nettoyerTexteImportESG_(texte) {
  return String(
    texte || ""
  )
    .replace(
      /\u0000/g,
      ""
    )
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .replace(
      /\n{4,}/g,
      "\n\n\n"
    )
    .trim();
}


/**
 * ============================================================
 * DÉTECTION DU TYPE DE DOCUMENT ESG
 * ============================================================
 *
 * Cette fonction NE FAIT AUCUN appel IA.
 *
 * Elle distingue :
 *
 * NARRATIVE_ESG
 *
 * d'un :
 *
 * STRUCTURED_ESG_REPORT
 */
function detecterModeDocumentImportESG_(
  sourceText
) {
  var texte =
    String(
      sourceText || ""
    ).toLowerCase();


  if (!texte) {
    return "NARRATIVE_ESG";
  }


  var marqueurs = [
    "/100",
    "preuve forte",
    "preuve moyenne",
    "preuve faible",
    "niveau de preuve",
    "score esg",
    "score global",
    "maturité esg",
    "diagnostic esg",
    "en structuration",
    "faiblesse critique",
    "faiblesse prioritaire",
    "résultats détaillés",
    "questionnaire détaillé"
  ];


  var score = 0;


  marqueurs.forEach(
    function(marqueur) {

      if (
        texte.indexOf(
          marqueur
        ) !== -1
      ) {
        score++;
      }

    }
  );


  /*
   * 3 marqueurs ESG structurés suffisent.
   */
  return score >= 3
    ? "STRUCTURED_ESG_REPORT"
    : "NARRATIVE_ESG";
}


/**
 * ============================================================
 * FIELD DEFINITIONS HUMBLEOS
 * ============================================================
 *
 * Source canonique :
 *
 * ESGImportSchema.gs
 */
function construireDefinitionsChampsESG_() {
  var definitions = [];


  /*
   * ==========================================================
   * 1. PROFIL
   * ==========================================================
   */
  var schemaProfil =
    obtenirSchemaImportProfilESG_();


  schemaProfil.forEach(
    function(field) {

      var definition = {
        path:
          "profile." +
          field.fieldId,

        label:
          field.label,

        type:
          convertirTypeChampImportESG_(
            field.type
          )
      };


      if (
        field.canonicalValues &&
        field.canonicalValues.length
      ) {

        definition.options =
          field.canonicalValues.map(
            function(value) {

              return {
                value:
                  String(value),

                label:
                  String(value)
              };

            }
          );
      }


      definitions.push(
        definition
      );
    }
  );


  /*
   * ==========================================================
   * 2. QUESTIONS ESG
   * ==========================================================
   */
  var schemaQuestions =
    obtenirSchemaImportESG_();


  schemaQuestions.forEach(
    function(question) {

      var contexte = [];


      /*
       * Question officielle.
       */
      contexte.push(
        question.question
      );


      if (question.pillar) {
        contexte.push(
          "Pilier ESG : " +
          question.pillar
        );
      }


      if (question.theme) {
        contexte.push(
          "Thème : " +
          question.theme
        );
      }


      if (question.subtheme) {
        contexte.push(
          "Sous-thème : " +
          question.subtheme
        );
      }


      if (
        question.evidenceExamples &&
        question.evidenceExamples.length
      ) {

        contexte.push(
          "Exemples de preuves documentaires pertinentes : " +
          question.evidenceExamples.join(
            "; "
          )
        );
      }


      if (question.standard) {
        contexte.push(
          "Référence principale : " +
          question.standard
        );
      }


      if (
        question.indicator !== null &&
        question.indicator !== undefined &&
        question.indicator !== ""
      ) {

        contexte.push(
          "Indicateur associé : " +
          (
            typeof question.indicator ===
            "string"
              ? question.indicator
              : JSON.stringify(
                  question.indicator
                )
          )
        );
      }


      /*
       * Règles documentaires de maturité.
       *
       * Ce n'est PAS le scoring ESG final.
       */
      contexte.push(
        [
          "Valeurs documentaires autorisées :",


          "0 = le document démontre explicitement que le dispositif ou la pratique est inexistant(e).",


          "1 = le document démontre une pratique existante mais informelle, ponctuelle ou non documentée.",


          "2 = le document démontre que des premières initiatives ou actions sont engagées, sans dispositif pleinement formalisé.",


          "3 = le document démontre un dispositif formalisé, défini, documenté ou officiellement adopté.",


          "4 = le document démontre que le dispositif est mesuré, suivi régulièrement, piloté ou fait l'objet d'indicateurs.",


          "5 = le document démontre un dispositif mature avec suivi structuré et amélioration continue explicitement établie.",


          "NA = le document indique explicitement que la question n'est pas applicable.",


          "UNK = le document indique explicitement que l'information est inconnue ou indisponible.",


          "WIP = le document indique explicitement que le dispositif est en cours de mise en place ou de formalisation.",


          "Ne déduis jamais un niveau supérieur à ce que la preuve textuelle démontre.",


          "Si aucune preuve suffisante ne permet d'attribuer une valeur, retourne une valeur vide."
        ].join(" ")
      );


      definitions.push({
        path:
          "question." +
          question.questionId,

        label:
          contexte.join(
            "\n"
          ),

        type:
          "select",

        options: [
          {
            value: "0",
            label: "Inexistant"
          },

          {
            value: "1",
            label: "Informel"
          },

          {
            value: "2",
            label: "Initié"
          },

          {
            value: "3",
            label: "Défini"
          },

          {
            value: "4",
            label:
              "Mesuré et piloté"
          },

          {
            value: "5",
            label:
              "Mature et amélioré"
          },

          {
            value: "NA",
            label:
              "Non applicable"
          },

          {
            value: "UNK",
            label:
              "Information inconnue"
          },

          {
            value: "WIP",
            label:
              "En cours de mise en place"
          }
        ]
      });

    }
  );


  /*
   * ==========================================================
   * CONTRÔLES STRUCTURELS
   * ==========================================================
   */
  if (
    schemaProfil.length !== 15
  ) {
    throw new Error(
      "Schéma profil ESG inattendu : " +
      schemaProfil.length +
      " champs au lieu de 15."
    );
  }


  if (
    schemaQuestions.length !== 50
  ) {
    throw new Error(
      "Schéma questions ESG inattendu : " +
      schemaQuestions.length +
      " questions au lieu de 50."
    );
  }


  if (
    definitions.length !== 65
  ) {
    throw new Error(
      "FieldDefinitions ESG invalides : " +
      definitions.length +
      " définitions au lieu de 65."
    );
  }


  return definitions;
}


/**
 * ============================================================
 * TYPES PROFIL -> TYPES HUMBLEOS
 * ============================================================
 */
function convertirTypeChampImportESG_(
  type
) {
  type =
    String(
      type || ""
    ).toLowerCase();


  if (type === "number") {
    return "number";
  }


  if (type === "select") {
    return "select";
  }


  if (
    type === "multiselect"
  ) {
    return "multiselect";
  }


  /*
   * email, tel, country, textarea...
   *
   * Pour l'extraction HumbleOS :
   * texte.
   */
  return "text";
}


/**
 * ============================================================
 * EXTRACTION DÉTERMINISTE — RAPPORT AFRIGREEN24 STRUCTURÉ
 * ============================================================
 *
 * Cas couvert :
 * rapport Google Docs/PDF produit par le moteur investisseur,
 * contenant "Annexe B. Diagnostic technique détaillé" et les
 * lignes numérotées 1..50 avec Score / Preuve / Statut.
 *
 * Aucun appel IA.
 * Aucun recalcul ESG.
 * Le score affiché est uniquement retransformé vers la réponse
 * canonique ayant servi au scoring :
 *
 * 0 -> 0
 * 20 -> 1
 * 40 -> 2
 * 60 -> 3
 * 80 -> 4
 * 100 -> 5
 */
function extraireQuestionsRapportAfriGreen24Deterministe_(
  sourceText,
  documentMode
) {
  var resultat = {
    detected:
      false,

    questionCount:
      0,

    missingQuestionNumbers:
      [],

    duplicateQuestionNumbers:
      [],

    invalidScores:
      [],

    sourceSectionDetected:
      false,

    fields:
      {}
  };

  if (
    String(
      documentMode || ""
    ) !==
    "STRUCTURED_ESG_REPORT"
  ) {
    return resultat;
  }

  var source =
    String(
      sourceText || ""
    );

  var normalized =
    normaliserTexteComparaisonESG_(
      source
    );

  var requiredMarkers = [
    "annexe b diagnostic technique detaille",
    "theme sous theme",
    "score preuve statut",
    "preparation esg"
  ];

  var isOwnStructuredReport =
    requiredMarkers.every(
      function(markerText) {
        return (
          normalized.indexOf(
            markerText
          ) !==
          -1
        );
      }
    );

  if (!isOwnStructuredReport) {
    return resultat;
  }

  /*
   * Le sommaire contient lui aussi « Annexe B ». La conversion PDF ->
   * Google Docs peut en outre couper le titre sur plusieurs lignes. On
   * prend donc la dernière vraie occurrence avec une regex tolérante.
   */
  var annexStart = trouverDerniereOccurrenceRegexESG_(
    source,
    /annexe\s+b\s*[.:\-–—]?\s*diagnostic\s+technique\s+d(?:é|e)taillé/gi
  );

  if (annexStart < 0) {
    annexStart = trouverDerniereOccurrenceRegexESG_(
      source,
      /annexe\s+b\s*[.:\-–—]?\s*diagnostic\s+technique\s+detaille/gi
    );
  }

  if (annexStart < 0) {
    return resultat;
  }

  resultat.sourceSectionDetected = true;

  var annexEndRegex = /annexe\s+c\s*[.:\-–—]?/gi;
  annexEndRegex.lastIndex = annexStart + 1;
  var annexEndMatch = annexEndRegex.exec(source);
  var annexEnd = annexEndMatch ? annexEndMatch.index : source.length;
  var annex = source.substring(annexStart, annexEnd);

  /* Métadonnées de validation indépendantes du mapping des questions. */
  var seenQuestionNumbers = {};
  annex.split(/\n/).forEach(function(line) {
    var lineMatch = /^\s*(\d{1,2})(?:\s+|$)([\s\S]*)$/.exec(line);
    if (!lineMatch) {
      return;
    }
    var lineNumber = Number(lineMatch[1]);
    var lineRemainder = String(lineMatch[2] || "");
    if (lineNumber < 1 || lineNumber > 50 || /^\s*\/\s*100\b/.test(lineRemainder)) {
      return;
    }
    seenQuestionNumbers[lineNumber] = (seenQuestionNumbers[lineNumber] || 0) + 1;
  });

  Object.keys(seenQuestionNumbers).forEach(function(numberKey) {
    if (seenQuestionNumbers[numberKey] > 1) {
      resultat.duplicateQuestionNumbers.push(Number(numberKey));
    }
  });

  var questions =
    obtenirQuestionsESG();

  questions.forEach(
    function(question) {
      var numero =
        Number(
          question.number || 0
        );

      if (
        !numero ||
        numero < 1 ||
        numero > 50
      ) {
        return;
      }

      var rowRegex =
        new RegExp(
          "(?:^|\\n)\\s*" +
          numero +
          "(?!\\s*\\/\\s*100)(?:\\s+|$)([\\s\\S]*?)(?=(?:\\n\\s*" +
          (
            numero < 50
              ? numero + 1
              : "51"
          ) +
          "(?!\\s*\\/\\s*100)(?:\\s+|$))|$)",
          ""
        );

      var rowMatch =
        annex.match(
          rowRegex
        );

      if (!rowMatch) {
        resultat
          .missingQuestionNumbers
          .push(
            numero
          );
        return;
      }

      var rowText =
        String(
          rowMatch[0] || ""
        ).trim();

      var scoreMatch =
        rowText.match(
          /(?:^|\s)(100|80|60|40|20|0)\s*\/\s*100(?:\s|$)/
        );

      if (!scoreMatch) {
        var anyScoreMatch = rowText.match(
          /(?:^|\s)(\d+(?:[.,]\d+)?)\s*\/\s*100(?:\s|$)/
        );
        if (anyScoreMatch) {
          var parsedScore = Number(String(anyScoreMatch[1]).replace(",", "."));
          if ([0, 20, 40, 60, 80, 100].indexOf(parsedScore) === -1) {
            resultat.invalidScores.push({
              questionNumber: numero,
              score: anyScoreMatch[1]
            });
          }
        }
        resultat
          .missingQuestionNumbers
          .push(
            numero
          );
        return;
      }

      var score =
        Number(
          scoreMatch[1]
        );

      var canonicalValue =
        score / 20;

      var evidence =
        rowText
          .replace(
            /\s+/g,
            " "
          )
          .trim()
          .substring(
            0,
            500
          );

      resultat.fields[
        "question." +
        question.question_id
      ] = {
        value:
          canonicalValue,

        confidence:
          1,

        evidence:
          evidence,

        extractionMethod:
          "AFRIGREEN24_STRUCTURED_REPORT",

        deterministic:
          true,

        provenance: {
          extractionMethod:
            "AFRIGREEN24_STRUCTURED_REPORT",
          deterministic:
            true,
          sourceSectionDetected:
            true
        }
      };

      resultat.questionCount++;
    }
  );

  resultat.missingQuestionNumbers = resultat.missingQuestionNumbers.filter(function(number, index, values) {
    return values.indexOf(number) === index;
  });
  resultat.duplicateQuestionNumbers.sort(function(a, b) { return a - b; });
  resultat.missingQuestionNumbers.sort(function(a, b) { return a - b; });
  resultat.invalidScores = resultat.invalidScores.filter(function(item, index, values) {
    return values.findIndex(function(candidate) {
      return candidate.questionNumber === item.questionNumber && candidate.score === item.score;
    }) === index;
  });

  resultat.detected =
    resultat.sourceSectionDetected === true;

  console.log(
    JSON.stringify({
      event:
        "esg_structured_report_deterministic_extraction",

      detected:
        resultat.detected,

      questionCount:
        resultat.questionCount,

      missingQuestionNumbers:
        resultat.missingQuestionNumbers,

      duplicateQuestionNumbers:
        resultat.duplicateQuestionNumbers,

      invalidScores:
        resultat.invalidScores,

      sourceSectionDetected:
        resultat.sourceSectionDetected
    })
  );

  return resultat;
}


function trouverDerniereOccurrenceRegexESG_(source, regex) {
  var lastIndex = -1;
  var match;
  regex.lastIndex = 0;
  while ((match = regex.exec(String(source || ""))) !== null) {
    lastIndex = match.index;
    if (match[0] === "") {
      regex.lastIndex++;
    }
  }
  return lastIndex;
}


function construireDefinitionsIAImportESG_(
  definitions,
  deterministicFields
) {
  var deterministicPaths = {};

  Object.keys(
    deterministicFields || {}
  ).forEach(
    function(path) {
      deterministicPaths[
        String(path)
      ] = true;
    }
  );

  return (
    definitions || []
  ).filter(
    function(definition) {
      var path =
        String(
          definition &&
          definition.path ||
          ""
        );

      return (
        deterministicPaths[path] !==
        true
      );
    }
  );
}


function fusionnerExtractionDeterministeImportESG_(
  aiFields,
  deterministicFields
) {
  var output = {};

  Object.keys(
    aiFields || {}
  ).forEach(
    function(path) {
      /*
       * FRONTIÈRE DE CONFIANCE :
       * un provider IA ne peut jamais s'auto-déclarer "deterministic"
       * ni injecter notre provenance interne. Seuls les trois champs
       * du contrat provider sont conservés ici.
       */
      var aiItem =
        aiFields[path] &&
        typeof aiFields[path] === "object"
          ? aiFields[path]
          : {};

      output[path] = {
        value:
          aiItem.value,

        confidence:
          aiItem.confidence,

        evidence:
          String(
            aiItem.evidence || ""
          )
      };
    }
  );

  Object.keys(
    deterministicFields || {}
  ).forEach(
    function(path) {
      output[path] =
        deterministicFields[path];
    }
  );

  return output;
}


function TEST_ESG_STRUCTURED_REPORT_DETERMINISTIC_IMPORT_LOCAL() {
  var lines = [
    "Sommaire",
    "Annexe B. Diagnostic technique détaillé",
    "Annexe C. Transparence numérique ESG",
    "",
    "Annexe A. Méthodologie et limites",
    "Questions analysées 50",
    "Données manquantes 0",
    "",
    "Annexe B. Diagnostic technique détaillé",
    "N° Thème / sous-thème Score Preuve Statut",
    "Environnement"
  ];

  obtenirQuestionsESG()
    .forEach(
      function(question) {
        var numero =
          Number(
            question.number
          );

        var score =
          (
            numero %
            6
          ) *
          20;

        lines.push(
          numero +
          " " +
          String(
            question.theme ||
            "Thème"
          ) +
          " — " +
          String(
            question.subtheme ||
            ""
          ) +
          " " +
          score +
          " / 100 Preuve moyenne En structuration"
        );
      }
    );

  lines.push(
    "Préparation ESG"
  );

  lines.push(
    "Annexe C. Transparence numérique ESG"
  );

  var source =
    lines.join(
      "\n"
    );

  var extraction =
    extraireQuestionsRapportAfriGreen24Deterministe_(
      source,
      "STRUCTURED_ESG_REPORT"
    );

  var questions =
    obtenirQuestionsESG();

  var errors = [];

  if (
    extraction.detected !==
    true
  ) {
    errors.push(
      "Rapport structuré non détecté."
    );
  }

  if (
    extraction.questionCount !==
    50
  ) {
    errors.push(
      "Nombre de questions extraites : " +
      extraction.questionCount +
      " au lieu de 50."
    );
  }

  questions.forEach(
    function(question) {
      var numero =
        Number(
          question.number
        );

      var expected =
        numero %
        6;

      var item =
        extraction.fields[
          "question." +
          question.question_id
        ];

      if (
        !item ||
        Number(
          item.value
        ) !==
          expected ||
        Number(
          item.confidence
        ) !==
          1
      ) {
        errors.push(
          "Mapping déterministe invalide pour question " +
          numero +
          "."
        );
      }
    }
  );

  return {
    success:
      errors.length ===
      0,

    questionCount:
      extraction.questionCount,

    missingQuestionNumbers:
      extraction
        .missingQuestionNumbers,

    errors:
      errors
  };
}


/**
 * ============================================================
 * CONSTRUCTION DU RÉSULTAT POUR Script.html
 * ============================================================
 */
/**
 * Intégration locale : simule la sortie texte d'un tableau Google Docs
 * (une cellule par ligne) et vérifie le même chemin que la production,
 * jusqu'à construireResultatImportESG_.
 */
function TEST_ESG_IMPORT_TRUST_BOUNDARY_LOCAL() {
  var merged =
    fusionnerExtractionDeterministeImportESG_(
      {
        "question.E-POL-001": {
          value:
            "4",

          confidence:
            0.99,

          evidence:
            "Preuve inventée absente de la source.",

          deterministic:
            true,

          extractionMethod:
            "AFRIGREEN24_STRUCTURED_REPORT",

          provenance: {
            deterministic:
              true
          }
        }
      },
      {},
      false
    );

  var item =
    merged[
      "question.E-POL-001"
    ];

  var result =
    construireChampImportESG_(
      item,
      "Source sans la preuve inventée.",
      {
        question_id:
          "E-POL-001"
      },
      true
    );

  var success =
    item.deterministic ===
      undefined &&
    item.extractionMethod ===
      undefined &&
    item.provenance ===
      undefined &&
    result.status ===
      ESG_IMPORT_STATUS.TO_CONFIRM &&
    result.deterministic !==
      true;

  if (!success) {
    throw new Error(
      "TEST_ESG_IMPORT_TRUST_BOUNDARY_FAILED"
    );
  }

  return {
    success:
      true,

    status:
      result.status
  };
}


function TEST_ESG_STRUCTURED_PARTIAL_FALLBACK_LOCAL() {
  var definitions =
    construireDefinitionsChampsESG_();

  var deterministicFields = {
    "question.E-POL-001": {
      value:
        4,

      confidence:
        1,

      evidence:
        "Question déterministe",

      extractionMethod:
        "AFRIGREEN24_STRUCTURED_REPORT",

      deterministic:
        true
    }
  };

  var definitionsForAI =
    construireDefinitionsIAImportESG_(
      definitions,
      deterministicFields
    );

  var pathsForAI =
    definitionsForAI.map(
      function(definition) {
        return String(
          definition.path || ""
        );
      }
    );

  var errors = [];

  if (
    definitions.length !==
    65
  ) {
    errors.push(
      "Le contrat complet doit contenir 65 définitions."
    );
  }

  if (
    definitionsForAI.length !==
    64
  ) {
    errors.push(
      "Une seule question déterministe doit retirer une seule définition IA."
    );
  }

  if (
    pathsForAI.indexOf(
      "question.E-POL-001"
    ) !==
    -1
  ) {
    errors.push(
      "La question déjà déterministe ne doit pas être envoyée à l'IA."
    );
  }

  var questionDefinitionsForAI =
    definitionsForAI.filter(
      function(definition) {
        return (
          String(
            definition.path || ""
          ).indexOf(
            "question."
          ) === 0
        );
      }
    );

  if (
    questionDefinitionsForAI.length !==
    49
  ) {
    errors.push(
      "Les 49 questions non déterministes doivent rester disponibles au fallback IA."
    );
  }

  var allDefinitionsForAI =
    construireDefinitionsIAImportESG_(
      definitions,
      {}
    );

  if (
    allDefinitionsForAI.length !==
    65
  ) {
    errors.push(
      "Si le parser ne récupère aucune question, les 65 définitions doivent rester disponibles à l'IA."
    );
  }

  var merged =
    fusionnerExtractionDeterministeImportESG_(
      {
        "question.E-POL-001": {
          value:
            "1",

          confidence:
            0.9,

          evidence:
            "Valeur IA qui doit être écrasée"
        },

        "question.S-HR-001": {
          value:
            "3",

          confidence:
            0.91,

          evidence:
            "Valeur IA conservée"
        }
      },
      deterministicFields
    );

  if (
    !merged[
      "question.E-POL-001"
    ] ||
    merged[
      "question.E-POL-001"
    ].deterministic !==
      true ||
    Number(
      merged[
        "question.E-POL-001"
      ].value
    ) !==
      4
  ) {
    errors.push(
      "La valeur déterministe doit toujours gagner sur l'IA."
    );
  }

  if (
    !merged[
      "question.S-HR-001"
    ] ||
    merged[
      "question.S-HR-001"
    ].deterministic ===
      true ||
    String(
      merged[
        "question.S-HR-001"
      ].value
    ) !==
      "3"
  ) {
    errors.push(
      "Une question non déterministe extraite par l'IA doit être conservée."
    );
  }

  if (
    errors.length
  ) {
    throw new Error(
      "TEST_ESG_STRUCTURED_PARTIAL_FALLBACK_FAILED: " +
      errors.join(
        " | "
      )
    );
  }

  return {
    success:
      true,

    definitionsTotal:
      definitions.length,

    definitionsForAI:
      definitionsForAI.length,

    questionDefinitionsForAI:
      questionDefinitionsForAI.length,

    zeroDeterministicDefinitionsForAI:
      allDefinitionsForAI.length
  };
}


function TEST_ESG_STRUCTURED_REPORT_IMPORT_INTEGRATION_LOCAL() {
  function construireFixture_(options) {
    options = options || {};
    var lines = [
      "Sommaire",
      "Annexe B. Diagnostic technique détaillé",
      "Annexe C. Transparence numérique ESG",
      "Questions analysées 50",
      "Données manquantes 0",
      "Préparation ESG",
      "Annexe B. Diagnostic technique détaillé",
      "N°",
      "Thème / sous-thème",
      "Score",
      "Preuve",
      "Statut"
    ];

    obtenirQuestionsESG().forEach(function(question) {
      var numero = Number(question.number);
      if (options.missing === numero) {
        return;
      }
      var score = options.invalid === numero
        ? "30 / 100"
        : String((numero % 6) * 20) + " / 100";
      lines.push(
        String(numero),
        String(question.theme || "Thème"),
        String(question.subtheme || "Sous-thème"),
        score,
        "Preuve moyenne",
        "En structuration"
      );
      if (options.duplicate === numero) {
        lines.push(
          String(numero),
          String(question.theme || "Thème"),
          String(question.subtheme || "Sous-thème"),
          score,
          "Preuve moyenne",
          "En structuration"
        );
      }
    });

    lines.push("Annexe C. Transparence numérique ESG");
    return lines.join("\n");
  }

  var errors = [];
  var completeSource = construireFixture_();
  var extraction = extraireQuestionsRapportAfriGreen24Deterministe_(
    completeSource,
    "STRUCTURED_ESG_REPORT"
  );
  var finalResult = construireResultatImportESG_(
    extraction.fields,
    completeSource,
    "structured-report-fixture.pdf"
  );

  if (!extraction.detected || !extraction.sourceSectionDetected || extraction.questionCount !== 50) {
    errors.push("Le rapport tableau complet doit produire 50 questions.");
  }
  if (extraction.missingQuestionNumbers.length || extraction.duplicateQuestionNumbers.length || extraction.invalidScores.length) {
    errors.push("Le rapport complet ne doit contenir aucune anomalie.");
  }
  if (
    finalResult.analysis.found !== 50 ||
    finalResult.analysis.toConfirm !== 0 ||
    finalResult.analysis.missing !== 15
  ) {
    errors.push("Le chemin construireResultatImportESG_ ne doit laisser manquer que les 15 champs profil.");
  }
  var questionStats = {
    total: 0,
    found: 0,
    toConfirm: 0,
    missing: 0
  };
  Object.keys(finalResult.questions).forEach(function(questionId) {
    questionStats.total++;
    var questionStatus = finalResult.questions[questionId].status;
    if (questionStatus === ESG_IMPORT_STATUS.FOUND) {
      questionStats.found++;
    } else if (questionStatus === ESG_IMPORT_STATUS.TO_CONFIRM) {
      questionStats.toConfirm++;
    } else {
      questionStats.missing++;
    }
  });
  if (questionStats.total !== 50 || questionStats.found !== 50 || questionStats.toConfirm !== 0 || questionStats.missing !== 0) {
    errors.push("Les statistiques finales questions doivent être 50/50 FOUND.");
  }
  Object.keys(finalResult.questions).forEach(function(questionId) {
    var item = finalResult.questions[questionId];
    if (item.status !== ESG_IMPORT_STATUS.FOUND || item.confidence !== 1 || item.deterministic !== true) {
      errors.push("Question non FOUND/déterministe : " + questionId);
    }
  });

  var mapping = [0, 1, 2, 3, 4, 5];
  obtenirQuestionsESG().forEach(function(question) {
    var expected = mapping[Number(question.number) % 6];
    var item = extraction.fields["question." + question.question_id];
    if (!item || Number(item.value) !== expected) {
      errors.push("Mapping score invalide pour " + question.question_id);
    }
  });

  var missing = extraireQuestionsRapportAfriGreen24Deterministe_(
    construireFixture_({ missing: 17 }),
    "STRUCTURED_ESG_REPORT"
  );
  if (missing.questionCount !== 49 || missing.missingQuestionNumbers.indexOf(17) === -1) {
    errors.push("La question manquante doit être signalée.");
  }

  var duplicate = extraireQuestionsRapportAfriGreen24Deterministe_(
    construireFixture_({ duplicate: 12 }),
    "STRUCTURED_ESG_REPORT"
  );
  if (duplicate.duplicateQuestionNumbers.indexOf(12) === -1) {
    errors.push("Le numéro dupliqué doit être signalé.");
  }

  var invalid = extraireQuestionsRapportAfriGreen24Deterministe_(
    construireFixture_({ invalid: 8 }),
    "STRUCTURED_ESG_REPORT"
  );
  if (invalid.invalidScores.length !== 1 || invalid.invalidScores[0].questionNumber !== 8) {
    errors.push("Le score 30/100 doit être signalé comme invalide.");
  }

  if (extraireQuestionsRapportAfriGreen24Deterministe_(
    "Annexe B. Diagnostic technique détaillé",
    "STRUCTURED_ESG_REPORT"
  ).detected) {
    errors.push("Un faux positif Annexe B seul doit être refusé.");
  }
  if (extraireQuestionsRapportAfriGreen24Deterministe_(
    "Rapport narratif ESG sans tableau propriétaire.",
    "NARRATIVE_ESG"
  ).detected) {
    errors.push("Un rapport narratif ne doit pas être structuré.");
  }

  if (errors.length) {
    throw new Error("TEST_ESG_STRUCTURED_REPORT_IMPORT_INTEGRATION_FAILED: " + errors.join(" | "));
  }

  return {
    success: true,
    questionCount: extraction.questionCount,
    analysis: finalResult.analysis,
    tests: 9
  };
}


function construireResultatImportESG_(
  fields,
  sourceText,
  sourceName
) {
  var profile = {};

  var questions = {};


  var stats = {
    found: 0,
    toConfirm: 0,
    missing: 0
  };


  /*
   * ----------------------------------------------------------
   * PROFIL
   * ----------------------------------------------------------
   */
  obtenirChampsProfilESG()
    .forEach(
      function(field) {

        var path =
          "profile." +
          field.id;


        var resultat =
          construireChampImportESG_(
            fields[path],
            sourceText,
            field,
            false
          );


        profile[
          field.id
        ] =
          resultat;


        incrementerStatutImportESG_(
          stats,
          resultat.status
        );

      }
    );


  /*
   * ----------------------------------------------------------
   * QUESTIONS ESG
   * ----------------------------------------------------------
   */
  obtenirQuestionsESG()
    .forEach(
      function(question) {

        var path =
          "question." +
          question.question_id;


        var resultat =
          construireChampImportESG_(
            fields[path],
            sourceText,
            question,
            true
          );


        questions[
          question.question_id
        ] =
          resultat;


        incrementerStatutImportESG_(
          stats,
          resultat.status
        );

      }
    );


  return {
    sourceName:
      String(
        sourceName || ""
      ),

    profile:
      profile,

    questions:
      questions,

    analysis: {
      total:
        stats.found +
        stats.toConfirm +
        stats.missing,

      found:
        stats.found,

      toConfirm:
        stats.toConfirm,

      missing:
        stats.missing
    }
  };
}


/**
 * ============================================================
 * VALIDATION D'UN CHAMP EXTRAIT
 * ============================================================
 */
function construireChampImportESG_(
  brut,
  sourceText,
  definition,
  estQuestion
) {
  brut =
    brut &&
    typeof brut === "object"
      ? brut
      : {};


  var value =
    brut.value;


  var confidence =
    Number(
      brut.confidence
    );


  if (
    !isFinite(
      confidence
    )
  ) {
    confidence = 0;
  }


  confidence =
    Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );


  var evidence =
    String(
      brut.evidence || ""
    ).trim();


  var evidenceMatchedSource =
    evidence
      ? preuvePresenteDansSourceESG_(
          evidence,
          sourceText
        )
      : false;

  var deterministicStructuredExtraction =
    brut.deterministic === true &&
    brut.extractionMethod ===
      "AFRIGREEN24_STRUCTURED_REPORT";

  var extractionProvenance =
    brut.provenance ||
    (deterministicStructuredExtraction
      ? {
          extractionMethod:
            "AFRIGREEN24_STRUCTURED_REPORT",
          deterministic:
            true
        }
      : null);

  /*
   * Le parser déterministe a déjà validé la cellule source dans la section
   * propriétaire du rapport. Cette provenance explicite permet de tolérer
   * les différences de texte introduites par PDF -> Google Docs sans
   * affaiblir le Fact Guard des extractions IA.
   */
  if (deterministicStructuredExtraction && evidence) {
    evidenceMatchedSource = true;
  }


  /*
   * ==========================================================
   * PROTECTION CONTRE LES FAUX ZÉROS TECHNIQUES
   * ==========================================================
   *
   * Exemple modèle :
   *
   * value = 0
   * confidence = 0
   * evidence = ""
   *
   * Ce zéro ne constitue PAS une information documentaire.
   */
  if (
    Number(
      brut.confidence
    ) === 0 &&
    !evidence
  ) {
    return {
      value: "",
      canonicalValue: "",
      confidence: 0,
      evidence: "",
      evidenceMatchedSource:
        false,
      status:
        ESG_IMPORT_STATUS.MISSING
    };
  }


  /*
   * ==========================================================
   * INFORMATION IDENTIFIÉE MAIS NON CANONISABLE
   * ==========================================================
   *
   * Cas typique d'un rapport ESG structuré :
   *
   * "Santé et sécurité — 30/100 — Preuve moyenne"
   *
   * HumbleOS reconnaît correctement la question,
   * mais refuse de convertir arbitrairement 30/100
   * en niveau canonique 0–5.
   *
   * Donc :
   *
   * value = ""
   * confidence > 0
   * evidence = extrait exact
   *
   * devient TO_CONFIRM et NON MISSING.
   */
  if (
    valeurImportESGVide_(
      value
    ) &&
    evidence &&
    confidence > 0 &&
    evidenceMatchedSource
  ) {
    return {
      value: "",
      canonicalValue: "",
      confidence:
        confidence,
      evidence:
        evidence,
      evidenceMatchedSource:
        evidenceMatchedSource,
      status:
        ESG_IMPORT_STATUS.TO_CONFIRM
    };
  }


  /*
   * ==========================================================
   * VRAIE INFORMATION MANQUANTE
   * ==========================================================
   */
  if (
    valeurImportESGVide_(
      value
    )
  ) {
    return {
      value: "",
      canonicalValue: "",
      confidence: 0,
      evidence: "",
      evidenceMatchedSource:
        false,
      status:
        ESG_IMPORT_STATUS.MISSING
    };
  }


  /*
   * ==========================================================
   * FACT GUARD
   * ==========================================================
   *
   * Toute valeur non vide doit être soutenue
   * par une preuve réellement présente dans le document.
   */
  if (
    !evidence ||
    !evidenceMatchedSource
  ) {
    return {
      value:
        value,

      canonicalValue:
        "",

      confidence:
        confidence,

      evidence:
        evidence,

      evidenceMatchedSource:
        evidenceMatchedSource,

      status:
        ESG_IMPORT_STATUS.TO_CONFIRM
    };
  }


  /*
   * ==========================================================
   * NORMALISATION CANONIQUE
   * ==========================================================
   */
  var canonicalValue;


  if (estQuestion) {

    canonicalValue =
  normaliserValeurCanoniqueImportESG_(
    value
  );

  } else {

    canonicalValue =
      normaliserValeurCanoniqueProfilESG_(
        definition,
        value
      );

  }


  /*
   * Valeur documentaire trouvée,
   * mais impossible à normaliser de manière déterministe.
   */
  if (
    valeurImportESGVide_(
      canonicalValue
    )
  ) {
    return {
      value:
        value,

      canonicalValue:
        "",

      confidence:
        confidence,

      evidence:
        evidence,

      evidenceMatchedSource:
        evidenceMatchedSource,

      status:
        ESG_IMPORT_STATUS.TO_CONFIRM
    };
  }


  /*
   * ==========================================================
   * FOUND / TO_CONFIRM
   * ==========================================================
   *
   * FOUND seulement si :
   *
   * - preuve présente ;
   * - valeur canonique valide ;
   * - confiance >= 0.82.
   */
  var status =
    confidence >=
      ESG_IMPORT_FOUND_THRESHOLD
      ? ESG_IMPORT_STATUS.FOUND
      : ESG_IMPORT_STATUS.TO_CONFIRM;


  return {
    value:
      value,

    canonicalValue:
      canonicalValue,

    confidence:
      confidence,

    evidence:
      evidence,

    evidenceMatchedSource:
      evidenceMatchedSource,

    extractionMethod:
      brut.extractionMethod || "",

    deterministic:
      deterministicStructuredExtraction,

    provenance:
      extractionProvenance,

    status:
      status
  };
}


/**
 * ============================================================
 * NORMALISATION CANONIQUE — PROFIL
 * ============================================================
 */
function normaliserValeurCanoniqueProfilESG_(
  field,
  valeur
) {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return "";
  }


  /*
   * NUMBER
   */
  if (
    field.type === "number"
  ) {
    var nombre =
      Number(
        valeur
      );


    return isFinite(
      nombre
    )
      ? nombre
      : "";
  }


  /*
   * MULTISELECT
   */
  if (
    field.type ===
    "multiselect"
  ) {
    var valeurs =
      Array.isArray(
        valeur
      )
        ? valeur
        : [valeur];


    var autorisees =
      field.options || [];


    var sortie = [];


    valeurs.forEach(
      function(v) {

        var canonique =
          trouverOptionCanoniqueESG_(
            v,
            autorisees
          );


        if (
          canonique !== "" &&
          sortie.indexOf(
            canonique
          ) === -1
        ) {
          sortie.push(
            canonique
          );
        }

      }
    );


    return sortie;
  }


  /*
   * SELECT
   */
  if (
    field.type ===
    "select"
  ) {
    return trouverOptionCanoniqueESG_(
      valeur,
      field.options || []
    );
  }


  /*
   * TEXTE
   */
  return String(
    valeur
  ).trim();
}


/**
 * ============================================================
 * TROUVE UNE OPTION CANONIQUE
 * ============================================================
 */
function trouverOptionCanoniqueESG_(
  valeur,
  options
) {
  var cherche =
    normaliserTexteComparaisonESG_(
      valeur
    );


  if (!cherche) {
    return "";
  }


  for (
    var i = 0;
    i < options.length;
    i++
  ) {

    var option =
      options[i];


    var optionValue;


    if (
      option &&
      typeof option ===
      "object"
    ) {

      optionValue =
        option.value !==
        undefined
          ? option.value
          : option.label;

    } else {

      optionValue =
        option;

    }


    if (
      normaliserTexteComparaisonESG_(
        optionValue
      ) === cherche
    ) {
      return optionValue;
    }
  }


  return "";
}


/**
 * ============================================================
 * FACT GUARD — EVIDENCE
 * ============================================================
 */
function preuvePresenteDansSourceESG_(
  evidence,
  sourceText
) {
  var preuve =
    normaliserTextePreuveESG_(
      evidence
    );


  var source =
    normaliserTextePreuveESG_(
      sourceText
    );


  if (
    !preuve ||
    !source
  ) {
    return false;
  }


  return (
    source.indexOf(
      preuve
    ) !== -1
  );
}


/**
 * ============================================================
 * NORMALISATION TEXTE PREUVE
 * ============================================================
 */
function normaliserTextePreuveESG_(
  texte
) {
  return String(
    texte || ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLowerCase();
}


/**
 * ============================================================
 * VALEUR VIDE ?
 * ============================================================
 */
function valeurImportESGVide_(
  valeur
) {
  if (
    valeur === null ||
    valeur === undefined ||
    valeur === ""
  ) {
    return true;
  }


  if (
    Array.isArray(
      valeur
    )
  ) {
    return (
      valeur.length === 0
    );
  }


  return false;
}


/**
 * ============================================================
 * INCRÉMENTATION DES STATUTS
 * ============================================================
 */
function incrementerStatutImportESG_(
  stats,
  status
) {
  if (
    status ===
    ESG_IMPORT_STATUS.FOUND
  ) {

    stats.found++;

  } else if (
    status ===
    ESG_IMPORT_STATUS.TO_CONFIRM
  ) {

    stats.toConfirm++;

  } else {

    stats.missing++;

  }
}


/**
 * ============================================================
 * NORMALISATION TEXTE DE COMPARAISON
 * ============================================================
 */
function normaliserTexteComparaisonESG_(
  valeur
) {
  return String(
    valeur || ""
  )
    .toLowerCase()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[’']/g,
      " "
    )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


/**
 * ============================================================
 * PROVENANCE DU PRÉREMPLISSAGE
 * ============================================================
 */
function ajouterProvenanceResultatImportESG_(
  resultat,
  sourceDocument
) {
  resultat =
    resultat || {};

  sourceDocument =
    sourceDocument || {};

  function enrichirCollection_(collection) {
    Object.keys(
      collection || {}
    ).forEach(
      function(id) {
        var item =
          collection[id];

        if (!item) {
          return;
        }

        item.inputMethod =
          "DOCUMENT_EXTRACTION";

        item.extractionStatus =
          String(
            item.status ||
            ""
          );

        item.sourceDocumentId =
          String(
            sourceDocument
              .sourceDocumentId ||
            ""
          );

        item.sourceName =
          String(
            sourceDocument.name ||
            resultat.sourceName ||
            ""
          );

        item.sourceExcerpt =
          String(
            item.evidence ||
            ""
          );

        item.extractionConfidence =
          Number(
            item.confidence
          );

        if (
          !isFinite(
            item.extractionConfidence
          )
        ) {
          item.extractionConfidence =
            null;
        }

        /*
         * FOUND = extraction exploitable, PAS validation humaine.
         */
        item.userConfirmed =
          false;
      }
    );
  }

  enrichirCollection_(
    resultat.profile
  );

  enrichirCollection_(
    resultat.questions
  );

  return resultat;
}


/**
 * ============================================================
 * HUMBLEOS — APPEL GÉNÉRIQUE
 * ============================================================
 *
 * Script Properties :
 *
 * HUMBLEOS_GATEWAY_URL
 * HUMBLEOS_GATEWAY_SECRET
 */
function appelerHumbleOS_(
  endpoint,
  method,
  payload
) {
  var properties =
    PropertiesService
      .getScriptProperties();


  var baseUrl =
    String(
      properties.getProperty(
        "HUMBLEOS_GATEWAY_URL"
      ) || ""
    )
      .trim()
      .replace(
        /\/$/,
        ""
      );


  var secret =
    String(
      properties.getProperty(
        "HUMBLEOS_GATEWAY_SECRET"
      ) || ""
    ).trim();


  if (!baseUrl) {
    throw new Error(
      "HUMBLEOS_GATEWAY_URL non configurée."
    );
  }


  if (!secret) {
    throw new Error(
      "HUMBLEOS_GATEWAY_SECRET non configuré."
    );
  }


  endpoint =
    String(
      endpoint || ""
    ).trim();


  if (!endpoint) {
    throw new Error(
      "Endpoint HumbleOS manquant."
    );
  }


  if (
    endpoint.charAt(0) !==
    "/"
  ) {
    endpoint =
      "/" + endpoint;
  }


  var options = {
    method:
      String(
        method || "post"
      ).toLowerCase(),

    contentType:
      "application/json",

    headers: {
      Authorization:
        "Bearer " +
        secret,

      "X-AfriGreen-Secret":
        secret
    },

    muteHttpExceptions:
      true
  };


  if (
    payload !== undefined &&
    payload !== null
  ) {
    options.payload =
      JSON.stringify(
        payload
      );
  }


  var response =
    UrlFetchApp.fetch(
      baseUrl +
      endpoint,
      options
    );


  var status =
    response
      .getResponseCode();


  var body =
    response
      .getContentText();


  var parsed;


  try {

    parsed =
      body
        ? JSON.parse(
            body
          )
        : {};

  } catch (e) {

    throw new Error(
      "Réponse HumbleOS non JSON " +
      "(HTTP " +
      status +
      ") : " +
      body.substring(
        0,
        500
      )
    );
  }


  if (
    status < 200 ||
    status >= 300
  ) {
    throw new Error(
      "HumbleOS " +
      endpoint +
      " refusé (HTTP " +
      status +
      ") : " +
      (
        parsed.error ||
        parsed.message ||
        body.substring(
          0,
          500
        )
      )
    );
  }


  return parsed;
}


/**
 * ============================================================
 * TEST LOCAL — DÉTECTION DU TYPE DE DOCUMENT
 * ============================================================
 *
 * Aucun appel HumbleOS.
 * Aucun Neuron consommé.
 */
function TEST_ESG_DETECTION_DOCUMENT_STRUCTURE_LOCAL() {
  var tests = [
    {
      input:
        "Notre politique environnementale est formalisée.",

      expected:
        "NARRATIVE_ESG"
    },

    {
      input: [
        "RAPPORT ESG",
        "Score ESG : 55/100",
        "Maturité ESG : En structuration",
        "Niveau de preuve : Preuve moyenne",
        "Diagnostic ESG détaillé"
      ].join(
        "\n"
      ),

      expected:
        "STRUCTURED_ESG_REPORT"
    }
  ];


  var errors = [];


  tests.forEach(
    function(test, index) {

      var output =
        detecterModeDocumentImportESG_(
          test.input
        );


      var ok =
        output ===
        test.expected;


      Logger.log(
        JSON.stringify({
          test:
            index + 1,

          output:
            output,

          expected:
            test.expected,

          ok:
            ok
        })
      );


      if (!ok) {
        errors.push(
          "Test " +
          (index + 1)
        );
      }

    }
  );


  Logger.log(
    "========================================"
  );

  Logger.log(
    "TESTS : " +
    tests.length
  );

  Logger.log(
    "OK : " +
    (
      tests.length -
      errors.length
    )
  );

  Logger.log(
    "ERREURS : " +
    errors.length
  );

  Logger.log(
    "========================================"
  );


  if (
    errors.length
  ) {
    throw new Error(
      "TEST DÉTECTION ESG STRUCTURÉ ÉCHOUÉ"
    );
  }


  Logger.log(
    "✅ DÉTECTION DOCUMENT ESG VALIDÉE"
  );


  return {
    success:
      true
  };
}
function TEST_ESG_STRUCTURED_FACT_GUARD_LOCAL() {
  var sourceText = [
    "Politique environnementale — Définie — Preuve forte",
    "Santé et sécurité — 30/100 — Preuve moyenne",
    "Aucune information disponible sur les achats responsables"
  ].join("\n");

  var tests = [
    {
      name: "FOUND canonique",
      brut: {
        value: "3",
        confidence: 0.95,
        evidence: "Politique environnementale — Définie — Preuve forte"
      },
      definition: {
        question_id: "E-POL-001"
      },
      estQuestion: true,
      expectedStatus: "FOUND",
      expectedCanonical: 3
    },

    {
      name: "TO_CONFIRM valeur vide mais preuve présente",
      brut: {
        value: "",
        confidence: 0.65,
        evidence: "Santé et sécurité — 30/100 — Preuve moyenne"
      },
      definition: {
        question_id: "S-OHS-001"
      },
      estQuestion: true,
      expectedStatus: "TO_CONFIRM",
      expectedCanonical: ""
    },

    {
      name: "MISSING réel",
      brut: {
        value: "",
        confidence: 0,
        evidence: ""
      },
      definition: {
        question_id: "G-SUP-001"
      },
      estQuestion: true,
      expectedStatus: "MISSING",
      expectedCanonical: ""
    },

    {
      name: "TO_CONFIRM preuve absente de la source",
      brut: {
        value: "4",
        confidence: 0.94,
        evidence: "Cette phrase n'existe pas dans le document."
      },
      definition: {
        question_id: "E-ENER-001"
      },
      estQuestion: true,
      expectedStatus: "TO_CONFIRM",
      expectedCanonical: ""
    }
  ];

  var errors = [];

  tests.forEach(function(test, index) {
    var result =
      construireChampImportESG_(
        test.brut,
        sourceText,
        test.definition,
        test.estQuestion
      );

    var statusOk =
      result.status === test.expectedStatus;

    var canonicalOk =
      String(result.canonicalValue) ===
      String(test.expectedCanonical);

    var ok =
      statusOk &&
      canonicalOk;

    Logger.log(
      JSON.stringify({
        test: index + 1,
        name: test.name,
        result: result,
        expectedStatus: test.expectedStatus,
        expectedCanonical: test.expectedCanonical,
        ok: ok
      })
    );

    if (!ok) {
      errors.push(test.name);
    }
  });

  Logger.log("========================================");
  Logger.log("TESTS : " + tests.length);
  Logger.log("OK : " + (tests.length - errors.length));
  Logger.log("ERREURS : " + errors.length);
  Logger.log("========================================");

  if (errors.length) {
    throw new Error(
      "TEST STRUCTURED FACT GUARD ÉCHOUÉ : " +
      errors.join(", ")
    );
  }

  Logger.log(
    "✅ STRUCTURED ESG FACT GUARD VALIDÉ"
  );

  return {
    success: true,
    tests: tests.length
  };
}
