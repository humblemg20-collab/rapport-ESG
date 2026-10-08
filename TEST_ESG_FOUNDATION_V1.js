/**
 * ============================================================
 * AFRIGREEN24 — TESTS FONDATION ESG V1
 * ============================================================
 *
 * IMPORTANT :
 * - TEST_ESG_FOUNDATION_V1_LOCAL : 0 appel réseau.
 * - les fonctions *_REAL consomment réellement les providers.
 * - aucune fonction réelle n'est appelée automatiquement.
 */


/**
 * Suite locale : aucun appel OpenAI / HumbleOS.
 */
function TEST_ESG_FOUNDATION_V1_LOCAL() {
  var tests = [
    {
      name:
        "AI_CONFIG",
      run:
        TEST_ESG_AI_CONFIG_V1_LOCAL
    },
    {
      name:
        "OPENAI_SCHEMAS",
      run:
        TEST_ESG_OPENAI_SCHEMA_LOCAL
    },
    {
      name:
        "AI_GATEWAY_CONTRACT",
      run:
        TEST_ESG_AI_GATEWAY_CONTRACT_LOCAL
    },
    {
      name:
        "INTAKE_PROVENANCE",
      run:
        TEST_ESG_INTAKE_PROVENANCE_V1_LOCAL
    },
    {
      name:
        "DATA_STATUS",
      run:
        TEST_ESG_DATA_STATUS_V1_LOCAL
    },
    {
      name:
        "REPORT_SCHEMA",
      run:
        TEST_ESG_REPORT_SCHEMA_V1_LOCAL
    },
    {
      name:
        "SCHEMA_VALIDATOR",
      run:
        TEST_ESG_SCHEMA_VALIDATOR_V1_LOCAL
    },
    {
      name:
        "LEGACY_ADAPTER",
      run:
        TEST_ESG_LEGACY_ADAPTER_V1_LOCAL
    },
    {
      name:
        "WHITE_LABEL_TEXT",
      run:
        TEST_ESG_WHITE_LABEL_TEXT_LOCAL
    },
    {
      name:
        "EVIDENCE_REPOSITORY_HASH",
      run:
        TEST_ESG_EVIDENCE_REPOSITORY_HASH_LOCAL
    },
    {
      name:
        "EVIDENCE_ENGINE_RULES",
      run:
        TEST_ESG_EVIDENCE_ENGINE_RULES_LOCAL
    },
    {
      name:
        "DATA_QUALITY_ENGINE",
      run:
        TEST_ESG_DATA_QUALITY_ENGINE_V1_LOCAL
    },
    {
      name:
        "BLOCK_REGISTRY",
      run:
        TEST_ESG_BLOCK_REGISTRY_V1_LOCAL
    },
    {
      name:
        "VISUALIZATION_RULES",
      run:
        TEST_ESG_VISUALIZATION_RULES_V1_LOCAL
    },
    {
      name:
        "SNAPSHOT_COMPOSITION",
      run:
        TEST_ESG_SNAPSHOT_COMPOSITION_V1_LOCAL
    },
    {
      name:
        "QUALITY_GATE_ENGINE",
      run:
        TEST_ESG_QUALITY_GATE_ENGINE_V1_LOCAL
    },
    {
      name:
        "EDITORIAL_CONTENT_ENGINE_V2",
      run:
        TEST_ESG_EDITORIAL_CONTENT_ENGINE_V2_LOCAL
    },
    {
      name:
        "PRESENTATION_PROFILE_V2",
      run:
        TEST_ESG_PRESENTATION_PROFILE_V2_LOCAL
    },
    {
      name:
        "PREMIUM_RENDERER_CLIENT_V2",
      run:
        TEST_ESG_PREMIUM_RENDERER_CLIENT_V2_LOCAL
    },
    {
      name:
        "PREMIUM_REPORT_ENGINE_V2",
      run:
        TEST_ESG_PREMIUM_REPORT_ENGINE_V2_LOCAL
    },
    {
      name:
        "REPORT_ENGINE_ROUTER",
      run:
        TEST_ESG_REPORT_ENGINE_ROUTER_LOCAL
    },
    {
      name:
        "IMPORT_SCHEMA",
      run:
        TEST_ESG_IMPORT_SCHEMA_LOCAL
    },
    {
      name:
        "CANONICAL_NORMALIZER",
      run:
        TEST_ESG_NORMALISATION_CANONIQUE_LOCALE
    },
    {
      name:
        "STRUCTURED_FACT_GUARD",
      run:
        TEST_ESG_STRUCTURED_FACT_GUARD_LOCAL
    }
  ];

  var results = [];
  var errors = [];

  tests.forEach(
    function(test) {
      try {
        var result =
          test.run();

        var success =
          result &&
          result.success ===
            true;

        results.push({
          name:
            test.name,

          success:
            success,

          result:
            result
        });

        if (!success) {
          errors.push(
            test.name
          );
        }

      } catch (error) {
        var message =
          error &&
          error.message
            ? error.message
            : String(
                error
              );

        results.push({
          name:
            test.name,

          success:
            false,

          error:
            message
        });

        errors.push(
          test.name +
          ": " +
          message
        );
      }
    }
  );

  Logger.log(
    JSON.stringify(
      {
        event:
          "ESG_FOUNDATION_V1_LOCAL_TEST",

        success:
          errors.length ===
          0,

        tests:
          results
      },
      null,
      2
    )
  );

  if (
    errors.length
  ) {
    throw new Error(
      "ESG_FOUNDATION_V1_LOCAL_FAILED: " +
      errors.join(
        " | "
      )
    );
  }

  return {
    success:
      true,

    testCount:
      results.length,

    results:
      results
  };
}


/**
 * Test réel OPENAI PRIMARY pour l'extraction.
 *
 * Pré-requis Script Properties :
 * OPENAI_API_KEY
 * OPENAI_ESG_EXTRACT_MODEL (optionnel)
 */
/**
 * Test réel du renderer Snapshot V1.
 * Produit réellement un Google Doc + PDF et exige OpenAI PRIMARY.
 */
function TEST_ESG_SNAPSHOT_PDF_REAL() {
  return TEST_ESG_SNAPSHOT_RENDERER_REAL_OPENAI();
}


function TEST_ESG_OPENAI_EXTRACTION_REAL() {
  var definitions = [
    {
      path:
        "profile.organizationName",

      label:
        "Nom de l'organisation",

      type:
        "text"
    },

    {
      path:
        "question.E-POL-001",

      label:
        [
          "L'organisation dispose-t-elle d'une politique environnementale formalisée ?",
          "Valeurs : 0 à 5, NA, UNK, WIP.",
          "3 = dispositif formalisé ou officiellement adopté."
        ].join(
          " "
        ),

      type:
        "select",

      options: [
        {
          value:
            "0",
          label:
            "Inexistant"
        },
        {
          value:
            "1",
          label:
            "Informel"
        },
        {
          value:
            "2",
          label:
            "Initié"
        },
        {
          value:
            "3",
          label:
            "Défini"
        },
        {
          value:
            "4",
          label:
            "Mesuré et piloté"
        },
        {
          value:
            "5",
          label:
            "Mature et amélioré"
        },
        {
          value:
            "NA",
          label:
            "Non applicable"
        },
        {
          value:
            "UNK",
          label:
            "Information inconnue"
        },
        {
          value:
            "WIP",
          label:
            "En cours"
        }
      ]
    }
  ];

  var sourceText = [
    "Rapport de durabilité 2026 — Kivu Solar SARL.",
    "Kivu Solar SARL a adopté en janvier 2026 une politique environnementale formalisée et approuvée par la direction.",
    "Aucune autre conclusion ne doit être déduite de cet extrait."
  ].join(
    "\n"
  );

  var result =
    extraireChampsESGAvecAIGateway_(
      sourceText,
      definitions,
      "NARRATIVE_ESG"
    );

  if (
    result.providerUsed !==
      "OPENAI"
  ) {
    throw new Error(
      "OPENAI_PRIMARY_EXPECTED_BUT_USED_" +
      String(
        result.providerUsed ||
        "NONE"
      )
    );
  }

  var org =
    result.fields[
      "profile.organizationName"
    ] || {};

  var policy =
    result.fields[
      "question.E-POL-001"
    ] || {};

  if (
    String(org.value || "") !==
      "Kivu Solar SARL"
  ) {
    throw new Error(
      "Extraction organisation inattendue : " +
      String(
        org.value || ""
      )
    );
  }

  if (
    String(
      policy.value
    ) !==
      "3"
  ) {
    throw new Error(
      "Extraction politique inattendue : " +
      String(
        policy.value
      )
    );
  }

  if (
    !preuvePresenteDansSourceESG_(
      policy.evidence,
      sourceText
    )
  ) {
    throw new Error(
      "La preuve retournée par OpenAI n'est pas présente dans la source."
    );
  }

  return {
    success:
      true,

    providerUsed:
      result.providerUsed,

    fallbackUsed:
      result.fallbackUsed,

    organization:
      org.value,

    policyValue:
      policy.value,

    providerMeta:
      result.providerMeta
  };
}


/**
 * Test réel OPENAI PRIMARY pour la réécriture,
 * avec protection des faits puis restauration.
 */
function TEST_ESG_OPENAI_REWRITE_REAL() {
  var original = {
    schema_version:
      ESG_REWRITE_CONFIG
        .inputSchema,

    language:
      "fr",

    texts: [
      {
        id:
          "executive_summary",

        text:
          "L'organisation obtient un score ESG de 68 / 100 en 2026. La qualité des données est de 72 %."
      }
    ]
  };

  var protection =
    protectPayloadESGRewrite_(
      original
    );

  var gateway =
    reecrireRapportESGAvecAIGateway_(
      protection
        .protectedPayload
    );

  if (
    gateway.providerUsed !==
      "OPENAI"
  ) {
    throw new Error(
      "OPENAI_PRIMARY_EXPECTED_BUT_USED_" +
      String(
        gateway.providerUsed ||
        "NONE"
      )
    );
  }

  var validation =
    validateESGRewriteOutput_(
      protection
        .protectedPayload,
      gateway.output
    );

  if (
    validation.valid !==
      true
  ) {
    throw new Error(
      "OpenAI rewrite contract invalide : " +
      validation
        .errors
        .join(
          " | "
        )
    );
  }

  var restored =
    restoreOutputESGRewrite_(
      gateway.output,
      protection
        .replacementsById
    );

  if (
    restored.failed_ids.length
  ) {
    throw new Error(
      "Restauration des faits OpenAI échouée : " +
      restored
        .failed_ids
        .join(
          ", "
        )
    );
  }

  var rewritten =
    restored
      .output
      .texts[0]
      .rewritten_text;

  if (
    rewritten.indexOf(
      "68 / 100"
    ) === -1 ||
    rewritten.indexOf(
      "2026"
    ) === -1 ||
    rewritten.indexOf(
      "72 %"
    ) === -1
  ) {
    throw new Error(
      "Les faits protégés n'ont pas tous été restaurés."
    );
  }

  return {
    success:
      true,

    providerUsed:
      gateway.providerUsed,

    fallbackUsed:
      gateway.fallbackUsed,

    rewrittenText:
      rewritten,

    providerMeta:
      gateway.providerMeta
  };
}


/**
 * Test réel du provider de secours uniquement.
 * À utiliser pour vérifier que le fallback reste opérationnel
 * sans forcer une panne OpenAI.
 */
function TEST_ESG_HUMBLEOS_FALLBACK_REWRITE_REAL() {
  var payload = {
    schema_version:
      ESG_REWRITE_CONFIG
        .inputSchema,

    language:
      "fr",

    texts: [
      {
        id:
          "fallback_test",

        text:
          "Le score ESG est __AG_KEEP_001__."
      }
    ]
  };

  var output =
    callHumbleOSESGRewrite_(
      payload
    );

  var validation =
    validateESGRewriteOutput_(
      payload,
      output
    );

  if (
    validation.valid !==
      true
  ) {
    throw new Error(
      "HumbleOS fallback rewrite invalide : " +
      validation
        .errors
        .join(
          " | "
        )
    );
  }

  return {
    success:
      true,

    provider:
      "HUMBLEOS"
  };
}
