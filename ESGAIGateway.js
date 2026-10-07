/**
 * ============================================================
 * AFRIGREEN24 — ESG AI GATEWAY V1
 * ============================================================
 *
 * Politique :
 * OPENAI PRIMARY
 * → validation
 * → HUMBLEOS FALLBACK
 * → validation
 * → le caller applique son fallback déterministe.
 *
 * Aucun retry automatique.
 */

function extraireChampsESGAvecAIGateway_(
  sourceText,
  definitions,
  documentMode
) {
  var attempts = [];

  /*
   * 1. OPENAI — PRIMARY
   */
  try {
    var openAIResult =
      extraireESGAvecOpenAI_(
        sourceText,
        definitions,
        documentMode
      );

    verifierContratFieldsExtractionESGAI_(
      openAIResult.fields,
      definitions
    );

    attempts.push({
      provider:
        "OPENAI",
      status:
        "PASS"
    });

    journaliserExecutionESGAI_({
      task:
        "EXTRACT_DOCUMENT",
      provider:
        "OPENAI",
      status:
        "PASS",
      fallbackUsed:
        false,
      providerMeta:
        openAIResult.providerMeta
    });

    return {
      fields:
        openAIResult.fields,

      providerUsed:
        "OPENAI",

      fallbackUsed:
        false,

      attempts:
        attempts,

      providerMeta:
        openAIResult.providerMeta
    };

  } catch (openAIError) {
    attempts.push({
      provider:
        "OPENAI",
      status:
        "FAIL",
      error:
        securiserMessageErreurESGAI_(
          openAIError
        )
    });

    journaliserExecutionESGAI_({
      task:
        "EXTRACT_DOCUMENT",
      provider:
        "OPENAI",
      status:
        "FAIL",
      fallbackUsed:
        true,
      error:
        securiserMessageErreurESGAI_(
          openAIError
        )
    });
  }

  /*
   * 2. HUMBLEOS — FALLBACK ONLY
   */
  try {
    var humbleResult =
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
      !humbleResult ||
      !humbleResult.content ||
      !humbleResult.content.fields
    ) {
      throw new Error(
        "HumbleOS fallback n'a pas retourné content.fields."
      );
    }

    verifierContratFieldsExtractionESGAI_(
      humbleResult
        .content
        .fields,
      definitions
    );

    attempts.push({
      provider:
        "HUMBLEOS",
      status:
        "PASS"
    });

    journaliserExecutionESGAI_({
      task:
        "EXTRACT_DOCUMENT",
      provider:
        "HUMBLEOS",
      status:
        "PASS",
      fallbackUsed:
        true
    });

    return {
      fields:
        humbleResult
          .content
          .fields,

      providerUsed:
        "HUMBLEOS",

      fallbackUsed:
        true,

      attempts:
        attempts,

      providerMeta: {
        provider:
          "HUMBLEOS"
      }
    };

  } catch (humbleError) {
    attempts.push({
      provider:
        "HUMBLEOS",
      status:
        "FAIL",
      error:
        securiserMessageErreurESGAI_(
          humbleError
        )
    });

    journaliserExecutionESGAI_({
      task:
        "EXTRACT_DOCUMENT",
      provider:
        "HUMBLEOS",
      status:
        "FAIL",
      fallbackUsed:
        true,
      error:
        securiserMessageErreurESGAI_(
          humbleError
        )
    });

    var finalError =
      new Error(
        "ESG_AI_EXTRACTION_FAILED: OpenAI et HumbleOS indisponibles ou invalides."
      );

    finalError.attempts =
      attempts;

    throw finalError;
  }
}


function reecrireRapportESGAvecAIGateway_(
  payload
) {
  var attempts = [];

  /*
   * 1. OPENAI — PRIMARY
   */
  try {
    var openAIOutput =
      reecrireESGAvecOpenAI_(
        payload
      );

    var openAIValidation =
      validateESGRewriteOutput_(
        payload,
        openAIOutput
      );

    if (
      openAIValidation.valid !==
      true
    ) {
      throw new Error(
        "OpenAI rewrite invalide : " +
        openAIValidation
          .errors
          .join(
            " | "
          )
      );
    }

    attempts.push({
      provider:
        "OPENAI",
      status:
        "PASS"
    });

    journaliserExecutionESGAI_({
      task:
        "REWRITE_REPORT",
      provider:
        "OPENAI",
      status:
        "PASS",
      fallbackUsed:
        false,
      providerMeta:
        openAIOutput
          ._providerMeta || {}
    });

    return {
      output:
        openAIOutput,

      providerUsed:
        "OPENAI",

      fallbackUsed:
        false,

      attempts:
        attempts,

      providerMeta:
        openAIOutput
          ._providerMeta || {}
    };

  } catch (openAIError) {
    attempts.push({
      provider:
        "OPENAI",
      status:
        "FAIL",
      error:
        securiserMessageErreurESGAI_(
          openAIError
        )
    });

    journaliserExecutionESGAI_({
      task:
        "REWRITE_REPORT",
      provider:
        "OPENAI",
      status:
        "FAIL",
      fallbackUsed:
        true,
      error:
        securiserMessageErreurESGAI_(
          openAIError
        )
    });
  }

  /*
   * 2. HUMBLEOS — FALLBACK ONLY
   */
  try {
    var humbleOutput =
      callHumbleOSESGRewrite_(
        payload
      );

    var humbleValidation =
      validateESGRewriteOutput_(
        payload,
        humbleOutput
      );

    if (
      humbleValidation.valid !==
      true
    ) {
      throw new Error(
        "HumbleOS rewrite fallback invalide : " +
        humbleValidation
          .errors
          .join(
            " | "
          )
      );
    }

    attempts.push({
      provider:
        "HUMBLEOS",
      status:
        "PASS"
    });

    journaliserExecutionESGAI_({
      task:
        "REWRITE_REPORT",
      provider:
        "HUMBLEOS",
      status:
        "PASS",
      fallbackUsed:
        true
    });

    return {
      output:
        humbleOutput,

      providerUsed:
        "HUMBLEOS",

      fallbackUsed:
        true,

      attempts:
        attempts,

      providerMeta: {
        provider:
          "HUMBLEOS"
      }
    };

  } catch (humbleError) {
    attempts.push({
      provider:
        "HUMBLEOS",
      status:
        "FAIL",
      error:
        securiserMessageErreurESGAI_(
          humbleError
        )
    });

    journaliserExecutionESGAI_({
      task:
        "REWRITE_REPORT",
      provider:
        "HUMBLEOS",
      status:
        "FAIL",
      fallbackUsed:
        true,
      error:
        securiserMessageErreurESGAI_(
          humbleError
        )
    });

    var finalError =
      new Error(
        "ESG_AI_REWRITE_FAILED: OpenAI et HumbleOS indisponibles ou invalides."
      );

    finalError.attempts =
      attempts;

    throw finalError;
  }
}


function verifierContratFieldsExtractionESGAI_(
  fields,
  definitions
) {
  if (
    !fields ||
    typeof fields !==
      "object" ||
    Array.isArray(
      fields
    )
  ) {
    throw new Error(
      "Contrat fields ESG invalide."
    );
  }

  var allowed = {};

  (definitions || []).forEach(
    function(definition) {
      if (
        definition &&
        definition.path
      ) {
        allowed[
          String(
            definition.path
          )
        ] = true;
      }
    }
  );

  Object.keys(
    fields
  ).forEach(
    function(path) {
      if (!allowed[path]) {
        throw new Error(
          "Field ESG non autorisé : " +
          path
        );
      }

      var item =
        fields[path];

      if (
        !item ||
        typeof item !==
          "object"
      ) {
        throw new Error(
          "Field ESG invalide : " +
          path
        );
      }

      var confidence =
        Number(
          item.confidence
        );

      if (
        !isFinite(
          confidence
        ) ||
        confidence < 0 ||
        confidence > 1
      ) {
        throw new Error(
          "Confidence ESG invalide : " +
          path
        );
      }

      if (
        typeof item.evidence !==
          "string"
      ) {
        throw new Error(
          "Evidence ESG invalide : " +
          path
        );
      }
    }
  );

  return true;
}


function journaliserExecutionESGAI_(
  event
) {
  event = event || {};

  var safe = {
    event:
      "esg_ai_execution",

    timestamp:
      new Date()
        .toISOString(),

    task:
      String(
        event.task || ""
      ),

    provider:
      String(
        event.provider || ""
      ),

    status:
      String(
        event.status || ""
      ),

    fallbackUsed:
      event.fallbackUsed ===
      true
  };

  if (
    event.providerMeta
  ) {
    safe.model =
      event
        .providerMeta
        .model ||
      "";

    safe.responseId =
      event
        .providerMeta
        .responseId ||
      "";

    safe.latencyMs =
      event
        .providerMeta
        .latencyMs ||
      null;

    safe.usage =
      event
        .providerMeta
        .usage ||
      {};
  }

  if (
    event.error
  ) {
    safe.error =
      String(
        event.error
      ).substring(
        0,
        1000
      );
  }

  console.log(
    JSON.stringify(
      safe
    )
  );
}


function securiserMessageErreurESGAI_(
  error
) {
  var text =
    error &&
    error.message
      ? String(
          error.message
        )
      : String(
          error || ""
        );

  /*
   * Défense simple contre une fuite accidentelle d'une clé
   * dans les logs si un fournisseur la répétait dans un message.
   */
  return text
    .replace(
      /sk-[A-Za-z0-9_-]{10,}/g,
      "[REDACTED_OPENAI_KEY]"
    )
    .substring(
      0,
      1200
    );
}


function TEST_ESG_AI_GATEWAY_CONTRACT_LOCAL() {
  var definitions = [
    {
      path:
        "profile.organizationName"
    }
  ];

  var valid = {
    "profile.organizationName": {
      value:
        "Organisation Test",
      confidence:
        0.9,
      evidence:
        "Organisation Test"
    }
  };

  var success =
    verifierContratFieldsExtractionESGAI_(
      valid,
      definitions
    );

  return {
    success:
      success === true,

    primary:
      ESG_AI_CONFIG_V1
        .providers
        .primary,

    fallback:
      ESG_AI_CONFIG_V1
        .providers
        .fallback
  };
}
