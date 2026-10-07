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
 * HumbleOS /extract-esg
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
     * 5. APPEL HUMBLEOS
     * ----------------------------------------------------------
     *
     * À partir de maintenant Apps Script transmet également :
     *
     * documentMode
     *
     * Le Worker sera adapté à l'étape suivante pour utiliser
     * cette information.
     */
    var resultatHumbleOS =
      appelerHumbleOS_(
        "/extract-esg",
        "post",
        {
          sourceText:
            sourceText,

          fieldDefinitions:
            definitions,

          documentMode:
            documentMode
        }
      );


    if (
      !resultatHumbleOS ||
      !resultatHumbleOS.content ||
      !resultatHumbleOS.content.fields
    ) {
      throw new Error(
        "HumbleOS n’a pas retourné une extraction ESG exploitable."
      );
    }


    var fields =
      resultatHumbleOS.content.fields;


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


    resultat.success =
      true;

    resultat.documentMode =
      documentMode;

    resultat.extractionMethod =
      extraction.method || "";


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
 * CONSTRUCTION DU RÉSULTAT POUR Script.html
 * ============================================================
 */
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
    preuvePresenteDansSourceESG_(
      evidence,
      sourceText
    )
  ) {
    return {
      value: "",
      canonicalValue: "",
      confidence:
        confidence,
      evidence:
        evidence,
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
    !preuvePresenteDansSourceESG_(
      evidence,
      sourceText
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