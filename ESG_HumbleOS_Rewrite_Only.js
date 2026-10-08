/**
 * ============================================================
 * AFRIGREEN24 — ESG HUMBLEOS REWRITE ONLY
 * VERSION 1.1.0 — ONE SHOT FINAL
 * ============================================================
 *
 * Rôle :
 * - Apps Script reste la source de vérité.
 * - HumbleOS reformule uniquement des textes déjà produits.
 * - 1 requête HTTP maximum par génération.
 * - 0 retry.
 * - Safe fallback bloc par bloc.
 *
 * Propriétés Apps Script attendues :
 * - HUMBLEOS_URL
 * - HUMBLEOS_API_KEY
 *
 * Endpoint attendu :
 * POST {HUMBLEOS_URL}/esg-report-rewrite
 */

var ESG_REWRITE_CONFIG = {
  inputSchema:
    "esg_report_rewrite_input_v1",

  outputSchema:
    "esg_report_rewrite_output_v1",

  endpointPath:
    "/esg-report-rewrite"
};


/**
 * Clone JSON pour séparer strictement :
 * vérité déterministe / présentation rédactionnelle.
 */
function clonerObjetESGRewrite_(
  objet
) {
  if (
    objet === undefined ||
    objet === null
  ) {
    return objet;
  }

  return JSON.parse(
    JSON.stringify(
      objet
    )
  );
}


/**
 * Construit la liste des champs rédactionnels autorisés.
 *
 * IMPORTANT :
 * aucune donnée structurée ne part ici.
 */
function buildESGReportTextModel_(
  profil,
  analyseESG,
  diagnosticDigital
) {
  profil = profil || {};
  analyseESG = analyseESG || {};
  diagnosticDigital = diagnosticDigital || {};

  var diagnostic =
    analyseESG.diagnostic || {};

  var recommandations =
    analyseESG.recommandations || {};

  var blocks = [];

  function pushBlock(
    id,
    texte
  ) {
    texte =
      String(
        texte || ""
      ).trim();

    if (
      !id ||
      !texte
    ) {
      return;
    }

    blocks.push({
      id: id,
      text: texte
    });
  }

  /*
   * 1. Résumé exécutif — construit uniquement à partir
   *    des résultats déterministes.
   */
  pushBlock(
    "executive_summary",
    construireResumeExecutifFactuelESGRewrite_(
      diagnostic
    )
  );

  /*
   * 2. Lecture du score global.
   */
  pushBlock(
    "global_score_interpretation",
    construireLectureScoreGlobalFactuelleESGRewrite_(
      diagnostic
    )
  );

  /*
   * 3. Justification du risque déjà calculée par Apps Script.
   */
  if (
    diagnostic.risque &&
    diagnostic.risque.justification
  ) {
    pushBlock(
      "risk_justification",
      diagnostic
        .risque
        .justification
    );
  }

  /*
   * 4. Analyses des quatre piliers.
   *
   * HumbleOS ne reçoit qu'une base factuelle :
   * score, complétude et alertes.
   * Il ne calcule ni ne déduit aucun score.
   */
  [
    "E",
    "S",
    "G",
    "R"
  ].forEach(
    function(codePilier) {
      pushBlock(
        "pillar_" +
        codePilier +
        "_analysis",
        construireAnalysePilierFactuelleESGRewrite_(
          diagnostic,
          codePilier
        )
      );
    }
  );

  /*
   * 5. Forces déjà déterminées.
   */
  (
    recommandations.forces ||
    []
  ).forEach(
    function(force, index) {
      pushBlock(
        "strength_" +
        (index + 1) +
        "_description",
        force &&
        force.description
      );
    }
  );

  /*
   * 6. Conseil d'ajustement principal déjà déterminé.
   *
   * HumbleOS peut uniquement le reformuler.
   */
  if (
    recommandations.prioritePrincipale &&
    recommandations.prioritePrincipale.action
  ) {
    pushBlock(
      "main_adjustment_advice",
      recommandations
        .prioritePrincipale
        .action
    );
  }

  /*
   * 7. Conseils liés aux points de vigilance déjà déterminés.
   */
  (
    recommandations.faiblesses ||
    []
  ).forEach(
    function(faiblesse, index) {
      pushBlock(
        "weakness_" +
        (index + 1) +
        "_adjustment",
        faiblesse &&
        faiblesse.recommandation
      );
    }
  );

  /*
   * 8. Alertes et éventuels conseils associés,
   *    uniquement lorsqu'ils existent déjà.
   */
  var alertes =
    diagnostic.alertesAvancees ||
    diagnostic.alertesCritiques ||
    [];

  alertes.forEach(
    function(alerte, index) {
      pushBlock(
        "alert_" +
        (index + 1) +
        "_message",
        alerte &&
        alerte.message
      );

      pushBlock(
        "alert_" +
        (index + 1) +
        "_adjustment",
        alerte &&
        (
          alerte.immediateAction ||
          alerte.recommandation
        )
      );
    }
  );

  /*
   * 9. Interprétation numérique.
   */
  pushBlock(
    "digital_interpretation",
    construireInterpretationNumeriqueFactuelleESGRewrite_(
      diagnosticDigital
    )
  );

  /*
   * 10. Leviers numériques déterministes.
   *     Ils restent des conseils ESG/données, jamais des offres.
   */
  (
    diagnosticDigital.recommandations ||
    []
  ).forEach(
    function(recommandation, index) {
      pushBlock(
        "digital_adjustment_" +
        (index + 1),
        recommandation
      );
    }
  );

  /*
   * 11. Conclusion factuelle.
   */
  pushBlock(
    "institutional_conclusion",
    construireConclusionFactuelleESGRewrite_(
      profil,
      diagnostic
    )
  );

  return {
    organization_name:
      profil.organizationName ||
      profil.nomOrganisation ||
      "",

    blocks:
      blocks
  };
}


function construireResumeExecutifFactuelESGRewrite_(
  diagnostic
) {
  diagnostic = diagnostic || {};

  var scores = diagnostic.scores || {};
  var maturite = diagnostic.maturite || {};
  var risque = diagnostic.risque || {};

  var score =
    scores.globalAjuste !== undefined &&
    scores.globalAjuste !== null
      ? scores.globalAjuste
      : 0;

  var maturiteLabel =
    maturite.label ||
    "niveau non déterminé";

  var risqueLabel =
    risque.label ||
    "niveau non déterminé";

  var alertes = Number(
    diagnostic.nombreAlertesCritiques ||
    (
      diagnostic.alertesAvancees
        ? diagnostic.alertesAvancees.length
        : diagnostic.alertesCritiques
          ? diagnostic.alertesCritiques.length
          : 0
    ) ||
    0
  );

  var preuves =
    scores.preuves !== undefined &&
    scores.preuves !== null
      ? scores.preuves
      : 0;

  var qualite =
    scores.qualiteDonnees !== undefined &&
    scores.qualiteDonnees !== null
      ? scores.qualiteDonnees
      : 0;

  return (
    "L’organisation présente un score ESG ajusté de " +
    score +
    "/100, correspondant au niveau « " +
    maturiteLabel +
    " ». Le niveau de risque observé est « " +
    risqueLabel +
    " ». Le diagnostic recense " +
    alertes +
    " alerte(s) critique(s) ou prioritaire(s). " +
    "Le score de disponibilité des preuves est de " +
    preuves +
    "/100 et la qualité des données est évaluée à " +
    qualite +
    "/100."
  );
}



/**
 * Lecture factuelle du score global destinée à être reformulée.
 */
function construireLectureScoreGlobalFactuelleESGRewrite_(
  diagnostic
) {
  diagnostic = diagnostic || {};

  var scores =
    diagnostic.scores || {};

  var maturite =
    diagnostic.maturite || {};

  var risque =
    diagnostic.risque || {};

  var score =
    scores.globalAjuste !== undefined &&
    scores.globalAjuste !== null
      ? scores.globalAjuste
      : 0;

  var maturiteLabel =
    maturite.label ||
    "niveau non déterminé";

  var risqueLabel =
    risque.label ||
    "niveau non déterminé";

  return (
    "Le diagnostic situe l’organisation au niveau « " +
    maturiteLabel +
    " », avec un score ESG ajusté de " +
    score +
    "/100 et un niveau de risque « " +
    risqueLabel +
    " »."
  );
}


/**
 * Base factuelle d'analyse d'un pilier.
 *
 * Aucun jugement nouveau n'est créé ici :
 * Apps Script transmet seulement les valeurs déjà calculées.
 */
function construireAnalysePilierFactuelleESGRewrite_(
  diagnostic,
  codePilier
) {
  diagnostic = diagnostic || {};

  var piliers =
    diagnostic.piliers || {};

  var pilier =
    piliers[codePilier];

  if (!pilier) {
    return "";
  }

  var label =
    pilier.label ||
    codePilier;

  var score =
    pilier.scoreAjuste !== undefined &&
    pilier.scoreAjuste !== null
      ? pilier.scoreAjuste
      : 0;

  var repondues =
    Number(
      pilier.nombreRepondues || 0
    );

  var manquantes =
    Number(
      pilier.nombreManquantes || 0
    );

  var alertes =
    Number(
      pilier.nombreAlertesCritiques || 0
    );

  return (
    "Le pilier " +
    label +
    " obtient un score ajusté de " +
    score +
    "/100. L’évaluation porte sur " +
    repondues +
    " réponse(s) renseignée(s), avec " +
    manquantes +
    " donnée(s) manquante(s) et " +
    alertes +
    " alerte(s) critique(s) identifiée(s). " +
    "Les résultats détaillés par thème et les niveaux de preuve associés sont présentés dans le tableau ci-dessous."
  );
}


/**
 * Conclusion strictement factuelle.
 */
function construireConclusionFactuelleESGRewrite_(
  profil,
  diagnostic
) {
  profil = profil || {};
  diagnostic = diagnostic || {};

  var organisation =
    profil.organizationName ||
    profil.nomOrganisation ||
    "L’organisation";

  var scores =
    diagnostic.scores || {};

  var maturite =
    diagnostic.maturite || {};

  var risque =
    diagnostic.risque || {};

  return (
    organisation +
    " présente un score ESG ajusté de " +
    (
      scores.globalAjuste !== undefined &&
      scores.globalAjuste !== null
        ? scores.globalAjuste
        : 0
    ) +
    "/100, correspondant au niveau de maturité « " +
    (
      maturite.label ||
      "niveau non déterminé"
    ) +
    " » et au niveau de risque « " +
    (
      risque.label ||
      "niveau non déterminé"
    ) +
    " »."
  );
}


function construireInterpretationNumeriqueFactuelleESGRewrite_(
  diagnosticDigital
) {
  diagnosticDigital =
    diagnosticDigital || {};

  var score =
    Number(
      diagnosticDigital.scoreGlobal ||
      0
    );

  var niveau =
    diagnosticDigital.niveau &&
    diagnosticDigital.niveau.label
      ? diagnosticDigital.niveau.label
      : "niveau non déterminé";

  var details =
    diagnosticDigital.detailScores ||
    {};

  return (
    "La transparence numérique ESG de l’organisation obtient un score de " +
    score +
    "/100, correspondant au niveau « " +
    niveau +
    " ». Les sous-scores observés sont de " +
    Number(details.siteWeb || 0) +
    "/100 pour le site internet et la publication ESG, " +
    Number(details.linkedin || 0) +
    "/100 pour LinkedIn et la présence professionnelle, " +
    Number(details.communicationESG || 0) +
    "/100 pour la communication ESG et " +
    Number(details.automatisation || 0) +
    "/100 pour la collecte et le suivi numérique."
  );
}


function ajouterActionsModeleESGRewrite_(
  blocks,
  prefixe,
  actions
) {
  (
    actions ||
    []
  ).forEach(
    function(action, index) {
      var texte =
        action &&
        action.action;

      if (
        texte
      ) {
        blocks.push({
          id:
            "action_" +
            prefixe +
            "_" +
            (index + 1),
          text:
            String(
              texte
            ).trim()
        });
      }

      if (
        action &&
        action.preuveDeRealisation
      ) {
        blocks.push({
          id:
            "action_" +
            prefixe +
            "_" +
            (index + 1) +
            "_evidence",
          text:
            String(
              action.preuveDeRealisation
            ).trim()
        });
      }
    }
  );
}


/**
 * Payload minimal HumbleOS.
 */
function buildESGRewritePayload_(
  modele
) {
  modele = modele || {};

  var ids = {};

  var texts =
    (
      modele.blocks ||
      []
    )
      .map(
        function(block) {
          return {
            id:
              String(
                block.id || ""
              ).trim(),

            text:
              String(
                block.text || ""
              ).trim()
          };
        }
      )
      .filter(
        function(block) {
          if (
            !block.id ||
            !block.text
          ) {
            return false;
          }

          if (
            ids[
              block.id
            ]
          ) {
            throw new Error(
              "ID ESG Rewrite dupliqué : " +
              block.id
            );
          }

          ids[
            block.id
          ] = true;

          return true;
        }
      );

  return {
    schema_version:
      ESG_REWRITE_CONFIG
        .inputSchema,

    language:
      "fr",

    texts:
      texts
  };
}

/**
 * ============================================================
 * PROTECTION DÉTERMINISTE DES FAITS NUMÉRIQUES
 * ============================================================
 *
 * IMPORTANT : ces fonctions sont l'UNIQUE implémentation de
 * protection ESG Rewrite dans le projet Apps Script.
 * Code.gs ne doit pas redéfinir ces fonctions.
 */

function protectESGRewriteFacts_(text) {
  text = String(text || "");

  if (!text.trim()) {
    return {
      protectedText: text,
      replacements: {}
    };
  }

  /*
   * Si ce marqueur est déjà présent, le texte est déjà protégé.
   * On bloque explicitement une seconde protection plutôt que de
   * créer des tokens imbriqués (__AG_KEEP_001__ contient lui-même
   * des chiffres et ne doit jamais repasser dans le regex).
   */
  if (/__AG_KEEP_\d{3}__/.test(text)) {
    throw new Error(
      "ESG Rewrite — double protection détectée."
    );
  }

  var regex =
    /(-?\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?)|(-?\d+(?:[.,]\d+)?\s*%)|(\$\s*-?\d+(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?\s*[$€£])|(\d{1,4}[-./]\d{1,2}[-./]\d{1,4})|(-?\d+(?:[.,]\d+)?)/g;

  var matches = [];
  var match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  var replacements = {};
  var result = text;

  /*
   * Remplacement de droite à gauche : aucune gestion d'offset,
   * donc aucun risque de décalage entre les positions collectées.
   */
  for (var index = matches.length - 1; index >= 0; index--) {
    var token =
      "__AG_KEEP_" +
      String(index + 1).padStart(3, "0") +
      "__";

    replacements[token] =
      matches[index].value;

    result =
      result.substring(0, matches[index].start) +
      token +
      result.substring(matches[index].end);
  }

  return {
    protectedText: result,
    replacements: replacements
  };
}


function protectPayloadESGRewrite_(payload) {
  payload = payload || {};

  var replacementsById = {};

  var protectedTexts =
    (payload.texts || []).map(
      function(item) {
        var id =
          String(item && item.id || "").trim();

        var source =
          String(item && item.text || "");

        var protection =
          protectESGRewriteFacts_(source);

        replacementsById[id] =
          protection.replacements;

        return {
          id: id,
          text: protection.protectedText
        };
      }
    );

  return {
    protectedPayload: {
      schema_version: payload.schema_version,
      language: payload.language,
      texts: protectedTexts
    },
    replacementsById: replacementsById
  };
}


function restoreESGRewriteFacts_(
  rewrittenText,
  replacements
) {
  var text = String(rewrittenText || "");
  replacements = replacements || {};

  var tokens = Object.keys(replacements);
  var errors = [];

  tokens.forEach(
    function(token) {
      var count =
        text.split(token).length - 1;

      if (count === 0) {
        errors.push(
          "Token manquant : " + token
        );
      } else if (count !== 1) {
        errors.push(
          "Token dupliqué : " +
          token +
          " (" + count + " occurrences)"
        );
      }
    }
  );

  var foundTokens =
    text.match(/__AG_KEEP_\d{3}__/g) || [];

  foundTokens.forEach(
    function(token) {
      if (
        !Object.prototype.hasOwnProperty.call(
          replacements,
          token
        )
      ) {
        errors.push(
          "Token inattendu : " + token
        );
      }
    }
  );

  if (errors.length) {
    return {
      valid: false,
      reason:
        "RESTORE_FAILED: " +
        errors.join("; "),
      restored: ""
    };
  }

  var restored = text;

  tokens.forEach(
    function(token) {
      restored =
        restored.split(token).join(
          String(replacements[token])
        );
    }
  );

  return {
    valid: true,
    reason: "",
    restored: restored
  };
}


function restoreOutputESGRewrite_(
  output,
  replacementsById
) {
  output = output || {};
  replacementsById = replacementsById || {};

  var failedIds = [];

  var texts =
    (output.texts || []).map(
      function(item) {
        var id =
          String(item && item.id || "").trim();

        var rewritten =
          String(
            item && item.rewritten_text || ""
          );

        var restoration =
          restoreESGRewriteFacts_(
            rewritten,
            replacementsById[id] || {}
          );

        if (restoration.valid !== true) {
          failedIds.push(id);

          console.log(
            JSON.stringify({
              event:
                "esg_rewrite_restore_failed",
              id: id,
              reason: restoration.reason
            })
          );

          return {
            id: id,
            rewritten_text: ""
          };
        }

        return {
          id: id,
          rewritten_text: restoration.restored
        };
      }
    );

  return {
    output: {
      schema_version: output.schema_version,
      texts: texts
    },
    failed_ids: failedIds
  };
}



/**
 * Appel unique HumbleOS.
 *
 * Aucun retry ici.
 */
function callHumbleOSESGRewrite_(
  payload
) {
  var proprietes =
    PropertiesService
      .getScriptProperties();

  var baseUrl =
    proprietes.getProperty(
      "HUMBLEOS_URL"
    );

  var apiKey =
    proprietes.getProperty(
      "HUMBLEOS_API_KEY"
    );

  if (
    !baseUrl
  ) {
    throw new Error(
      "HUMBLEOS_URL non configurée."
    );
  }

  if (
    !/^https?:\/\//i.test(
      baseUrl
    )
  ) {
    throw new Error(
      "HUMBLEOS_URL invalide."
    );
  }

  if (
    !apiKey
  ) {
    throw new Error(
      "HUMBLEOS_API_KEY non configurée."
    );
  }

  var endpoint =
    obtenirEndpointESGRewrite_(
      baseUrl
    );

  var reponse =
    UrlFetchApp.fetch(
      endpoint,
      {
        method:
          "post",

        contentType:
          "application/json",

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true,

        followRedirects:
          false,

        headers: {
          Accept:
            "application/json",

          Authorization:
            "Bearer " +
            apiKey,

          "X-AfriGreen-Secret":
            apiKey
        }
      }
    );

  var status =
    reponse.getResponseCode();

  var texte =
    reponse.getContentText();

  if (
    status < 200 ||
    status >= 300
  ) {
    throw new Error(
      "HumbleOS ESG HTTP " +
      status +
      " : " +
      String(
        texte || ""
      ).substring(
        0,
        1500
      )
    );
  }

  return extraireESGRewriteOutput_(
    texte
  );
}


function obtenirEndpointESGRewrite_(
  baseUrl
) {
  var clean =
    String(
      baseUrl
    ).replace(
      /\/+$/,
      ""
    );

  if (
    /\/esg-report-rewrite$/i.test(
      clean
    )
  ) {
    return clean;
  }

  return (
    clean +
    ESG_REWRITE_CONFIG
      .endpointPath
  );
}


/**
 * Tolère les enveloppes HTTP usuelles mais exige
 * ensuite le contrat ESG exact.
 */
function extraireESGRewriteOutput_(
  responseText
) {
  var data;

  try {
    data =
      JSON.parse(
        responseText
      );
  } catch (
    erreur
  ) {
    throw new Error(
      "HumbleOS ESG a répondu avec un JSON HTTP invalide."
    );
  }

  var candidats = [
    data,
    data && data.output,
    data && data.result,
    data && data.data
  ];

  for (
    var index = 0;
    index < candidats.length;
    index++
  ) {
    var candidat =
      candidats[index];

    if (
      candidat &&
      candidat.schema_version ===
        ESG_REWRITE_CONFIG
          .outputSchema
    ) {
      return candidat;
    }
  }

  throw new Error(
    "Format de réponse HumbleOS ESG Rewrite non reconnu."
  );
}


/**
 * Validation déterministe du contrat.
 */
function validateESGRewriteOutput_(
  inputPayload,
  output
) {
  var errors = [];

  if (
    !output ||
    typeof output !==
      "object"
  ) {
    return {
      valid: false,
      errors: [
        "La réponse ESG Rewrite est vide."
      ]
    };
  }

  if (
    output.schema_version !==
    ESG_REWRITE_CONFIG
      .outputSchema
  ) {
    errors.push(
      "Schema ESG Rewrite incorrect."
    );
  }

  if (
    !Array.isArray(
      output.texts
    )
  ) {
    errors.push(
      "output.texts doit être un tableau."
    );

    return {
      valid:
        false,

      errors:
        errors
    };
  }

  var inputIds = {};
  var outputIds = {};

  (
    inputPayload.texts ||
    []
  ).forEach(
    function(item) {
      inputIds[
        String(
          item.id
        )
      ] = true;
    }
  );

  output.texts.forEach(
    function(item, index) {
      if (
        !item ||
        typeof item !==
          "object"
      ) {
        errors.push(
          "Bloc output invalide à l’index " +
          index +
          "."
        );
        return;
      }

      var id =
        String(
          item.id || ""
        ).trim();

      if (
        !id
      ) {
        errors.push(
          "ID manquant à l’index " +
          index +
          "."
        );
        return;
      }

      if (
        outputIds[id]
      ) {
        errors.push(
          "ID dupliqué : " +
          id
        );
      }

      outputIds[id] = true;

      if (
        typeof item.rewritten_text !==
          "string" ||
        !item.rewritten_text.trim()
      ) {
        errors.push(
          "rewritten_text vide : " +
          id
        );
      }
    }
  );

  Object.keys(
    inputIds
  ).forEach(
    function(id) {
      if (
        !outputIds[id]
      ) {
        errors.push(
          "ID manquant : " +
          id
        );
      }
    }
  );

  Object.keys(
    outputIds
  ).forEach(
    function(id) {
      if (
        !inputIds[id]
      ) {
        errors.push(
          "ID supplémentaire : " +
          id
        );
      }
    }
  );

  if (
    output.texts.length !==
    (
      inputPayload.texts ||
      []
    ).length
  ) {
    errors.push(
      "Nombre de blocs différent entre entrée et sortie."
    );
  }

  return {
    valid:
      errors.length === 0,

    errors:
      errors
  };
}


/**
 * Safe fallback :
 * - chiffres inchangés ;
 * - email/URL inchangés ;
 * - nom organisation conservé s'il est présent dans la source.
 *
 * Si un bloc échoue :
 * seule sa reformulation est rejetée.
 */
function applyESGRewriteSafetyFallback_(
  inputPayload,
  output,
  profil
) {
  profil = profil || {};

  var sourceById = {};

  (
    inputPayload.texts ||
    []
  ).forEach(
    function(item) {
      sourceById[
        String(
          item.id
        )
      ] =
        String(
          item.text || ""
        );
    }
  );

  var organisation =
    String(
      profil.organizationName ||
      profil.nomOrganisation ||
      ""
    ).trim();

  var fallbackIds = [];

  var safeTexts =
    output.texts.map(
      function(item) {
        var id =
          String(
            item.id
          );

        var source =
          sourceById[id] || "";

        var rewritten =
          String(
            item.rewritten_text || ""
          ).trim();

        var safe =
          verifierFaitsESGRewrite_(
            source,
            rewritten,
            organisation
          );

        if (
          !safe.valid
        ) {
          fallbackIds.push(
            id
          );

          console.log(
            JSON.stringify({
              event: "esg_rewrite_block_fallback",
              id: id,
              reason: safe.reason || "UNKNOWN"
            })
          );

          return {
            id:
              id,

            rewritten_text:
              source
          };
        }

        return {
          id:
            id,

          rewritten_text:
            rewritten
        };
      }
    );

  return {
    output: {
      schema_version:
        ESG_REWRITE_CONFIG
          .outputSchema,

      texts:
        safeTexts
    },

    fallback_ids:
      fallbackIds
  };
}


function verifierFaitsESGRewrite_(
  source,
  rewritten,
  organisation
) {
  if (
    !rewritten
  ) {
    return {
      valid: false,
      reason: "EMPTY"
    };
  }

  if (
    organisation &&
    source.indexOf(
      organisation
    ) !== -1 &&
    rewritten.indexOf(
      organisation
    ) === -1
  ) {
    return {
      valid: false,
      reason: "ORGANIZATION_CHANGED"
    };
  }

  var sourceNumbers =
    extraireNombresESGRewrite_(
      source
    );

  var rewrittenNumbers =
    extraireNombresESGRewrite_(
      rewritten
    );

  if (
    JSON.stringify(
      sourceNumbers
    ) !==
    JSON.stringify(
      rewrittenNumbers
    )
  ) {
    return {
      valid: false,
      reason: "NUMBERS_CHANGED"
    };
  }

  var sourceEmails =
    extraireMatchesESGRewrite_(
      source,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    );

  var rewrittenEmails =
    extraireMatchesESGRewrite_(
      rewritten,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    );

  if (
    JSON.stringify(
      sourceEmails
    ) !==
    JSON.stringify(
      rewrittenEmails
    )
  ) {
    return {
      valid: false,
      reason: "EMAIL_CHANGED"
    };
  }

  var sourceUrls =
    extraireMatchesESGRewrite_(
      source,
      /https?:\/\/[^\s)]+/gi
    );

  var rewrittenUrls =
    extraireMatchesESGRewrite_(
      rewritten,
      /https?:\/\/[^\s)]+/gi
    );

  if (
    JSON.stringify(
      sourceUrls
    ) !==
    JSON.stringify(
      rewrittenUrls
    )
  ) {
    return {
      valid: false,
      reason: "URL_CHANGED"
    };
  }

  var forbiddenTerms = [
    "afrigreen24",
    "openai",
    "humbleos"
  ];

  var sourceLower =
    String(
      source || ""
    ).toLowerCase();

  var rewrittenLower =
    String(
      rewritten || ""
    ).toLowerCase();

  for (
    var forbiddenIndex = 0;
    forbiddenIndex <
      forbiddenTerms.length;
    forbiddenIndex++
  ) {
    var forbiddenTerm =
      forbiddenTerms[
        forbiddenIndex
      ];

    /*
     * Une mention interne nouvellement introduite par le provider
     * est une fuite white-label. Le bloc doit revenir à sa source
     * déterministe. Une mention déjà présente dans la source n'est
     * pas créée par l'IA ; elle sera encore contrôlée par le gate
     * final du document.
     */
    if (
      rewrittenLower.indexOf(
        forbiddenTerm
      ) !==
        -1 &&
      sourceLower.indexOf(
        forbiddenTerm
      ) ===
        -1
    ) {
      return {
        valid:
          false,

        reason:
          "WHITE_LABEL_TERM_INTRODUCED:" +
          forbiddenTerm
      };
    }
  }

  return {
    valid: true
  };
}


function extraireNombresESGRewrite_(
  texte
) {
  var matches =
    String(
      texte || ""
    ).match(
      /-?\d+(?:[.,]\d+)?/g
    ) || [];

  return matches
    .map(
      function(valeur) {
        var normalisee =
          String(
            valeur
          ).replace(
            ",",
            "."
          );

        var nombre =
          Number(
            normalisee
          );

        return Number.isFinite(
          nombre
        )
          ? String(nombre)
          : normalisee;
      }
    )
    .sort();
}


function extraireMatchesESGRewrite_(
  texte,
  regex
) {
  return (
    String(
      texte || ""
    ).match(
      regex
    ) || []
  )
    .map(
      function(valeur) {
        return String(
          valeur
        );
      }
    )
    .sort();
}


/**
 * Applique uniquement les IDs explicitement autorisés
 * sur les copies de présentation.
 */
function mergeESGRewrittenTexts_(
  analyseESGPresentation,
  diagnosticDigitalPresentation,
  safeOutput
) {
  var byId = {};

  (
    safeOutput.texts ||
    []
  ).forEach(
    function(item) {
      byId[
        String(
          item.id
        )
      ] =
        String(
          item.rewritten_text || ""
        );
    }
  );

  var diagnostic =
    analyseESGPresentation
      .diagnostic || {};

  var recommandations =
    analyseESGPresentation
      .recommandations || {};

  if (
    byId.executive_summary
  ) {
    recommandations.syntheseStrategique =
      byId.executive_summary;
  }

  if (
    byId.global_score_interpretation
  ) {
    diagnostic.lectureScoreGlobalRedactionnelle =
      byId.global_score_interpretation;
  }

  if (
    byId.risk_justification &&
    diagnostic.risque
  ) {
    diagnostic
      .risque
      .justification =
        byId.risk_justification;
  }

  /*
   * Analyses rédactionnelles des quatre piliers.
   * Les scores et tableaux structurés restent intacts.
   */
  [
    "E",
    "S",
    "G",
    "R"
  ].forEach(
    function(codePilier) {
      var id =
        "pillar_" +
        codePilier +
        "_analysis";

      if (
        byId[id] &&
        diagnostic.piliers &&
        diagnostic.piliers[codePilier]
      ) {
        diagnostic
          .piliers[
            codePilier
          ]
          .analyseRedactionnelle =
            byId[id];
      }
    }
  );

  (
    recommandations.forces ||
    []
  ).forEach(
    function(force, index) {
      var id =
        "strength_" +
        (index + 1) +
        "_description";

      if (
        byId[id]
      ) {
        force.description =
          byId[id];
      }
    }
  );

  if (
    byId.main_adjustment_advice &&
    recommandations.prioritePrincipale
  ) {
    recommandations
      .prioritePrincipale
      .action =
        byId.main_adjustment_advice;
  }

  (
    recommandations.faiblesses ||
    []
  ).forEach(
    function(faiblesse, index) {
      var id =
        "weakness_" +
        (index + 1) +
        "_adjustment";

      if (
        byId[id]
      ) {
        faiblesse.recommandation =
          byId[id];
      }
    }
  );

  var alertes =
    diagnostic.alertesAvancees ||
    diagnostic.alertesCritiques ||
    [];

  alertes.forEach(
    function(alerte, index) {
      var messageId =
        "alert_" +
        (index + 1) +
        "_message";

      var adjustmentId =
        "alert_" +
        (index + 1) +
        "_adjustment";

      if (
        byId[messageId]
      ) {
        alerte.message =
          byId[messageId];
      }

      if (
        byId[adjustmentId]
      ) {
        if (
          alerte.immediateAction !==
          undefined
        ) {
          alerte.immediateAction =
            byId[adjustmentId];
        } else if (
          alerte.recommandation !==
          undefined
        ) {
          alerte.recommandation =
            byId[adjustmentId];
        }
      }
    }
  );

  if (
    diagnosticDigitalPresentation &&
    diagnosticDigitalPresentation.resume &&
    byId.digital_interpretation
  ) {
    diagnosticDigitalPresentation
      .resume
      .message =
        byId.digital_interpretation;
  }

  if (
    diagnosticDigitalPresentation &&
    Array.isArray(
      diagnosticDigitalPresentation.recommandations
    )
  ) {
    diagnosticDigitalPresentation
      .recommandations
      .forEach(
        function(recommandation, index) {
          var id =
            "digital_adjustment_" +
            (index + 1);

          if (
            byId[id]
          ) {
            diagnosticDigitalPresentation
              .recommandations[
                index
              ] =
                byId[id];
          }
        }
      );
  }

  if (
    byId.institutional_conclusion
  ) {
    diagnostic.conclusionRedactionnelle =
      byId.institutional_conclusion;
  }

  analyseESGPresentation.diagnostic =
    diagnostic;

  analyseESGPresentation.recommandations =
    recommandations;

  return {
    analyseESG:
      analyseESGPresentation,

    diagnosticDigital:
      diagnosticDigitalPresentation
  };
}


function fusionnerActionsESGRewrite_(
  actions,
  prefixe,
  byId
) {
  (
    actions ||
    []
  ).forEach(
    function(action, index) {
      var baseId =
        "action_" +
        prefixe +
        "_" +
        (index + 1);

      if (
        byId[baseId]
      ) {
        action.action =
          byId[baseId];
      }

      if (
        byId[
          baseId +
          "_evidence"
        ]
      ) {
        action.preuveDeRealisation =
          byId[
            baseId +
            "_evidence"
          ];
      }
    }
  );
}


/**
 * Test local gratuit : aucune requête HumbleOS.
 */
function TEST_ESG_REWRITE_WHITE_LABEL_FALLBACK_LOCAL() {
  var input = {
    schema_version:
      ESG_REWRITE_CONFIG
        .inputSchema,

    language:
      "fr",

    texts: [
      {
        id:
          "legacy_white_label_test",

        text:
          "L’organisation doit renforcer le suivi de ses données ESG."
      }
    ]
  };

  var output = {
    schema_version:
      ESG_REWRITE_CONFIG
        .outputSchema,

    texts: [
      {
        id:
          "legacy_white_label_test",

        rewritten_text:
          "AfriGreen24 recommande de renforcer le suivi de ses données ESG."
      }
    ]
  };

  var result =
    applyESGRewriteSafetyFallback_(
      input,
      output,
      {
        organizationName:
          "Organisation Test"
      }
    );

  return {
    success:
      result
        .fallback_ids
        .length ===
        1 &&
      result
        .fallback_ids[0] ===
        "legacy_white_label_test" &&
      result
        .output
        .texts[0]
        .rewritten_text ===
        input
          .texts[0]
          .text,

    result:
      result
  };
}


function TEST_ESG_REWRITE_FACT_PROTECTION_LOCAL() {
  var tests = [];

  function assert_(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function run_(name, fn) {
    try {
      fn();
      tests.push({ name: name, ok: true });
    } catch (error) {
      tests.push({
        name: name,
        ok: false,
        error: error.message
      });
    }
  }

  run_("60/100", function() {
    var p = protectESGRewriteFacts_("Score 60/100.");
    var r = restoreESGRewriteFacts_(p.protectedText, p.replacements);
    assert_(r.valid && r.restored === "Score 60/100.", "Restauration score");
  });

  run_("89.54/100", function() {
    var p = protectESGRewriteFacts_("Confiance 89.54/100.");
    var r = restoreESGRewriteFacts_(p.protectedText, p.replacements);
    assert_(r.valid && r.restored === "Confiance 89.54/100.", "Restauration décimale");
  });

  run_("70,02/100", function() {
    var p = protectESGRewriteFacts_("Preuves 70,02/100.");
    var r = restoreESGRewriteFacts_(p.protectedText, p.replacements);
    assert_(r.valid && r.restored === "Preuves 70,02/100.", "Restauration virgule");
  });

  run_("0 alerte", function() {
    var p = protectESGRewriteFacts_("0 alerte critique.");
    var r = restoreESGRewriteFacts_(p.protectedText, p.replacements);
    assert_(r.valid && r.restored === "0 alerte critique.", "Restauration zéro");
  });

  run_("plusieurs faits", function() {
    var source = "Score 60/100, preuves 70.02/100, confiance 89.54/100 et 0 alerte.";
    var p = protectESGRewriteFacts_(source);
    var r = restoreESGRewriteFacts_(p.protectedText, p.replacements);
    assert_(r.valid && r.restored === source, "Restauration multiple");
    assert_(Object.keys(p.replacements).length === 4, "Nombre de tokens incorrect");
  });

  run_("token manquant", function() {
    var r = restoreESGRewriteFacts_(
      "Score supprimé.",
      { "__AG_KEEP_001__": "60/100" }
    );
    assert_(r.valid === false, "Token manquant accepté");
  });

  run_("token dupliqué", function() {
    var r = restoreESGRewriteFacts_(
      "__AG_KEEP_001__ puis __AG_KEEP_001__",
      { "__AG_KEEP_001__": "60/100" }
    );
    assert_(r.valid === false, "Token dupliqué accepté");
  });

  run_("double protection bloquée", function() {
    var p = protectESGRewriteFacts_("Score 60/100.");
    var rejected = false;
    try {
      protectESGRewriteFacts_(p.protectedText);
    } catch (error) {
      rejected = true;
    }
    assert_(rejected, "Double protection non détectée");
  });

  run_("payload sans map", function() {
    var input = {
      schema_version: ESG_REWRITE_CONFIG.inputSchema,
      language: "fr",
      texts: [{ id: "x", text: "Score 60/100." }]
    };
    var p = protectPayloadESGRewrite_(input);
    var serialized = JSON.stringify(p.protectedPayload);
    assert_(serialized.indexOf("replacements") === -1, "Map envoyée au modèle");
    assert_(serialized.indexOf("__AG_KEEP_001__") !== -1, "Token absent");
  });

  var failed = tests.filter(function(item) { return item.ok !== true; });

  console.log(JSON.stringify({
    event: "esg_rewrite_fact_tests",
    total: tests.length,
    passed: tests.length - failed.length,
    failed: failed.length,
    results: tests
  }));

  if (failed.length) {
    throw new Error(
      "Tests ESG protection échoués : " +
      failed.map(function(item) { return item.name + ": " + item.error; }).join(" | ")
    );
  }

  return {
    success: true,
    total: tests.length,
    passed: tests.length
  };
}
