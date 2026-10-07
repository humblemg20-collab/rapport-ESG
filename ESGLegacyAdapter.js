/**
 * ============================================================
 * AFRIGREEN24 — LEGACY TO CANONICAL ADAPTER V1
 * ============================================================
 *
 * Objectif :
 * adapter le moteur ESG actuel vers ESG_REPORT_SCHEMA_V1
 * sans modifier le scoring, les alertes ni les recommandations.
 */

function adapterAnalyseLegacyVersSchemaESGV1(
  profil,
  analyseESG,
  diagnosticDigital,
  options
) {
  profil = profil || {};
  analyseESG = analyseESG || {};
  diagnosticDigital = diagnosticDigital || {};
  options = options || {};

  if (
    analyseESG.success !== true ||
    !analyseESG.diagnostic ||
    !analyseESG.recommandations
  ) {
    throw new Error(
      "Analyse ESG legacy invalide pour l'adaptation canonique."
    );
  }

  var diagnostic = analyseESG.diagnostic;
  var recommandations = analyseESG.recommandations;
  var model = creerESGReportSchemaV1Vide_();

  model.organization =
    adapterOrganisationLegacyESGV1_(profil);

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
    new Date().toISOString();

  model.assessment.responses =
    adapterReponsesLegacyESGV1_(
      diagnostic.resultatsQuestions || []
    );

  model.scores =
    adapterScoresLegacyESGV1_(
      diagnostic
    );

  model.dataQualityProfile =
    adapterDataQualityLegacyESGV1_(
      diagnostic,
      model.assessment.responses
    );

  model.kpis =
    adapterKPIsLegacyESGV1_(
      recommandations.indicateursRecommandes || []
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

  model.claims =
    adapterClaimsLegacyESGV1_(
      diagnostic.resultatsQuestions || []
    );

  /*
   * IMPORTANT :
   * aucune preuve réelle n'est créée artificiellement.
   * Les niveaux STRONG/MEDIUM/DECLARATIVE du legacy sont
   * conservés dans les réponses, mais evidence[] reste vide
   * tant qu'aucun asset/source vérifiable n'est fourni.
   */
  model.evidence = [];

  model.materiality = {
    status: ESG_DATA_STATUS_V1.NOT_ASSESSED,
    level: "NOT_ASSESSED",
    topics: []
  };

  model.report.profile =
    normaliserProfilRapportESGV1_(
      options.profile
    );

  model.report.reportId =
    String(
      options.reportId || ""
    );

  model.report.language =
    String(
      options.language || "fr"
    );

  model.legacy.sourceVersion =
    String(
      diagnostic.version ||
      ESG_CONFIG.version ||
      ""
    );

  model.legacy.diagnosticDigital =
    diagnosticDigital &&
    diagnosticDigital.success === true
      ? {
          available: true,
          scoreGlobal:
            diagnosticDigital.scoreGlobal,
          niveau:
            diagnosticDigital.niveau
        }
      : {
          available: false
        };

  return model;
}


function adapterOrganisationLegacyESGV1_(profil) {
  return {
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

    activities: [],
    beneficiaries: null,
    valueChainSummary: null,
    sourceRefs: []
  };
}


function construirePaysOrganisationESGV1_(profil) {
  var values = [];

  var main =
    profil.mainCountry ||
    profil.pays ||
    "";

  if (main) {
    values.push(String(main));
  }

  var additional =
    profil.additionalCountries;

  if (Array.isArray(additional)) {
    values = values.concat(additional);
  } else if (additional) {
    values = values.concat(
      String(additional)
        .split(",")
        .map(function(v) {
          return v.trim();
        })
        .filter(function(v) {
          return !!v;
        })
    );
  }

  var seen = {};

  return values.filter(function(value) {
    var key = String(value).toLowerCase();

    if (!key || seen[key]) {
      return false;
    }

    seen[key] = true;
    return true;
  });
}


function adapterReponsesLegacyESGV1_(resultats) {
  return (resultats || []).map(
    function(resultat) {
      var statuts =
        determinerStatutsDepuisResultatLegacyESG_(
          resultat
        );

      return {
        responseId:
          "RESP-" +
          String(resultat.questionId || ""),

        questionId:
          String(resultat.questionId || ""),

        number:
          resultat.numero,

        pillar:
          String(resultat.pilier || ""),

        theme:
          String(resultat.theme || ""),

        subtheme:
          String(resultat.subtheme || ""),

        value:
          resultat.valeur !== undefined
            ? resultat.valeur
            : null,

        score:
          resultat.score !== undefined
            ? resultat.score
            : null,

        weight:
          resultat.poids !== undefined
            ? resultat.poids
            : null,

        weightedScore:
          resultat.scorePondere !== undefined
            ? resultat.scorePondere
            : null,

        dataStatus:
          statuts.dataStatus,

        validationStatus:
          statuts.validationStatus,

        applicabilityStatus:
          statuts.applicabilityStatus,

        legacyEvidenceLevel:
          String(
            resultat.niveauPreuve ||
            "NONE"
          ),

        legacyEvidenceScore:
          resultat.scorePreuve !== undefined
            ? resultat.scorePreuve
            : null,

        comment:
          String(
            resultat.commentaire || ""
          ),

        evidenceIds: [],
        sourceRefs: []
      };
    }
  );
}


function adapterScoresLegacyESGV1_(diagnostic) {
  var scores = diagnostic.scores || {};

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

    evidenceCoverageScore:
      valeurNombreOuNullESGV1_(
        scores.preuves
      ),

    fundingReadinessScore: null,

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
        )
    }
  };
}


function adapterDataQualityLegacyESGV1_(
  diagnostic,
  responses
) {
  var profile = {
    totalExpected:
      (responses || []).length,

    confirmedCount: 0,
    declaredCount: 0,
    calculatedCount: 0,
    estimateCount: 0,
    notAvailableCount: 0,
    notAssessedCount: 0,
    notApplicableCount: 0,

    evidenceCoverageScore:
      valeurNombreOuNullESGV1_(
        diagnostic.scores &&
        diagnostic.scores.preuves
      ),

    dataConfidenceScore:
      valeurNombreOuNullESGV1_(
        diagnostic.scores &&
        diagnostic.scores.niveauConfiance
      ),

    warnings: [],
    limitations: []
  };

  (responses || []).forEach(
    function(response) {
      if (
        response.applicabilityStatus ===
        ESG_APPLICABILITY_STATUS_V1.NOT_APPLICABLE
      ) {
        profile.notApplicableCount++;
      }

      switch (response.dataStatus) {
        case ESG_DATA_STATUS_V1.CONFIRMED:
          profile.confirmedCount++;
          break;

        case ESG_DATA_STATUS_V1.DECLARED:
          profile.declaredCount++;
          break;

        case ESG_DATA_STATUS_V1.CALCULATED:
          profile.calculatedCount++;
          break;

        case ESG_DATA_STATUS_V1.ESTIMATE:
          profile.estimateCount++;
          break;

        case ESG_DATA_STATUS_V1.NOT_AVAILABLE:
          profile.notAvailableCount++;
          break;

        case ESG_DATA_STATUS_V1.NOT_ASSESSED:
          profile.notAssessedCount++;
          break;
      }
    }
  );

  if (
    profile.confirmedCount === 0
  ) {
    profile.limitations.push(
      "Aucune donnée n'est automatiquement classée CONFIRMED par l'adaptateur legacy. Une validation ou une preuve explicite est requise."
    );
  }

  if (
    profile.notAvailableCount > 0
  ) {
    profile.warnings.push(
      profile.notAvailableCount +
      " donnée(s) applicable(s) sont indisponibles."
    );
  }

  return profile;
}


function adapterKPIsLegacyESGV1_(indicateurs) {
  return (indicateurs || []).map(
    function(indicateur, index) {
      return {
        kpiId:
          String(
            indicateur.indicatorId ||
            "KPI-" + (index + 1)
          ),

        name:
          String(
            indicateur.label ||
            indicateur.name ||
            ""
          ),

        pillar:
          String(
            indicateur.pillar || ""
          ),

        topic:
          String(
            indicateur.theme || ""
          ),

        unit:
          String(
            indicateur.unit || ""
          ),

        frequency:
          String(
            indicateur.frequency || ""
          ),

        owner:
          String(
            indicateur.responsible || ""
          ),

        baselineValue: null,
        baselineYear: null,
        currentValue: null,
        currentYear: null,
        targetValue: null,
        targetYear: null,
        gap: null,
        trend: null,
        status: null,
        scope: null,
        methodology: null,

        dataStatus:
          ESG_DATA_STATUS_V1.NOT_AVAILABLE,

        validationStatus:
          ESG_VALIDATION_STATUS_V1.UNREVIEWED,

        assuranceStatus: null,
        evidenceIds: [],
        sourceRefs: []
      };
    }
  );
}


function adapterRisquesLegacyESGV1_(alertes) {
  return (alertes || []).map(
    function(alerte, index) {
      return {
        riskId:
          String(
            alerte.alertId ||
            alerte.code ||
            "RISK-" + (index + 1)
          ),

        pillar:
          String(
            alerte.pillar ||
            alerte.pilier ||
            ""
          ),

        materialTopicId: null,

        description:
          String(
            alerte.message ||
            alerte.title ||
            ""
          ),

        cause: null,
        consequence: null,
        likelihood: null,
        impact: null,
        inherentScore: null,

        existingControls: [],

        mitigationActions:
          alerte.immediateAction ||
          alerte.recommandation
            ? [
                String(
                  alerte.immediateAction ||
                  alerte.recommandation
                )
              ]
            : [],

        owner: null,
        dueDate: null,
        residualLikelihood: null,
        residualImpact: null,
        residualScore: null,

        evidenceIds: [],

        status:
          String(
            alerte.status || "OPEN"
          ),

        timeHorizon: null,

        legacySeverity:
          String(
            alerte.severity ||
            alerte.gravite ||
            ""
          ),

        humanReviewRequired:
          alerte.validationHumaineRecommandee === true ||
          alerte.humanReview === true
      };
    }
  );
}


function adapterRecommandationsLegacyESGV1_(
  recommandations
) {
  var list = [];
  var seen = {};

  function add(action, horizon) {
    if (!action) {
      return;
    }

    var text = String(
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

    seen[key] = true;

    list.push({
      recommendationId:
        String(
          action.actionId ||
          "REC-" + (list.length + 1)
        ),

      pillar:
        String(
          action.pilier ||
          action.pillar ||
          ""
        ),

      topic:
        String(
          action.theme || ""
        ),

      title:
        String(
          action.title ||
          action.theme ||
          "Recommandation ESG"
        ),

      action: text,

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

      effort: null,
      expectedImpact: null,
      riskIds: [],
      targetIds: [],
      evidenceGapIds: [],

      legacyHorizon: horizon
    });
  }

  var plans =
    recommandations.planAction || {};

  (plans.immediate_0_3_months || [])
    .forEach(function(action) {
      add(action, "0-3 months");
    });

  (plans.short_term_3_6_months || [])
    .forEach(function(action) {
      add(action, "3-6 months");
    });

  (plans.structural_6_24_months || [])
    .forEach(function(action) {
      add(action, "6-24 months");
    });

  return list;
}


function adapterRoadmapLegacyESGV1_(
  recommandations
) {
  var actions = [];
  var plans =
    recommandations.planAction || {};

  function pushItems(items, horizon, legacyHorizon) {
    (items || []).forEach(
      function(action, index) {
        actions.push({
          actionId:
            String(
              action.actionId ||
              "ROADMAP-" +
              horizon +
              "-" +
              (index + 1)
            ),

          recommendationId: null,

          title:
            String(
              action.action ||
              action.title ||
              ""
            ),

          horizon: horizon,

          owner:
            String(
              action.responsableSuggere ||
              action.responsable ||
              ""
            ),

          dueDate:
            action.echeanceSuggeree ||
            action.echeance ||
            null,

          successMetric:
            action.indicateurDeSuivi ||
            null,

          evidenceOfCompletion:
            action.preuveDeRealisation ||
            null,

          status:
            String(
              action.status ||
              "NOT_STARTED"
            ),

          legacyHorizon:
            legacyHorizon
        });
      }
    );
  }

  pushItems(
    plans.immediate_0_3_months,
    ESG_ROADMAP_HORIZON_V1.MONTHS_0_3,
    "0-3 months"
  );

  pushItems(
    plans.short_term_3_6_months,
    ESG_ROADMAP_HORIZON_V1.MONTHS_3_12,
    "3-6 months"
  );

  pushItems(
    plans.structural_6_24_months,
    ESG_ROADMAP_HORIZON_V1.MONTHS_12_24,
    "6-24 months"
  );

  return actions;
}


function adapterClaimsLegacyESGV1_(resultats) {
  return (resultats || []).map(
    function(resultat) {
      var statuts =
        determinerStatutsDepuisResultatLegacyESG_(
          resultat
        );

      return {
        claimId:
          "CLAIM-" +
          String(resultat.questionId || ""),

        statement:
          String(
            resultat.question ||
            resultat.questionText ||
            resultat.questionId ||
            ""
          ),

        claimType:
          "ASSESSMENT_RESPONSE",

        relatedEntityType:
          "Response",

        relatedEntityId:
          "RESP-" +
          String(resultat.questionId || ""),

        dataStatus:
          statuts.dataStatus,

        validationStatus:
          statuts.validationStatus,

        evidenceIds: [],
        sourceRefs: []
      };
    }
  );
}


function valeurOuNullESGV1_(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return value;
}


function valeurNombreOuNullESGV1_(value) {
  var number = Number(value);

  return isFinite(number)
    ? number
    : null;
}


function TEST_ESG_LEGACY_ADAPTER_V1_LOCAL() {
  var questions =
    obtenirQuestionsESG();

  var reponses = {};

  questions.forEach(
    function(question, index) {
      reponses[question.question_id] = {
        value:
          index % 6,

        evidenceLevel:
          index % 3 === 0
            ? "MEDIUM"
            : "DECLARATIVE",

        comment:
          "Test adapter V1"
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
          ESG_REPORT_PROFILE_V1.DIAGNOSTIC
      }
    );

  var validation =
    validerESGReportSchemaV1(
      model
    );

  return {
    success:
      validation.valid === true,

    validation:
      validation,

    counts: {
      responses:
        model.assessment.responses.length,

      risks:
        model.risks.length,

      kpis:
        model.kpis.length,

      roadmap:
        model.roadmapActions.length
    },

    scores:
      model.scores
  };
}
