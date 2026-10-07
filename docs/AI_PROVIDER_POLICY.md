# Politique IA — ESG Document Engine

## Décision verrouillée

La couche IA du système ESG suit strictement :

```text
OPENAI — PRIMARY
       ↓ si échec / contrat invalide / Fact Guard rejeté
HUMBLEOS — FALLBACK ONLY
       ↓ si échec
DETERMINISTIC SAFE FALLBACK
```

Le fallback déterministe n'est pas un troisième fournisseur IA. Il garantit seulement la continuité du produit à partir des faits déjà calculés par AfriGreen24.

## Frontière de responsabilité

### Déterministe — source de vérité
- questionnaire et règles métier
- scoring et pondérations
- data status / validation status
- normalisation canonique
- Fact Guard
- risque calculé
- KPI calculés
- règles de matérialité
- choix des blocs
- choix des graphiques
- composition documentaire
- quality gates
- permissions / persistance / audit

### IA autorisée
- extraction de contenu non structuré
- classification sémantique assistée
- synthèse narrative
- reformulation professionnelle
- analyse qualitative sous contraintes

### IA interdite
- inventer une valeur absente
- modifier un score
- déclarer une preuve vérifiée sans validation
- transformer FOUND en CONFIRMED
- décider silencieusement d'une règle métier

## Configuration serveur

Secrets et configuration vivent dans Apps Script Script Properties.

### OpenAI
Obligatoire pour le provider principal :
- `OPENAI_API_KEY`

Optionnels :
- `OPENAI_BASE_URL` — défaut `https://api.openai.com/v1`
- `OPENAI_ORGANIZATION_ID`
- `OPENAI_PROJECT_ID`
- `OPENAI_ESG_EXTRACT_MODEL`
- `OPENAI_ESG_REWRITE_MODEL`

### HumbleOS fallback
Conserver les propriétés déjà utilisées :
- `HUMBLEOS_GATEWAY_URL`
- `HUMBLEOS_GATEWAY_SECRET`
- `HUMBLEOS_URL`
- `HUMBLEOS_API_KEY`

Aucun secret ne doit être placé dans GitHub, `Index.html`, `Script.html` ou un payload navigateur.

## Observabilité

Chaque tentative IA journalise au minimum :
- timestamp
- task
- provider
- status
- fallbackUsed
- model si disponible
- responseId si disponible
- latencyMs
- usage si disponible
- erreur nettoyée

Le contenu source et les secrets ne doivent pas être recopiés dans les logs d'exécution.

## Extraction documentaire

```text
FILE
→ local text extraction
→ field definitions
→ OpenAI Structured Output
→ contract validation
→ Fact Guard
→ canonical normalization
→ FOUND / TO_CONFIRM / MISSING
```

Si OpenAI échoue avant validation :

```text
→ HumbleOS /extract-esg
→ same contract validation
→ same Fact Guard
→ same canonical normalization
```

`FOUND` signifie « extraction exploitable avec confiance suffisante ». Il ne signifie jamais `CONFIRMED`.

## Réécriture du rapport

```text
DETERMINISTIC FACTS
→ protected narrative payload
→ OpenAI PRIMARY
→ output contract
→ restore protected facts
→ Fact Guard / safety fallback
→ presentation copy
```

Si OpenAI échoue :
- même payload protégé vers HumbleOS ;
- même validation ;
- même restauration ;
- même Fact Guard.

Si les deux échouent :
- contenu déterministe Apps Script conservé.

## White-label

Le document client ne doit jamais contenir :
- AfriGreen24
- OpenAI
- HumbleOS
- offres commerciales de la plateforme
- signature ou watermark du moteur

Ces informations restent internes dans les logs et le modèle technique.

## Tests

Local sans réseau :
- `TEST_ESG_FOUNDATION_V1_LOCAL()`

OpenAI réel :
- `TEST_ESG_OPENAI_EXTRACTION_REAL()`
- `TEST_ESG_OPENAI_REWRITE_REAL()`

Fallback réel HumbleOS :
- `TEST_ESG_HUMBLEOS_FALLBACK_REWRITE_REAL()`

Aucun test réel n'est exécuté automatiquement.
