# Plan d'implémentation — ESG Document Engine

## Principe

Ne pas réécrire les briques métier qui fonctionnent. Introduire des couches de compatibilité puis migrer progressivement le rendu.

## Phase 0 — Baseline et sécurité Git

### Fait
- code actuel importé dans GitHub
- commit source : `08be04c8870176a96db31025bbcd3f2dadc38686`
- branche snapshot : `baseline/legacy-v3-2026-10-07`
- branche de travail : `feature/esg-report-schema-v1`

### À faire avant fusion
- vérifier tous les tests Apps Script existants
- confirmer le déploiement web actuel
- documenter le deployment ID canonique
- confirmer la base Sheets canonique
- ajouter procédure rollback

Definition of Done :
- aucune modification du comportement prod
- état initial récupérable
- secrets absents de Git

## Phase 1 — Canonical Model

Créer :
- `ESGReportSchema.js`
- `ESGLegacyAdapter.js`
- `ESGDataStatus.js`
- `ESGSchemaValidator.js`

Objectif :
transformer `analyseESG` + profil + diagnostic digital en `ESG_REPORT_SCHEMA_V1`.

Aucun changement de score dans cette phase.

Tests :
- legacy full
- missing data
- NA
- no evidence
- critical alerts
- no digital module

## Phase 1B — Intake + AI Gateway

Créer / stabiliser :
- `ESGIntakeProvenance.js`
- `ESGAIConfig.js`
- `ESGOpenAIProvider.js`
- `ESGAIGateway.js`

Politique :
```text
UPLOAD ou MANUAL
→ même modèle canonique

OPENAI PRIMARY
→ HUMBLEOS FALLBACK
→ DETERMINISTIC SAFE FALLBACK
```

Règles :
- FOUND n'est jamais synonyme de CONFIRMED
- une correction manuelle prévaut sur une valeur extraite
- la provenance du document est conservée
- le rapport final reste white-label
- aucun secret dans le client ou Git

Tests :
- suite locale sans réseau
- extraction OpenAI réelle
- rewrite OpenAI réel
- fallback HumbleOS réel
- Fact Guard
- white-label QC

## Phase 2 — Evidence / Data Quality

Créer :
- `ESGEvidenceEngine.js`
- `ESGDataQualityEngine.js`

Objectif :
normaliser Claim / Evidence / provenance et calculer les indicateurs de couverture.

## Phase 3 — KPI / Risk / Materiality

Créer :
- `ESGKPIEngine.js`
- `ESGRiskEngine.js`
- `ESGMaterialityEngine.js`

Règle :
les moteurs lisent le modèle canonique et réutilisent les alertes/réponses existantes.

Materiality V1 = Basic.
Advanced uniquement lorsque les données existent.

## Phase 4 — Media Engine

Créer :
- `ESGMediaEngine.js`
- `ESGMediaValidator.js`

Intégrer :
- logo existant
- images E/S/G
- impact
- case studies
- droits
- consentement
- qualité
- classement

Le rapport doit rester premium avec zéro image.

## Phase 5 — Block Registry

Créer :
- `ESGBlockRegistry.js`
- `ESGCompositionEngine.js`
- `ESGBlockValidators.js`

Le Composition Engine décide quels blocs afficher.
Le renderer Google Docs ne contient plus les règles métier.

## Phase 6 — Snapshot 7 pages

Implémentation actuelle :
- `ESGBlockRegistry.js` — registre déterministe des blocs
- `ESGVisualizationRules.js` — choix déterministe tableaux / cartes / graphiques
- `ESGCompositionEngine.js` — composition Snapshot 7 sections logiques
- `ESGSnapshotRenderer.js` — rendu Google Docs / PDF white-label
- `ESGQualityGateEngine.js` — contrôles avant rendu
- routage par Script Property `ESG_REPORT_ENGINE_MODE`

Le mode production reste par défaut `LEGACY_V3`.
Pour tester le nouveau renderer via le parcours complet :
`ESG_REPORT_ENGINE_MODE=SNAPSHOT_V1`.

Tests obligatoires :
- mature + preuves fortes
- faible maturité
- 0 image
- 1 image
- plusieurs images
- 0 donnée carbone
- données déclaratives seulement
- risques critiques
- valeur manquante
- rapport avec OpenAI
- fallback HumbleOS
- rapport sans aucun provider IA

Snapshot passe en production uniquement après :
- `TEST_ESG_FOUNDATION_V1_LOCAL()`
- `TEST_ESG_OPENAI_EXTRACTION_REAL()`
- `TEST_ESG_OPENAI_REWRITE_REAL()`
- `TEST_ESG_HUMBLEOS_FALLBACK_REWRITE_REAL()`
- `TEST_ESG_SNAPSHOT_PDF_REAL()`
- contrôle visuel du Google Doc + PDF
- test end-to-end du parcours upload et du parcours manuel
- validation du white-label

Une fois ces gates verts, `ESG_REPORT_ENGINE_MODE` pourra être basculé de `LEGACY_V3` vers `SNAPSHOT_V1`.

## Phase 7 — Diagnostic 20 pages

Étendre le même moteur avec :
- value chain
- stakeholders
- materiality
- KPI / targets
- risk map
- evidence confidence
- impact / SDG
- funding readiness conditionnel

## Phase 8 — Premium 40+

Aucun second moteur.

Le Premium est un composition profile du même schéma.

Extensions :
- sections profondes E/S/G
- case studies
- annexes KPI
- evidence index
- framework mappings
- variantes investisseur / bailleur

## Phase 9 — Quality Gate + Release System

Avant export final :
- schema validation
- score consistency
- unsourced numeric claims
- KPI units
- target dates
- evidence links
- media rights
- chart validity
- required sections
- render check

Release :
```text
backup
→ lint/static checks
→ tests
→ deploy
→ smoke test
→ report generation test
→ PDF health check
→ persist release metadata
→ success OR rollback
```

## Ordre de migration

```text
LEGACY V3
→ CANONICAL ADAPTER
→ SCHEMA V1
→ DUAL INTAKE + PROVENANCE
→ OPENAI PRIMARY / HUMBLEOS FALLBACK
→ EVIDENCE + DATA QUALITY
→ BLOCK REGISTRY
→ SNAPSHOT
→ QC
→ DIAGNOSTIC
→ QC
→ PREMIUM
→ DATA ROOM
→ NEXT ACTION
```

## Règle de non-régression

Aucune phase ne doit supprimer la capacité de générer le rapport V3 existant tant que le profil équivalent du nouveau moteur n'a pas passé les tests de comparaison.
