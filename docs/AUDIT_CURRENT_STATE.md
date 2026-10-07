# Audit — état courant du dépôt ESG

Date de référence : 2026-10-07  
Branche source auditée : `main`  
Commit baseline : `08be04c8870176a96db31025bbcd3f2dadc38686`

## 1. Verdict

Le dépôt contient désormais le système ESG Apps Script complet et peut devenir la source canonique du code. L'existant n'est pas à réécrire intégralement : le cœur métier déterministe est déjà avancé. La priorité est d'intercaler un modèle documentaire canonique entre l'analyse métier et le rendu Google Docs/PDF.

## 2. Inventaire actuel

Le dépôt contient 33 fichiers à la racine, dont :
- moteur principal : `Code.js`
- questions : `ESGQuestions.js`
- scoring : `ESGScoring.js`
- alertes critiques : `ESGCriticalAlerts.js`
- recommandations : `ESGRecommendations.js`
- génération documentaire : `ESGReportGenerator.js`
- stockage : `ESGDataStore.js`
- import documentaire : `ESGImportSchema.js`, `ESGCanonicalNormalizer.js`, `ESGImportHumbleOS.js`
- réécriture HumbleOS contrôlée : `ESG_HumbleOS_Rewrite_Only.js`
- intégration / bridge HumbleOS : `ESG_HumbleOS_Bridge.js`
- branding / upload : plusieurs modules dédiés
- interface : `Index.html`, `Script.html`, `Styles.html`
- nombreux tests Apps Script dédiés
- manifest : `appsscript.json`

## 3. Forces à conserver

### Déterminisme métier
- Les scores, pondérations, maturité, risque, preuves, alertes et priorités sont calculés côté Apps Script.
- HumbleOS est utilisé pour la reformulation rédactionnelle, avec protection des faits et fallback.
- Le pipeline d'import documentaire sépare extraction, normalisation canonique et scoring.

### Tests déjà présents
Le dépôt contient des tests locaux, micro-réels, import, branding, rewrite et end-to-end. Ils doivent être regroupés dans une suite de tests versionnée, pas supprimés.

### Pipeline applicatif existant
`soumettreDiagnosticV2()` applique déjà :
validation → diagnostic déterministe → diagnostic numérique → qualification → rewrite contrôlé → rapport investisseur V3 → stockage.

### Rapport investisseur V3
Le V3 a déjà introduit :
- synthèse financeur
- périmètre
- positionnement ESG
- enjeux matériels
- risques et leviers financement
- gouvernance / preuves
- KPI / trajectoire
- plan d'action
- annexes méthodologiques

Il constitue une excellente base de migration vers le futur Document Engine.

## 4. Gaps architecturaux par rapport au blueprint 2026

### Gap A — absence de `ESG_REPORT_SCHEMA_V1`
Aujourd'hui, le renderer lit directement les objets de diagnostic/recommandation. Le futur renderer doit recevoir un document model canonique, indépendant du scoring.

### Gap B — score global mélange ESG et Readiness
Le V1 pondère E/S/G/R à 30/30/30/10. La cible V2 doit séparer :
- ESG Overall = E/S/G
- Readiness
- Data Confidence
- Evidence Coverage
- Funding / Investor Readiness

Le score historique V1 doit rester conservé pour compatibilité et traçabilité.

### Gap C — statuts de données incomplets
La cible V1 doit supporter :
`CONFIRMED`, `DECLARED`, `CALCULATED`, `ESTIMATE`, `NOT_AVAILABLE`, `NOT_ASSESSED`.

Ces statuts sont distincts du statut de validation :
`UNREVIEWED`, `INTERNALLY_VERIFIED`, `EXTERNALLY_ASSURED`.

### Gap D — preuve non encore modélisée comme graphe
La preuve doit suivre :
Claim → Evidence → Source → Period → Data Status → Validation Status → Assurance Status.

### Gap E — matérialité encore approximative
Le V3 emploie "enjeux matériels" comme priorisation interne et le dit explicitement. Il faut désormais un Materiality Engine Basic puis Advanced.

### Gap F — risque
Les alertes critiques sont solides, mais il manque le registre structuré :
likelihood, impact, inherent score, controls, mitigation, residual risk, owner, due date, evidence.

### Gap G — KPI
Les indicateurs recommandés doivent devenir des entités :
baseline, actual, target, gap, trend, status, scope, methodology, data status, assurance status, evidence.

### Gap H — Media Engine
Le dépôt gère déjà le logo et certains uploads, mais pas un moteur de médias ESG avec classification, droits, consentement, ranking, diversité et fallback sans image.

### Gap I — Block Registry / Composition Engine
Le rendu actuel est impératif : appels successifs à `ajouter...`.
La cible est :
Canonical Model → Block Registry → Composition Profile → Renderer.

### Gap J — QC avant export
Le PDF doit être bloqué ou dégradé proprement si les quality gates échouent.

## 5. Risques techniques identifiés

1. Le dépôt est public. Aucun secret ne doit être commité. Utiliser exclusivement Script Properties pour les secrets.
2. `appsscript.json` expose le Web App avec `ANYONE_ANONYMOUS`. Toute fonction serveur appelée par l'UI doit donc considérer l'entrée comme non fiable.
3. `ESGReportGenerator.js` est très volumineux et cumule legacy, V3, styles, annexes et helpers : dette de couplage élevée.
4. La racine du dépôt est plate : lisibilité et ownership faibles.
5. Aucun pipeline CI/CD GitHub n'est encore présent.
6. Aucun mécanisme Git connu-good n'était présent avant cet audit.
7. Un test contient une URL Worker publique en dur. Acceptable pour test contrôlé, mais à sortir en configuration si utilisé hors test.

## 6. Baseline et branches

La branche `baseline/legacy-v3-2026-10-07` fige le code tel qu'importé.

Le développement du nouveau moteur se fait dans :
`feature/esg-report-schema-v1`.

Aucun refactor fonctionnel ne doit être fait sur la baseline.

## 7. Décision d'architecture

Le système cible est :

DATA SOURCES
→ INGESTION
→ VALIDATION + PROVENANCE
→ DATA QUALITY PROFILE
→ ESG SCORE ENGINE
→ MATERIALITY ENGINE
→ RISK ENGINE
→ RECOMMENDATION / ROADMAP ENGINE
→ MEDIA ENGINE
→ ESG_REPORT_SCHEMA_V1
→ BLOCK REGISTRY
→ COMPOSITION PROFILE
→ GOOGLE DOC
→ PDF
→ QUALITY CONTROL
→ STORAGE / DATA ROOM
→ NEXT ACTION

Le PDF est un artefact de sortie, jamais la source de vérité.
