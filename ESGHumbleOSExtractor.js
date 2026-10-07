/**
 * ============================================================
 * AFRIGREEN24 — ESG SMART IMPORT
 * Fichier : ESGHumbleOSExtractor.gs
 * Version : 1.0.0
 * ============================================================
 *
 * Dépendances :
 * - appelerHumbleOS_(endpoint, method, payload)
 * - obtenirSchemaImportESG_()
 * - obtenirSchemaImportProfilESG_()
 * - normaliserValeurCanoniqueImportESG_(value)
 *
 * Rôle :
 * 1. Envoyer le texte documentaire ESG à HumbleOS.
 * 2. Recevoir une extraction structurée.
 * 3. Revalider localement chaque question.
 * 4. Classer FOUND / TO_CONFIRM / MISSING.
 *
 * IMPORTANT :
 * - HumbleOS n'effectue AUCUN scoring ESG.
 * - Apps Script reste la source de vérité.
 * - Aucune valeur ambiguë n'est forcée.
 */

var ESG_IMPORT_HOS_CONFIG = Object.freeze({
  ENDPOINT: "/extract-esg",
  SCHEMA_VERSION: "afrigreen24_esg_import_v1",
  MAX_TEXT_CHARS: 90000,
  FOUND_CONFIDENCE: 0.82
});

function analyserDocumentESGAvecHumbleOS_(texteSource, sourceName) {
  if (typeof appelerHumbleOS_ !== "function") {
    throw new Error("Le bridge HumbleOS n’est pas disponible dans ce projet Apps Script.");
  }

  var texte = String(texteSource || "").trim();
  if (!texte) {
    throw new Error("Aucun texte ESG exploitable n’a été fourni.");
  }

  if (texte.length > ESG_IMPORT_HOS_CONFIG.MAX_TEXT_CHARS) {
    texte = texte.substring(0, ESG_IMPORT_HOS_CONFIG.MAX_TEXT_CHARS);
  }

  var result = appelerHumbleOS_(
    ESG_IMPORT_HOS_CONFIG.ENDPOINT,
    "post",
    construirePayloadExtractionESG_(texte, sourceName || "")
  );

  if (!result || !result.content || typeof result.content !== "object") {
    throw new Error("HumbleOS n’a pas retourné une extraction ESG exploitable.");
  }

  return normaliserResultatHumbleOSESg_(
    result.content,
    texte,
    sourceName || "",
    result.model || ""
  );
}

function construirePayloadExtractionESG_(texteSource, sourceName) {
  var questions = obtenirSchemaImportESG_().map(function(question) {
    return {
      questionId: question.questionId,
      pillar: question.pillar,
      theme: question.theme,
      subtheme: question.subtheme,
      question: question.question,
      evidenceExamples: question.evidenceExamples || [],
      canonicalValues: [0, 1, 2, 3, 4, 5, "NA", "UNK", "WIP"]
    };
  });

  var profile = obtenirSchemaImportProfilESG_().map(function(field) {
    return {
      fieldId: field.fieldId,
      label: field.label,
      type: field.type,
      required: field.required === true,
      canonicalValues: field.canonicalValues || null
    };
  });

  return {
    documentType: "ESG_IMPORT",
    schemaVersion: ESG_IMPORT_HOS_CONFIG.SCHEMA_VERSION,
    sourceName: String(sourceName || ""),
    sourceText: String(texteSource || ""),
    profileFields: profile,
    questions: questions,
    instructions: [
      "Tu extrais uniquement les informations explicitement présentes ou clairement démontrées dans le document.",
      "Tu ne calcules aucun score ESG.",
      "Tu ne déduis jamais un niveau de maturité à partir d'un simple oui.",
      "Tu n'inventes aucune politique, donnée, preuve, mesure, certification, audit ou procédure.",
      "Chaque evidence doit être un court extrait fidèle au document source.",
      "Si l'information est absente, retourne MISSING.",
      "Si l'information existe mais ne permet pas de déterminer un niveau canonique avec certitude, retourne TO_CONFIRM.",
      "FOUND est réservé aux informations suffisamment explicites et appuyées par une preuve.",
      "canonicalValue doit être uniquement 0,1,2,3,4,5,NA,UNK,WIP ou null.",
      "Retourne les 50 questionId exactement une seule fois.",
      "Retourne uniquement le JSON structuré attendu."
    ].join(" ")
  };
}

function normaliserResultatHumbleOSESg_(content, texteSource, sourceName, model) {
  var rawQuestions = content.questions && typeof content.questions === "object"
    ? content.questions
    : {};

  var rawProfile = content.profile && typeof content.profile === "object"
    ? content.profile
    : {};

  var questions = {};
  var profile = {};

  obtenirSchemaImportESG_().forEach(function(schemaQuestion) {
    var id = schemaQuestion.questionId;
    var item = obtenirItemExtractionESG_(rawQuestions, id);

    questions[id] = construireQuestionESGVerifiee_(
      schemaQuestion,
      item,
      texteSource,
      sourceName
    );
  });

  obtenirSchemaImportProfilESG_().forEach(function(field) {
    var item = obtenirItemExtractionESG_(rawProfile, field.fieldId);

    profile[field.fieldId] = construireChampProfilESGVerifie_(
      field,
      item,
      texteSource,
      sourceName
    );
  });

  return {
    schemaVersion: ESG_IMPORT_HOS_CONFIG.SCHEMA_VERSION,
    model: String(model || content.model || ""),
    sourceName: String(sourceName || ""),
    profile: profile,
    questions: questions,
    analysis: analyserCompletudeImportESG_(questions, profile)
  };
}

function obtenirItemExtractionESG_(collection, id) {
  if (!collection) return {};

  if (!Array.isArray(collection) && typeof collection === "object") {
    var direct = collection[id];
    return direct && typeof direct === "object" ? direct : {};
  }

  if (Array.isArray(collection)) {
    for (var index = 0; index < collection.length; index++) {
      var item = collection[index] || {};
      var itemId = String(item.questionId || item.fieldId || item.id || "").trim();
      if (itemId === id) return item;
    }
  }

  return {};
}

function construireQuestionESGVerifiee_(schemaQuestion, item, texteSource, sourceName) {
  item = item || {};

  var rawValue = nettoyerValeurImportESG_(
    item.rawValue !== undefined ? item.rawValue : item.value
  );

  var proposedCanonical = item.canonicalValue !== undefined
    ? item.canonicalValue
    : item.canonical_value;

  var canonicalValue = normaliserValeurCanoniqueImportESG_(proposedCanonical);

  if (canonicalValue === null && rawValue) {
    canonicalValue = normaliserValeurCanoniqueImportESG_(rawValue);
  }

  var confidence = normaliserConfianceImportESG_(item.confidence);
  var evidence = nettoyerValeurImportESG_(item.evidence);
  var evidenceVerified = verifierPreuveESGDansSource_(evidence, texteSource);

  var status = determinerStatutQuestionImportESG_(
    canonicalValue,
    rawValue,
    confidence,
    evidenceVerified
  );

  return {
    questionId: schemaQuestion.questionId,
    pillar: schemaQuestion.pillar,
    rawValue: rawValue,
    canonicalValue: status === ESG_IMPORT_STATUS.MISSING ? null : canonicalValue,
    status: status,
    confidence: confidence,
    evidence: evidence,
    evidenceVerified: evidenceVerified,
    source: String(sourceName || "")
  };
}

function determinerStatutQuestionImportESG_(canonicalValue, rawValue, confidence, evidenceVerified) {
  if (canonicalValue === null && !rawValue) {
    return ESG_IMPORT_STATUS.MISSING;
  }

  if (canonicalValue === null) {
    return ESG_IMPORT_STATUS.TO_CONFIRM;
  }

  if (
    confidence >= ESG_IMPORT_HOS_CONFIG.FOUND_CONFIDENCE &&
    evidenceVerified === true
  ) {
    return ESG_IMPORT_STATUS.FOUND;
  }

  return ESG_IMPORT_STATUS.TO_CONFIRM;
}

function construireChampProfilESGVerifie_(field, item, texteSource, sourceName) {
  item = item || {};

  var value = nettoyerValeurImportESG_(
    item.value !== undefined ? item.value : item.rawValue
  );

  var confidence = normaliserConfianceImportESG_(item.confidence);
  var evidence = nettoyerValeurImportESG_(item.evidence);
  var evidenceVerified = verifierPreuveESGDansSource_(evidence, texteSource);
  var canonicalValue = normaliserValeurProfilImportESG_(field, value);

  var status;

  if (!value) {
    status = ESG_IMPORT_STATUS.MISSING;
  } else if (
    canonicalValue !== null &&
    confidence >= ESG_IMPORT_HOS_CONFIG.FOUND_CONFIDENCE &&
    evidenceVerified
  ) {
    status = ESG_IMPORT_STATUS.FOUND;
  } else {
    status = ESG_IMPORT_STATUS.TO_CONFIRM;
  }

  return {
    fieldId: field.fieldId,
    value: value,
    canonicalValue: canonicalValue,
    status: status,
    confidence: confidence,
    evidence: evidence,
    evidenceVerified: evidenceVerified,
    source: String(sourceName || "")
  };
}

function normaliserValeurProfilImportESG_(field, value) {
  var propre = nettoyerValeurImportESG_(value);
  if (!propre) return null;

  var allowed = field && Array.isArray(field.canonicalValues)
    ? field.canonicalValues
    : null;

  if (!allowed) return propre;

  var normalized = nettoyerTexteComparaisonESG_(propre);

  for (var index = 0; index < allowed.length; index++) {
    if (nettoyerTexteComparaisonESG_(allowed[index]) === normalized) {
      return allowed[index];
    }
  }

  return null;
}

function verifierPreuveESGDansSource_(evidence, texteSource) {
  var preuve = nettoyerTexteComparaisonESG_(evidence);
  var source = nettoyerTexteComparaisonESG_(texteSource);

  if (!preuve || !source || preuve.length < 12) {
    return false;
  }

  return source.indexOf(preuve) !== -1;
}

function nettoyerTexteComparaisonESG_(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nettoyerValeurImportESG_(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function normaliserConfianceImportESG_(value) {
  var confidence = Number(value);
  if (!isFinite(confidence)) return 0;
  return Math.max(0, Math.min(1, confidence));
}

function analyserCompletudeImportESG_(questions, profile) {
  var result = {
    questions: { total: 0, found: 0, toConfirm: 0, missing: 0 },
    profile: { total: 0, found: 0, toConfirm: 0, missing: 0 },
    foundQuestionIds: [],
    toConfirmQuestionIds: [],
    missingQuestionIds: [],
    foundProfileFields: [],
    toConfirmProfileFields: [],
    missingProfileFields: []
  };

  Object.keys(questions || {}).forEach(function(id) {
    var item = questions[id];
    result.questions.total++;

    if (item.status === ESG_IMPORT_STATUS.FOUND) {
      result.questions.found++;
      result.foundQuestionIds.push(id);
    } else if (item.status === ESG_IMPORT_STATUS.TO_CONFIRM) {
      result.questions.toConfirm++;
      result.toConfirmQuestionIds.push(id);
    } else {
      result.questions.missing++;
      result.missingQuestionIds.push(id);
    }
  });

  Object.keys(profile || {}).forEach(function(id) {
    var item = profile[id];
    result.profile.total++;

    if (item.status === ESG_IMPORT_STATUS.FOUND) {
      result.profile.found++;
      result.foundProfileFields.push(id);
    } else if (item.status === ESG_IMPORT_STATUS.TO_CONFIRM) {
      result.profile.toConfirm++;
      result.toConfirmProfileFields.push(id);
    } else {
      result.profile.missing++;
      result.missingProfileFields.push(id);
    }
  });

  return result;
}

function TEST_ESG_HUMBLEOS_EXTRACTOR_LOCAL() {
  var source = [
    "EcoNova Industries dispose d'une politique environnementale formalisée et signée par la direction.",
    "La consommation énergétique est suivie chaque mois dans un tableau de bord.",
    "Aucun bilan des émissions de gaz à effet de serre n'a encore été réalisé.",
    "Un système de santé et sécurité est en cours de mise en place."
  ].join(" ");

  var fakeContent = {
    questions: {
      "E-POL-001": {
        rawValue: "Politique environnementale formalisée",
        canonicalValue: 3,
        confidence: 0.96,
        evidence: "dispose d'une politique environnementale formalisée et signée par la direction"
      },
      "E-ENER-001": {
        rawValue: "La consommation énergétique est suivie chaque mois dans un tableau de bord",
        canonicalValue: 4,
        confidence: 0.94,
        evidence: "La consommation énergétique est suivie chaque mois dans un tableau de bord"
      },
      "E-GHG-001": {
        rawValue: "Aucun bilan des émissions de gaz à effet de serre n'a encore été réalisé",
        canonicalValue: 0,
        confidence: 0.97,
        evidence: "Aucun bilan des émissions de gaz à effet de serre n'a encore été réalisé"
      },
      "S-OHS-001": {
        rawValue: "Un système de santé et sécurité est en cours de mise en place",
        canonicalValue: "WIP",
        confidence: 0.95,
        evidence: "Un système de santé et sécurité est en cours de mise en place"
      },
      "G-BOARD-001": {
        rawValue: "Oui",
        canonicalValue: null,
        confidence: 0.91,
        evidence: "Oui"
      }
    },
    profile: {}
  };

  var result = normaliserResultatHumbleOSESg_(
    fakeContent,
    source,
    "test-esg.txt",
    "TEST_LOCAL"
  );

  var errors = [];

  function expectStatus_(id, status, canonicalValue) {
    var item = result.questions[id];

    if (!item) {
      errors.push(id + " absent.");
      return;
    }

    if (item.status !== status) {
      errors.push(id + " status attendu=" + status + " obtenu=" + item.status);
    }

    if (canonicalValue !== undefined && item.canonicalValue !== canonicalValue) {
      errors.push(id + " valeur attendue=" + canonicalValue + " obtenue=" + item.canonicalValue);
    }
  }

  expectStatus_("E-POL-001", "FOUND", 3);
  expectStatus_("E-ENER-001", "FOUND", 4);
  expectStatus_("E-GHG-001", "FOUND", 0);
  expectStatus_("S-OHS-001", "FOUND", "WIP");
  expectStatus_("G-BOARD-001", "TO_CONFIRM", null);

  if (result.analysis.questions.total !== 50) {
    errors.push("Total attendu=50 obtenu=" + result.analysis.questions.total);
  }
  if (result.analysis.questions.found !== 4) {
    errors.push("FOUND attendu=4 obtenu=" + result.analysis.questions.found);
  }
  if (result.analysis.questions.toConfirm !== 1) {
    errors.push("TO_CONFIRM attendu=1 obtenu=" + result.analysis.questions.toConfirm);
  }
  if (result.analysis.questions.missing !== 45) {
    errors.push("MISSING attendu=45 obtenu=" + result.analysis.questions.missing);
  }

  Logger.log(JSON.stringify(result.analysis, null, 2));

  if (errors.length > 0) {
    throw new Error("TEST ESG HUMBLEOS EXTRACTOR LOCAL ÉCHOUÉ : " + errors.join(" | "));
  }

  Logger.log("========================================");
  Logger.log("✅ ESG HUMBLEOS EXTRACTOR LOCAL VALIDÉ");
  Logger.log("FOUND : 4");
  Logger.log("TO_CONFIRM : 1");
  Logger.log("MISSING : 45");
  Logger.log("========================================");

  return {
    success: true,
    found: 4,
    toConfirm: 1,
    missing: 45
  };
}

function TEST_ESG_CONNEXION_HUMBLEOS() {
  if (typeof verifierConnexionHumbleOS === "function") {
    return verifierConnexionHumbleOS();
  }

  if (typeof appelerHumbleOS_ !== "function") {
    throw new Error("Bridge HumbleOS absent.");
  }

  var result = appelerHumbleOS_("/health", "get");
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
