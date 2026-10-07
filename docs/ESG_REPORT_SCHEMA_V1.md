# ESG_REPORT_SCHEMA_V1

Statut : **contrat technique de référence**  
Objectif : découpler le diagnostic ESG du rendu documentaire.

## 1. Invariants

1. Une donnée possède une source canonique.
2. Aucun chiffre absent ne peut être inventé.
3. Le scoring reste déterministe et versionné.
4. Le Document Engine ne recalcule pas le diagnostic.
5. Le renderer ne décide pas des règles métier.
6. Les données factuelles peuvent remonter à leur provenance.
7. Les trois produits utilisent le même modèle canonique.
8. Un rapport sans image doit rester premium.
9. Tout fallback est explicite, testable et journalisable.
10. Les données historiques V1 restent conservées.

## 2. Statuts canoniques de donnée

```text
CONFIRMED
DECLARED
CALCULATED
ESTIMATE
NOT_AVAILABLE
NOT_ASSESSED
```

### Validation / assurance séparée

```text
UNREVIEWED
INTERNALLY_VERIFIED
EXTERNALLY_ASSURED
```

Un statut de donnée ne doit jamais être déduit du statut de validation.

## 3. Scoring V2

### ESG
```text
environmentScore
socialScore
governanceScore
esgOverallScoreV2
```

`esgOverallScoreV2` ne contient pas Readiness.

### Scores séparés
```text
readinessScore
dataConfidenceScore
evidenceCoverageScore
fundingReadinessScore?
legacyGlobalScoreV1
```

Le `legacyGlobalScoreV1` reste stocké pour comparabilité avec les rapports historiques.

## 4. Entités canoniques

```text
Organization
Assessment
Response
Score
KPI
Target
MaterialityTopic
Risk
Mitigation
Recommendation
RoadmapAction
Claim
Evidence
Media
Framework
FrameworkMapping
DataQualityProfile
Report
Section
Block
```

## 5. Organization

```js
{
  organizationId,
  name,
  legalType,
  sector,
  countries[],
  mainCountry,
  employeeCount?,
  annualRevenueOrBudget?,
  creationYear?,
  interventionZone?,
  activities[],
  beneficiaries?,
  valueChainSummary?,
  sourceRefs[]
}
```

## 6. Assessment

```js
{
  assessmentId,
  organizationId,
  schemaVersion,
  scoringVersion,
  questionnaireVersion,
  startedAt,
  completedAt?,
  period,
  responses[],
  scores,
  dataQualityProfileId,
  sourceRefs[]
}
```

## 7. KPI

```js
{
  kpiId,
  name,
  pillar,
  topic,
  unit,
  baselineValue?,
  baselineYear?,
  currentValue?,
  currentYear?,
  targetValue?,
  targetYear?,
  gap?,
  trend?,
  status?,
  scope?,
  methodology?,
  dataStatus,
  validationStatus,
  assuranceStatus?,
  evidenceIds[],
  sourceRefs[]
}
```

### Règles
- `gap`, `trend` et `status` sont calculés.
- Une valeur seule → KPI card.
- baseline + current → comparaison / delta.
- baseline + current + target → progress / target card.
- >= 3 périodes → line chart.
- 2–6 catégories homogènes → bar chart.
- probabilité + impact → risk heatmap.
- données insuffisantes → aucun graphique inventé.

## 8. Claim / Evidence

### Claim
```js
{
  claimId,
  statement,
  claimType,
  relatedEntityType,
  relatedEntityId,
  dataStatus,
  evidenceIds[],
  sourceRefs[]
}
```

### Evidence
```js
{
  evidenceId,
  evidenceType,
  title,
  source,
  sourceRef?,
  dateOrPeriod?,
  fileId?,
  url?,
  validationStatus,
  assuranceStatus?,
  rightsStatus?,
  notes?
}
```

Chaîne obligatoire quand applicable :

```text
CLAIM
→ EVIDENCE
→ SOURCE
→ PERIOD
→ DATA STATUS
→ VALIDATION STATUS
→ ASSURANCE STATUS
```

## 9. DataQualityProfile

```js
{
  dataQualityProfileId,
  assessmentId,
  totalExpected,
  confirmedCount,
  declaredCount,
  calculatedCount,
  estimateCount,
  notAvailableCount,
  notAssessedCount,
  evidenceCoverageScore,
  dataConfidenceScore,
  warnings[],
  limitations[]
}
```

## 10. Materiality

### Basic
```js
{
  materialityTopicId,
  name,
  pillar,
  impactSignificance,
  stakeholderRelevance,
  evidenceIds[],
  priority,
  level: "BASIC"
}
```

### Advanced
```js
{
  materialityTopicId,
  name,
  pillar,
  actualOrPotential,
  positiveOrNegative,
  impactMateriality,
  financialMateriality,
  riskOrOpportunity,
  timeHorizon,
  valueChainStage,
  evidenceIds[],
  priority,
  level: "ADVANCED"
}
```

Aucune matrice de double matérialité ne doit être dessinée si les deux axes ne sont pas réellement évalués.

## 11. Risk

```js
{
  riskId,
  pillar,
  materialTopicId?,
  description,
  cause?,
  consequence?,
  likelihood?,
  impact?,
  inherentScore?,
  existingControls[],
  mitigationActions[],
  owner?,
  dueDate?,
  residualLikelihood?,
  residualImpact?,
  residualScore?,
  evidenceIds[],
  status,
  timeHorizon?
}
```

La heatmap n'est autorisée que si likelihood + impact sont disponibles.

## 12. Recommendation / Roadmap

### Recommendation
```js
{
  recommendationId,
  pillar,
  topic,
  title,
  action,
  rationale,
  priority,
  effort?,
  expectedImpact?,
  riskIds[],
  targetIds[],
  evidenceGapIds[]
}
```

### RoadmapAction
```js
{
  actionId,
  recommendationId?,
  title,
  horizon,
  owner?,
  dueDate?,
  successMetric?,
  evidenceOfCompletion?,
  status
}
```

Horizons V2 :
```text
0_3_MONTHS
3_12_MONTHS
12_24_MONTHS
```

## 13. Media

```js
{
  mediaId,
  category,
  fileType,
  width?,
  height?,
  aspectRatio?,
  caption?,
  credit?,
  source?,
  capturedAt?,
  location?,
  rightsStatus,
  consentStatus?,
  evidenceFor[],
  qualityScore?,
  validationStatus
}
```

Catégories :
```text
LOGO
COVER
ENVIRONMENT
SOCIAL
GOVERNANCE
IMPACT
CASE_STUDY
TEAM
FACILITY
DOCUMENT_EVIDENCE
```

### Pipeline média
```text
UPLOAD
→ MIME / integrity
→ rights / consent
→ technical quality
→ duplicate detection
→ semantic classification
→ section eligibility
→ ranking
→ diversity
→ crop-safe layout
→ caption / credit
→ placement
```

Fallback :
- 0 image → layout data-first
- 1 image → hero secondaire / case study
- 2–4 images → galerie seulement si complémentarité
- >4 → ranking + sélection

## 14. Report

```js
{
  reportId,
  organizationId,
  assessmentId,
  schemaVersion: "ESG_REPORT_SCHEMA_V1",
  profile,
  language,
  period,
  generatedAt,
  sections[],
  dataQualityProfileId,
  status,
  outputRefs
}
```

Profils :
```text
SNAPSHOT
DIAGNOSTIC
PREMIUM
```

## 15. Block Registry

Blocs V1 :

```text
COVER_BLOCK
SECTION_COVER_BLOCK
REPORT_METADATA_BLOCK
EXECUTIVE_SUMMARY_BLOCK
SCORE_BLOCK
DATA_QUALITY_BLOCK
ORGANIZATION_BLOCK
VALUE_CHAIN_BLOCK
STAKEHOLDER_BLOCK
MATERIALITY_BLOCK
PILLAR_BLOCK
KPI_BLOCK
TARGET_BLOCK
CHART_BLOCK
TABLE_BLOCK
TEXT_BLOCK
IMAGE_BLOCK
IMAGE_GALLERY_BLOCK
QUOTE_BLOCK
CASE_STUDY_BLOCK
RISK_BLOCK
RISK_MATRIX_BLOCK
POLICY_BLOCK
EVIDENCE_BLOCK
IMPACT_BLOCK
SDG_BLOCK
RECOMMENDATION_BLOCK
ROADMAP_BLOCK
FUNDING_READINESS_BLOCK
FRAMEWORK_INDEX_BLOCK
METHODOLOGY_BLOCK
DISCLAIMER_BLOCK
```

Chaque bloc possède :
```js
{
  blockId,
  type,
  required,
  dataRefs[],
  visibilityRule?,
  renderConfig?,
  fallbackType?,
  validationRules[]
}
```

## 16. Profils de composition

### Snapshot
Cible : 7 pages
1. Cover
2. Executive ESG Snapshot
3. Organization & Material Issues
4. Environment
5. Social
6. Governance & ESG Risks
7. Priority Actions & Roadmap

### Diagnostic
Cible : ~20 pages de base
1. Cover
2. About this assessment
3. Executive summary
4. ESG Intelligence Score
5. Organization profile
6. Business model & value chain
7. Stakeholders & materiality
8. Environmental assessment
9. Environmental KPI & targets
10. Social assessment
11. Social KPI & targets
12. Governance assessment
13. Governance KPI & controls
14. ESG risk map
15. Evidence & data confidence
16. Impact & SDG contribution
17. Priority recommendations
18. Roadmap 0–3
19. Roadmap 3–24 & Funding Readiness
20. Methodology / Frameworks / Disclaimer

### Premium
Cible : ~40 pages de base, extensible uniquement par contenu réel.
Le Premium utilise les mêmes entités et les mêmes blocs avec davantage de profondeur.

## 17. Quality Gates

Ordre minimal :

```text
SCHEMA_VALID
→ SCORE_CONSISTENT
→ NO_UNSOURCED_NUMERIC_CLAIM
→ KPI_UNITS_VALID
→ TARGET_YEARS_VALID
→ CLAIM_EVIDENCE_LINKS_VALID
→ MEDIA_RIGHTS_VALID
→ CHART_DATA_VALID
→ NO_EMPTY_REQUIRED_SECTION
→ PAGE_OVERFLOW_CHECK
→ PDF_RENDER_CHECK
→ FINAL_REPORT
```

Chaque gate retourne :
```js
{
  gate,
  status: "PASS" | "WARN" | "FAIL",
  errors[],
  warnings[],
  timestamp
}
```

## 18. Legacy Adapter

Un adaptateur doit mapper l'existant sans modifier le scoring :

```text
diagnostic.scores.environnement → scores.environmentScore
diagnostic.scores.social → scores.socialScore
diagnostic.scores.gouvernance → scores.governanceScore
diagnostic.scores.readiness → scores.readinessScore
diagnostic.scores.globalAjuste → scores.legacyGlobalScoreV1
diagnostic.scores.preuves → evidenceCoverageScore
diagnostic.scores.qualiteDonnees → dataQualityScore
diagnostic.scores.niveauConfiance → dataConfidenceScore
diagnostic.alertesAvancees / alertesCritiques → risks[]
recommandations.indicateursRecommandes → kpis[]
recommandations.planAction → roadmapActions[]
```

Les champs absents deviennent explicitement `NOT_AVAILABLE` ou `NOT_ASSESSED`; jamais une valeur inventée.

## 19. Frontière IA / déterminisme

Déterministe :
- scoring
- pondérations
- calcul KPI
- score risque
- inclusion sections
- choix graphique
- règle layout
- media eligibility/ranking
- quality gates
- statuts

IA autorisée :
- synthèse narrative
- reformulation
- classification sémantique initiale
- extraction non structurée
- analyse qualitative

IA interdite :
- inventer un chiffre
- modifier silencieusement un score
- déclarer une preuve inexistante
- déclarer une assurance externe non fournie

## 20. Definition of Done — Schema V1

Le schéma est considéré figé lorsque :
1. tout diagnostic V1 peut être adapté sans perte ;
2. un rapport peut être composé sans accès direct aux fonctions de scoring ;
3. Snapshot, Diagnostic et Premium utilisent le même modèle ;
4. les données manquantes sont explicites ;
5. les facts peuvent être reliés à une provenance ;
6. les blocs disposent d'un fallback ;
7. les quality gates sont définis ;
8. les tests de compatibilité V1 passent.
