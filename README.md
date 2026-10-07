# AfriGreen24 — ESG Intelligence Score & Report

Ce dépôt devient la **source canonique du code ESG AfriGreen24**.

## Architecture actuelle

Le système existant comprend :
- questionnaire ESG
- scoring déterministe
- alertes critiques
- recommandations
- import documentaire
- HumbleOS rewrite contrôlé
- génération Google Docs / PDF
- stockage Google Sheets
- branding
- tests Apps Script

## Trajectoire validée

Nous migrons vers un **ESG Document Engine** :

```text
DATA
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
- IA limitée à compréhension / extraction / reformulation
- chaque release importante doit être testable et réversible

## Documentation

- `docs/AUDIT_CURRENT_STATE.md`
- `docs/ESG_REPORT_SCHEMA_V1.md`
- `docs/IMPLEMENTATION_PLAN.md`
