/**
 * ============================================================
 * AFRIGREEN24 — LEGACY TO CANONICAL ADAPTER V1
 * ============================================================
 *
 * Objectif :
 * adapter le moteur ESG actuel vers ESG_REPORT_SCHEMA_V1
 * sans modifier :
 * - le questionnaire ;
 * - le scoring ;
 * - les alertes ;
 * - les recommandations.
 *
 * Règle :
 * absence de donnée = état explicite, jamais invention.
 */

function adapterAnalyseLegacyVersSchemaESGV1(
  profil,
  analyseESG,
  diagnosticDigital,
  options
) {
  profil =
    profil || {};

  analyseESG =
    analyseESG || {};

  diagnosticDigital =
    diagnosticDigital || {};

  options =
    options || {};

  if (
    analyseESG.success !== true ||
    !analyseESG.diagnostic ||
    !analyseESG.recommandations
  ) {
    throw new Error(
      "Analyse ESG legacy invalide pour l'adaptation canonique."
    );
  }

  var diagnostic =
    analyseESG.diagnostic;

  var recommandations =
    analyseESG.recommandations;

  var intake =
    normaliserContexteIntakeESG_(
      options.intake || {}
    );

  var rawResponses =
    options.rawResponses || {};

  var model =
    creerESGReportSchemaV1Vide_();

  model.organization =
    adapterOrganisationLegacyESGV1_(
      profil,
      intake
    );

  model.intake = {
    entryMode:
      intake.entryMode,

    capturedAt:
      intake.capturedAt,

    sourceDocuments:
      intake.sourceDocuments
  };

  model.assessment.assessmentId =
    String(
      options.assessmentId ||
      diagnostic.assessmentId ||
      diagnostic.diagnosticId ||
      ""
    );

  model.assessment.scoringVersion =
    String(
      diagnostic.version ||
      ESG_CONFIG.version ||
      ""
    );

  model.assessment.questionnaireVersion =
    String(
      ESG_CONFIG.version ||
      diagnostic.version ||
      ""
    );

  model.assessment.completedAt =
    diagnostic.generatedAt ||
    analyseESG.generatedAt ||
    new Date()
      .toISOString();

  model.assessment.responses =
    adapterReponsesLegacyESGV1_(
      diagnostic.resultatsQuestions ||
        [],
      rawResponses,
      intake
    );

  model.scores =
    adapterScoresLegacyESGV1_(
      diagnostic
    );

  model.dataQualityProfile =
    adapterDataQualityLegacyESGV1_(
      diagnostic,
      model
        .assessment
        .responses
    );

  /*
   * IMPORTANT :
   * les indicateurs du moteur legacy sont des indicateurs
   * RECOMMANDÉS, pas des KPI mesurés.
   */
  model.kpis =
    [];

  model.recommendedIndicators =
    adapterIndicateursRecommandesLegacyESGV1_(
      recommandations
        .indicateursRecommandes ||
        []
    );

  model.risks =
    adapterRisquesLegacyESGV1_(
      diagnostic.alertesAvancees ||
      diagnostic.alertesCritiques ||
      []
    );

  model.recommendations =
    adapterRecommandationsLegacyESGV1_(
      recommandations
    );

  model.roadmapActions =
    adapterRoadmapLegacyESGV1_(
      recommandations
    );

  /*
   * Une réponse au questionnaire n'est pas automatiquement
   * une affirmation publiée dans le rapport.
   * Les Claims seront créés par le futur Evidence /
   * Document Model Engine.
   */
  model.claims =
    [];

  /*
   * Aucun asset de preuve n'est créé artificiellement
   * depuis un simple niveau STRONG/MEDIUM/DECLARATIVE.
   */
  model.evidence =
    [];

  model.materiality = {
    status:
      ESG_DATA_STATUS_V1
        .NOT_ASSESSED,

    level:
      "NOT_ASSESSED",

    topics:
      []
  };

  model.report.profile =
    normaliserProfilRapportESGV1_(
      options.profile
    );

  model.report.reportId =
    String(
      options.reportId ||
      ""
    );

  model.report.language =
    String(
      options.language ||
      "fr"
    );

  model.report.whiteLabel =
    true;

  model.legacy.sourceVersion =
    String(
      diagnostic.version ||
      ESG_CONFIG.version ||
      ""
    );

  model.legacy.diagnosticDigital =
    diagnosticDigital &&
    diagnosticDigital.success ===
      true
      ? {
          available:
            true,

          scoreGlobal:
            diagnosticDigital
              .scoreGlobal,

          niveau:
            diagnosticDigital
              .niveau
        }
      : {
          available:
            false
        };

  return model;
}


function adapterOrganisationLegacyESGV1_(
  profil,
  intake
) {
  var organization = {
    organizationId:
      String(
        profil.organizationId ||
        profil.projectId ||
        ""
      ),

    name:
      String(
        profil.organizationName ||
        profil.nomOrganisation ||
        ""
      ),

    legalType:
      String(
        profil.organizationType ||
        profil.typeOrganisation ||
        ""
      ),

    sector:
      String(
        profil.mainSector ||
        profil.secteur ||
        ""
      ),

    countries:
      construirePaysOrganisationESGV1_(
        profil
      ),

    mainCountry:
      String(
        profil.mainCountry ||
        profil.pays ||
        ""
      ),

    employeeCount:
      valeurOuNullESGV1_(
        profil.employeeCount ||
        profil.effectif
      ),

    annualRevenueOrBudget:
      valeurOuNullESGV1_(
        profil.annualRevenueOrBudget ||
        profil.annualRevenue ||
        profil.budgetAnnuel
      ),

    creationYear:
      valeurOuNullESGV1_(
        profil.creationYear ||
        profil.anneeCreation
      ),

    interventionZone:
      String(
        profil.interventionZone ||
        profil.zoneIntervention ||
        ""
      ),

    activities:
      [],

    beneficiaries:
      null,

    sourceRefs:
      [],

    fieldProvenance:
      {}
  };

  [
    "organizationName",
    "responsibleName",
    "professionalEmail",
    "phone",
    "mainCountry",
    "additionalCountries",
    "organizationType",
    "mainSector",
    "employeeCount",
    "annualRevenueOrBudget",
    "creationYear",
    "interventionZone",
    "existingESGPolicy",
    "existingESGReport",
    "diagnosticPurpose"
  ].forEach(
    function(fieldId) {
      organization
        .fieldProvenance[
          fieldId
        ] =
        construireProvenanceProfilESGV1_(
          fieldId,
          intake
        );
    }
  );

  return organization;
}


function construirePaysOrganisationESGV1_(
  profil
) {
  var values = [];

  var main =
    profil.mainCountry ||
    profil.pays ||
    "";

  if (main) {
    values.push(
      String(main)
    );
  }

  var additional =
    profil.additionalCountries;

  if (
    Array.isArray(
      additional
    )
  ) {
    values =
      values.concat(
        additional
      );
  } else if (additional) {
    values =
      values.concat(
        String(
          additional
        )
          .split(
            ","
          )
          .map(
            function(value) {
              return value
                .trim();
            }
          )
          .filter(
            function(value) {
              return !!value;
            }
          )
      );
  }

  var seen = {};

  return values.filter(
    function(value) {
      var key =
        String(
          value
        ).toLowerCase();

      if (
        !key ||
        seen[key]
      ) {
        return false;
      }

      seen[key] =
        true;

      return true;
    }
  );
}


function adapterReponsesLegacyESGV1_(
  resultats,
  rawResponses,
  intake
) {
  rawResponses =
    rawResponses || {};

  return (resultats || [])
    .map(
      function(resultat) {
        var statuts =
          determinerStatutsDepuisResultatLegacyESG_(
            resultat
          );

        var raw =
          rawResponses[
            resultat.questionId
          ] || {};

        var provenance =
          construireProvenanceReponseESGV1_(
            resultat.questionId,
            raw,
            intake
          );

        var sourceRefs = [];

        if (
          provenance.sourceDocumentId
        ) {
          sourceRefs.push(
            provenance.sourceDocumentId
          );
        }

        return {
          responseId:
            "RESP-" +
            String(
              resultat.questionId ||
              ""
            ),

          questionId:
            String(
              resultat.questionId ||
              ""
            ),

          number:
            resultat.numero,

          pillar:
            String(
              resultat.pilier ||
              ""
            ),

          theme:
            String(
              resultat.theme ||
              ""
            ),

          subtheme:
            String(
              resultat.subtheme ||
              ""
            ),

          value:
            resultat.valeur !==
              undefined
              ? resultat.valeur
              : null,

          score:
            resultat.score !==
              undefined
              ? resultat.score
              : null,

          weight:
            resultat.poids !==
              undefined
              ? resultat.poids
              : null,

          weightedScore:
            resultat.scorePondere !==
              undefined
              ? resultat.scorePondere
              : null,

          dataStatus:
            statuts.dataStatus,

          validationStatus:
            statuts
              .validationStatus,

          applicabilityStatus:
            statuts
              .applicabilityStatus,

          inputMethod:
            provenance.inputMethod,

          extractionStatus:
            provenance
              .extractionStatus,

          sourceDocumentId:
            provenance
              .sourceDocumentId,

          sourceName:
            provenance
              .sourceName,

          sourceExcerpt:
            provenance
              .sourceExcerpt,

          extractionConfidence:
            provenance
              .extractionConfidence,

          userConfirmed:
            provenance
              .userConfirmed,

          legacyEvidenceLevel:
            String(
              resultat.niveauPreuve ||
              "NONE"
            ),

          legacyEvidenceScore:
            resultat.scorePreuve !==
              undefined
              ? resultat.scorePreuve
              : null,

          comment:
            String(
              resultat.commentaire ||
              ""
            ),

          evidenceIds:
            [],

          sourceRefs:
            sourceRefs
        };
      }
    );
}


function adapterScoresLegacyESGV1_(
  diagnostic
) {
  var scores =
    diagnostic.scores || {};

  return {
    environmentScore:
      valeurNombreOuNullESGV1_(
        scores.environnement
      ),

    socialScore:
      valeurNombreOuNullESGV1_(
        scores.social
      ),

    governanceScore:
      valeurNombreOuNullESGV1_(
        scores.gouvernance
      ),

    esgOverallScoreV2:
      calculerESGOverallScoreV2DepuisPiliers_(
        scores.environnement,
        scores.social,
        scores.gouvernance
      ),

    readinessScore:
      valeurNombreOuNullESGV1_(
        scores.readiness
      ),

    dataConfidenceScore:
      valeurNombreOuNullESGV1_(
        scores.niveauConfiance
      ),

    /*
     * Pas encore calculable tant que l'Evidence Engine
     * canonique n'a pas été exécuté.
     */
    evidenceCoverageScore:
      null,

    legacyEvidenceScore:
      valeurNombreOuNullESGV1_(
        scores.preuves
      ),

    fundingReadinessScore:
      null,

    legacyGlobalScoreV1:
      valeurNombreOuNullESGV1_(
        scores.globalAjuste
      ),

    methodology: {
      esgOverallScoreV2:
        "EQUAL_WEIGHT_E_S_G_V2",

      legacyGlobalScoreV1:
        "LEGACY_ENGINE_" +
        String(
          diagnostic.version ||
          ESG_CONFIG.version ||
          ""
        ),

      canonicalEvidenceCoverage:
        "EVIDENCE_ENGINE_V1_NOT_RUN"
    }
  };
}


function adapterDataQualityLegacyESGV1_(
  diagnostic,
  responses
) {
  var profile = {
    totalExpected:
      (responses || [])
        .length,

    confirmedCount:
      0,

    declaredCount:
      0,

    calculatedCount:
      0,

    estimateCount:
      0,

    notAvailableCount:
      0,

    notAssessedCount:
      0,

    notApplicableCount:
      0,

    evidenceCoverageScore:
      null,

    legacyEvidenceScore:
      valeurNombreOuNullESGV1_(
        diagnostic.scores &&
        diagnostic.scores.preuves
      ),

    dataConfidenceScore:
      valeurNombreOuNullESGV1_(
        diagnostic.scores &&
        diagnostic.scores
          .niveauConfiance
      ),

    warnings:
      [],

    limitations:
      [
        "La couverture de preuves canonique n'est pas calculée tant que l'Evidence Engine V1 n'a pas été exécuté."
      ]
  };

  (responses || [])
    .forEach(
      function(response) {
        if (
          response
            .applicabilityStatus ===
          ESG_APPLICABILITY_STATUS_V1
            .NOT_APPLICABLE
        ) {
          profile
            .notApplicableCount++;
        }

        switch (
          response.dataStatus
        ) {
          case ESG_DATA_STATUS_V1
            .CONFIRMED:
            profile.confirmedCount++;
            break;

          case ESG_DATA_STATUS_V1
            .DECLARED:
            profile.declaredCount++;
            break;

          case ESG_DATA_STATUS_V1
            .CALCULATED:
            profile.calculatedCount++;
            break;

          case ESG_DATA_STATUS_V1
            .ESTIMATE:
            profile.estimateCount++;
            break;

          case ESG_DATA_STATUS_V1
            .NOT_AVAILABLE:
            profile.notAvailableCount++;
            break;

          case ESG_DATA_STATUS_V1
            .NOT_ASSESSED:
            profile.notAssessedCount++;
            break;
        }
      }
    );

  if (
    profile.confirmedCount ===
    0
  ) {
    profile.limitations.push(
      "Aucune donnée n'est automatiquement classée CONFIRMED par l'adaptateur legacy. Une preuve et une validation explicites sont nécessaires."
    );
  }

  if (
    profile.notAvailableCount >
    0
  ) {
    profile.warnings.push(
      profile.notAvailableCount +
      " donnée(s) applicable(s) sont indisponibles."
    );
  }

  return profile;
}


function adapterIndicateursRecommandesLegacyESGV1_(
  indicateurs
) {
  return (indicateurs || [])
    .map(
      function(indicateur, index) {
        return {
          recommendedIndicatorId:
            String(
              indicateur.indicatorId ||
              "REC-KPI-" +
              (index + 1)
            ),

          name:
            String(
              indicateur.label ||
              indicateur.name ||
              ""
            ),

          pillar:
            String(
              indicateur.pillar ||
              ""
            ),

          topic:
            String(
              indicateur.theme ||
              ""
            ),

          unit:
            String(
              indicateur.unit ||
              ""
            ),

          frequency:
            String(
              indicateur.frequency ||
              ""
            ),

          owner:
            String(
              indicateur.responsible ||
              ""
            ),

          reason:
            "Indicateur recommandé par le moteur legacy ; aucune valeur mesurée n'est supposée."
        };
      }
    );
}


function adapterRisquesLegacyESGV1_(
  alertes
) {
  return (alertes || [])
    .map(
      function(alerte, index) {
        return {
          riskId:
            String(
              alerte.alertId ||
              alerte.code ||
              "RISK-" +
              (index + 1)
            ),

          pillar:
            String(
              alerte.pillar ||
              alerte.pilier ||
              ""
            ),

          materialTopicId:
            null,

          description:
            String(
              alerte.message ||
              alerte.title ||
              ""
            ),

          cause:
            null,

          consequence:
            null,

          likelihood:
            null,

          impact:
            null,

          inherentScore:
            null,

          existingControls:
            [],

          mitigationActions:
            alerte.immediateAction ||
            alerte.recommandation
              ? [
                  String(
                    alerte
                      .immediateAction ||
                    alerte
                      .recommandation
                  )
                ]
              : [],

          owner:
            null,

          dueDate:
            null,

          residualLikelihood:
            null,

          residualImpact:
            null,

          residualScore:
            null,

          evidenceIds:
            [],

          status:
            String(
              alerte.status ||
              "OPEN"
            ),

          timeHorizon:
            null,

          legacySeverity:
            String(
              alerte.severity ||
              alerte.gravite ||
              ""
            ),

          humanReviewRequired:
            alerte
              .validationHumaineRecommandee ===
              true ||
            alerte.humanReview ===
              true
        };
      }
    );
}


function adapterRecommandationsLegacyESGV1_(
  recommandations
) {
  var list = [];
  var seen = {};

  function add_(
    action,
    legacyHorizon
  ) {
    if (!action) {
      return;
    }

    var text =
      String(
        action.action ||
        action.recommandation ||
        action.title ||
        ""
      ).trim();

    if (!text) {
      return;
    }

    var key =
      String(
        action.actionId ||
        action.questionId ||
        text
      ).toLowerCase();

    if (seen[key]) {
      return;
    }

    seen[key] =
      true;

    list.push({
      recommendationId:
        String(
          action.actionId ||
          "REC-" +
          (list.length + 1)
        ),

      pillar:
        String(
          action.pilier ||
          action.pillar ||
          ""
        ),

      topic:
        String(
          action.theme ||
          ""
        ),

      title:
        String(
          action.title ||
          action.theme ||
          "Recommandation ESG"
        ),

      action:
        text,

      rationale:
        String(
          action.risque ||
          action.description ||
          ""
        ),

      priority:
        String(
          action.criticite ||
          action.priority ||
          ""
        ),

      effort:
        null,

      expectedImpact:
        null,

      riskIds:
        [],

      targetIds:
        [],

      evidenceGapIds:
        [],

      legacyHorizon:
        legacyHorizon
    });
  }

  var plans =
    recommandations
      .planAction ||
    {};

  (
    plans
      .immediate_0_3_months ||
    []
  ).forEach(
    function(action) {
      add_(
        action,
        "0-3 months"
      );
    }
  );

  (
    plans
      .short_term_3_6_months ||
    []
  ).forEach(
    function(action) {
      add_(
        action,
        "3-6 months"
      );
    }
  );

  (
    plans
      .structural_6_24_months ||
    []
  ).forEach(
    function(action) {
      add_(
        action,
        "6-24 months"
      );
    }
  );

  return list;
}


function adapterRoadmapLegacyESGV1_(
  recommandations
) {
  var actions = [];

  var plans =
    recommandations
      .planAction ||
    {};

  function pushItems_(
    items,
    canonicalHorizon,
    legacyHorizon,
    migrationStatus
  ) {
    (items || [])
      .forEach(
        function(action, index) {
          actions.push({
            actionId:
              String(
                action.actionId ||
                "ROADMAP-" +
                (
                  canonicalHorizon ||
                  "UNCLASSIFIED"
                ) +
                "-" +
                (index + 1)
              ),

            recommendationId:
              null,

            title:
              String(
                action.action ||
                action.title ||
                ""
              ),

            horizon:
              canonicalHorizon,

            owner:
              String(
                action
                  .responsableSuggere ||
                action.responsable ||
                ""
              ),

            dueDate:
              action
                .echeanceSuggeree ||
              action.echeance ||
              null,

            successMetric:
              action
                .indicateurDeSuivi ||
              null,

            evidenceOfCompletion:
              action
                .preuveDeRealisation ||
              null,

            status:
              String(
                action.status ||
                "NOT_STARTED"
              ),

            legacyHorizon:
              legacyHorizon,

            migrationStatus:
              migrationStatus
          });
        }
      );
  }

  pushItems_(
    plans
      .immediate_0_3_months,
    ESG_ROADMAP_HORIZON_V1
      .MONTHS_0_3,
    "0-3 months",
    "EXACT"
  );

  /*
   * 3-6 est entièrement contenu dans le nouvel horizon 3-12.
   */
  pushItems_(
    plans
      .short_term_3_6_months,
    ESG_ROADMAP_HORIZON_V1
      .MONTHS_3_12,
    "3-6 months",
    "MAPPED_CONTAINED_RANGE"
  );

  /*
   * 6-24 traverse les deux nouveaux horizons 3-12 et 12-24.
   * On ne fabrique donc pas une précision inexistante.
   */
  pushItems_(
    plans
      .structural_6_24_months,
    null,
    "6-24 months",
    "NEEDS_RECLASSIFICATION"
  );

  return actions;
}


function valeurOuNullESGV1_(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return value;
}


function valeurNombreOuNullESGV1_(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  var number =
    Number(
      value
    );

  return isFinite(
    number
  )
    ? number
    : null;
}


function TEST_ESG_LEGACY_ADAPTER_V1_LOCAL() {
  var questions =
    obtenirQuestionsESG();

  var reponses = {};

  questions.forEach(
    function(question, index) {
      reponses[
        question.question_id
      ] = {
        value:
          index % 6,

        evidenceLevel:
          index % 3 === 0
            ? "MEDIUM"
            : "DECLARATIVE",

        comment:
          "Test adapter V1",

        inputMethod:
          index % 2 === 0
            ? "DOCUMENT_EXTRACTION"
            : "MANUAL",

        sourceDocumentId:
          index % 2 === 0
            ? "DOC-001"
            : "",

        sourceName:
          index % 2 === 0
            ? "Rapport test.pdf"
            : "",

        extractionStatus:
          index % 2 === 0
            ? "FOUND"
            : "",

        extractionConfidence:
          index % 2 === 0
            ? 0.93
            : null
      };
    }
  );

  var analyse =
    executerDiagnosticEtRecommandationsESG(
      reponses
    );

  var model =
    adapterAnalyseLegacyVersSchemaESGV1(
      {
        organizationName:
          "Organisation test",

        mainCountry:
          "Cameroun",

        organizationType:
          "PME",

        mainSector:
          "Agriculture / Agribusiness"
      },
      analyse,
      {},
      {
        profile:
          ESG_REPORT_PROFILE_V1
            .DIAGNOSTIC,

        rawResponses:
          reponses,

        intake: {
          entryMode:
            "import",

          sourceDocuments: [
            {
              sourceDocumentId:
                "DOC-001",

              name:
                "Rapport test.pdf",

              mimeType:
                "application/pdf"
            }
          ]
        }
      }
    );

  var validation =
    validerESGReportSchemaV1(
      model
    );

  var structuralActions =
    model
      .roadmapActions
      .filter(
        function(action) {
          return (
            action
              .legacyHorizon ===
            "6-24 months"
          );
        }
      );

  var structuralSafe =
    structuralActions
      .every(
        function(action) {
          return (
            action.horizon ===
              null &&
            action
              .migrationStatus ===
              "NEEDS_RECLASSIFICATION"
          );
        }
      );

  return {
    success:
      validation.valid ===
        true &&
      model.kpis.length ===
        0 &&
      model
        .recommendedIndicators
        .length >
        0 &&
      model.scores
        .evidenceCoverageScore ===
        null &&
      structuralSafe ===
        true,

    validation:
      validation,

    counts: {
      responses:
        model
          .assessment
          .responses
          .length,

      risks:
        model
          .risks
          .length,

      recommendedIndicators:
        model
          .recommendedIndicators
          .length,

      roadmap:
        model
          .roadmapActions
          .length
    },

    scores:
      model.scores
  };
}
