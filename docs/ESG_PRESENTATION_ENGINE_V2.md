# ESG Presentation Engine V2

## Transformation

Turn the canonical ESG diagnosis into an investment-grade, white-label
publication without changing any business fact, score, risk or recommendation.

The presentation layer is intentionally separated from the ESG business engine.

```
ESG_REPORT_SCHEMA_V1
        ↓
ESG Composition Engine
        ↓
Presentation Spec
        ↓
Brand Profile + Design Profile + Sector Profile
        ↓
HTML / CSS / SVG renderer
        ↓
Chromium / Playwright
        ↓
PDF
        ↓
Visual QA
```

## Invariants

1. The renderer never recalculates ESG scores.
2. The renderer never changes business rules.
3. The renderer never invents missing data.
4. White-label output must not expose AfriGreen24, OpenAI, HumbleOS or internal
   migration/debug information.
5. The same canonical model can feed multiple presentation profiles.
6. A missing logo or image must never block rendering.
7. Physical page count is non-blocking; readability and block integrity matter.
8. Rendering failure must fall back to the existing Google Docs/PDF path until
   the premium renderer is explicitly activated.

## Independent dimensions

### Report depth
- SNAPSHOT
- DIAGNOSTIC
- PREMIUM

### Design profile
- INVESTOR_PREMIUM_V1
- INSTITUTIONAL_V1
- IMPACT_V1

V2 initially implements INVESTOR_PREMIUM_V1 only. Other profiles remain
declared but cannot silently activate until validated.

### Sector profile
- GENERIC
- ENERGY
- AGRICULTURE
- FINTECH
- MANUFACTURING
- HEALTH
- INFRASTRUCTURE
- NGO_IMPACT

The sector profile influences visual vocabulary and optional editorial choices.
It never modifies ESG facts.

## Runtime contract

Apps Script sends a deterministic payload:

```json
{
  "contractVersion": "ESG_PRESENTATION_CONTRACT_V2",
  "reportProfile": "SNAPSHOT",
  "designProfile": "INVESTOR_PREMIUM_V1",
  "sectorProfile": "ENERGY",
  "brandProfile": {},
  "documentModel": {}
}
```

The renderer returns an `application/pdf` response.

## Security

The renderer endpoint uses a Bearer token stored only in:
- Apps Script Script Property: `ESG_PREMIUM_RENDERER_TOKEN`
- renderer environment variable: `RENDERER_API_TOKEN`

Never commit either value.

## Rollout

The premium renderer is OFF by default.

Script Properties:
- `ESG_PREMIUM_RENDERER_ENABLED=true|false`
- `ESG_PREMIUM_RENDERER_URL=https://...`
- `ESG_PREMIUM_RENDERER_TOKEN=...`
- `ESG_PRESENTATION_DESIGN_PROFILE=INVESTOR_PREMIUM_V1`

The existing `LEGACY_V3` / `SNAPSHOT_V1` router remains untouched during the
foundation phase.

## Failure model

```
VALIDATE CONTRACT
→ AUTHENTICATE
→ COMPOSE HTML
→ RENDER PDF
→ VERIFY NON-EMPTY PDF
→ RETURN

failure
→ structured log
→ no retry inside renderer
→ caller may fall back to Google Docs renderer
```

## Visual system target

The renderer uses reusable components rather than page-specific hardcoding:
- cover
- section opener
- hero score
- score cards
- data-confidence meter
- pillar dashboard
- KPI / target cards
- risk cards
- risk matrix
- recommendation cards
- roadmap timeline
- evidence / methodology notes
- tables
- optional semantic media

The renderer is a presentation system, not a second ESG engine.
