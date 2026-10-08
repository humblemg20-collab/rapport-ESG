# ESG Premium Renderer

Separate Node/Chromium service for investment-grade white-label ESG PDFs.

## Why it exists

Google Docs remains the editable/fallback output. This service is the visual
publication layer:

```
Canonical ESG model
→ Composition Engine
→ Presentation Contract V2
→ HTML / CSS / SVG
→ Playwright Chromium
→ PDF
```

The renderer does not calculate ESG scores or make business decisions.

## Local start

Requirements:
- Node.js 20+
- Chromium installed by Playwright

```bash
cd premium-renderer
npm install
npx playwright install chromium

export RENDERER_API_TOKEN="local-dev-token"
npm start
```

Health:

```bash
curl http://localhost:3000/health
```

Render:

```bash
curl -X POST http://localhost:3000/v1/render \
  -H "Authorization: Bearer local-dev-token" \
  -H "Content-Type: application/json" \
  -H "X-ESG-Contract-Version: ESG_PRESENTATION_CONTRACT_V2" \
  --data @samples/investor-premium.json \
  --output report.pdf
```

## Unit tests

```bash
npm test
```

The sample render also prints deterministic pagination telemetry:

- sections automatically compacted;
- sections still requiring continuation after compaction;
- visual-QA status;
- generated PDF byte size.

Physical page count remains non-blocking. The quality objective is to avoid
sparse/accidental continuation pages while preserving readable content.

Tests cover:
- contract validation
- HTML escaping
- white-label exclusion of internal providers/system names
- brand token application
- filename sanitization

## Runtime environment

Required:
- `RENDERER_API_TOKEN`

Optional:
- `PORT=3000`
- `MAX_RENDER_BODY_BYTES=5000000`

## Security model

- `/health` is public and contains no secrets.
- `/v1/render` requires a Bearer token.
- request body size is bounded.
- untrusted model values are HTML-escaped.
- remote HTTP images are rejected by visual QA.
- only data-URI media should be embedded.
- internal system/provider names fail visual QA if they become visible.
- no retry is performed inside the renderer.

## Apps Script properties

The Apps Script client remains disabled until explicitly configured:

```
ESG_PREMIUM_RENDERER_ENABLED=true
ESG_PREMIUM_RENDERER_URL=https://renderer.example.com
ESG_PREMIUM_RENDERER_TOKEN=<secret>
ESG_PRESENTATION_DESIGN_PROFILE=INVESTOR_PREMIUM_V1
```

Do not commit secrets.

## Failure path

Premium rendering is not yet wired as the production default.

Target rollout:

```
Premium renderer
  PASS → persist premium PDF
  FAIL → log structured error → existing Google Docs/PDF renderer
```

This keeps the current production trajectory recoverable while the V2 visual
engine is validated.
