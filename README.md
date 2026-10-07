# AfriGreen24 — ESG Intelligence Score & Report

Ce dépôt devient la **source canonique du code ESG AfriGreen24**.

## Architecture actuelle

Le système existant comprend :
- questionnaire ESG
- scoring déterministe
- alertes critiques
- recommandations
- import documentaire
- OpenAI comme moteur IA principal
- HumbleOS comme fallback IA contrôlé
- génération Google Docs / PDF
- stockage Google Sheets
- branding
- tests Apps Script

## Trajectoire validée

Nous migrons vers un **ESG Document Engine** :

```text
DATA
→ DUAL INTAKE (UPLOAD / MANUAL)
→ OPENAI PRIMARY / HUMBLEOS FALLBACK
→ VALIDATION / PROVENANCE
→ SCORING
→ MATERIALITY
→ RISK
→ RECOMMENDATION / ROADMAP
→ MEDIA
→ ESG_REPORT_SCHEMA_V1
→ BLOCK REGISTRY
→ COMPOSITION PROFILE
→ GOOGLE DOC
→ PDF
→ QUALITY CONTROL
→ STORAGE
→ NEXT ACTION
```

## Branches de référence

- `main` : code courant
- `baseline/legacy-v3-2026-10-07` : snapshot du code importé
- `feature/esg-report-schema-v1` : nouvelle architecture documentaire

## Règles

- pas de secret dans Git
- pas de refactor de scoring pendant la construction du Document Engine
- aucune donnée inventée
- règles métier déterministes
- OpenAI est le provider IA principal ; HumbleOS est fallback uniquement
- IA limitée à compréhension / extraction / reformulation
- le rapport client est 100 % white-label
- chaque release importante doit être testable et réversible

## Documentation

- `docs/AUDIT_CURRENT_STATE.md`
- `docs/ESG_REPORT_SCHEMA_V1.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/AI_PROVIDER_POLICY.md`


## Configuration OpenAI

La clé `OPENAI_API_KEY` doit être configurée exclusivement dans les Script Properties Apps Script.

Les modèles d'extraction et de réécriture peuvent être changés sans modifier le code via :
- `OPENAI_ESG_EXTRACT_MODEL`
- `OPENAI_ESG_REWRITE_MODEL`

Le système conserve HumbleOS comme fallback et un fallback déterministe final pour garantir la continuité du rapport.


## Moteur documentaire

Le nouveau Snapshot V1 est isolé derrière une feature flag Apps Script :

- `ESG_REPORT_ENGINE_MODE=LEGACY_V3` — comportement par défaut / production actuelle.
- `ESG_REPORT_ENGINE_MODE=SNAPSHOT_V1` — nouveau Document Engine 7 pages.

Le passage à `SNAPSHOT_V1` ne doit être fait qu'après validation des smoke tests OpenAI, fallback HumbleOS, Google Doc/PDF et quality gates.
