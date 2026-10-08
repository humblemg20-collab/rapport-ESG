import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderReportHtml, _test as templateTest } from "../src/template.js";
import { clientLabel, findInternalClientLeaks } from "../src/clientVocabulary.js";
import { _test as rendererTest } from "../src/renderer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(__dirname, "../src/styles.css"), "utf8");

function fixture() {
  return {
    contractVersion: "ESG_PRESENTATION_CONTRACT_V2",
    reportProfile: "SNAPSHOT",
    designProfile: "INVESTOR_PREMIUM_V1",
    sectorProfile: "ENERGY",
    language: "fr",
    brandProfile: {
      organizationName: "Kivu Solar Test",
      primaryColor: "#145C4D",
      secondaryColor: "#B79252",
      sector: "Énergie solaire",
      mainCountry: "RDC",
      whiteLabel: true
    },
    documentModel: {
      schemaVersion: "ESG_REPORT_SCHEMA_V1",
      organization: {
        name: "Kivu Solar Test",
        sector: "Énergie solaire",
        mainCountry: "RDC"
      },
      scores: {
        esgOverallScoreV2: 57.2
      },
      systemMeta: {
        generatedBySystem: "AFRIGREEN24_ESG_ENGINE",
        aiGeneration: {
          primaryProvider: "OPENAI",
          fallbackProvider: "HUMBLEOS"
        }
      },
      report: {
        reportId: "ESG-TEST-001",
        profile: "SNAPSHOT",
        language: "fr",
        sections: [
          {
            sectionId: "SNAP-COVER",
            pageNumber: 1,
            title: "Cover",
            blocks: [
              {
                blockId: "SNAP-P1-COVER",
                type: "COVER_BLOCK",
                required: true,
                presentationContent: {
                  narrative: "",
                  narrativeRequired: false,
                  renderPolicy: "RENDER"
                },
                data: {
                  organizationName: "Kivu Solar Test",
                  reportTitle: "RAPPORT ESG",
                  reportSubtitle: "Diagnostic environnemental, social et de gouvernance",
                  reportId: "ESG-TEST-001",
                  scores: {
                    overall: 57.2
                  }
                }
              }
            ]
          },
          {
            sectionId: "SNAP-ENVIRONMENT",
            pageNumber: 2,
            title: "Environnement",
            blocks: [
              {
                blockId: "SNAP-PILLAR-E",
                type: "PILLAR_BLOCK",
                required: true,
                presentationContent: {
                  narrative: "Le pilier environnemental obtient un score de 61 / 100.",
                  narrativeRequired: true,
                  renderPolicy: "RENDER"
                },
                data: {
                  pillar: "E",
                  score: 61,
                  strengths: [
                    { theme: "Énergie renouvelable" }
                  ],
                  gaps: [
                    { theme: "Mesure des émissions" }
                  ]
                }
              },
              {
                type: "DATA_QUALITY_BLOCK",
                data: {
                  dataQualityProfile: {
                    methodologyVersion: "AG24_DATA_QUALITY_V1",
                    warnings: []
                  }
                }
              },
              {
                type: "METHODOLOGY_BLOCK",
                data: {
                  materialityStatus: "NOT_ASSESSED"
                }
              }
            ]
          }
        ]
      }
    }
  };
}

test("validates presentation contract", () => {
  const result = templateTest.validatePresentationSpec(fixture());
  assert.equal(result.valid, true);
});

test("escapes untrusted content", () => {
  assert.equal(
    templateTest.esc('<script>alert("x")</script>'),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
  );
});

test("does not render internal providers or system name", () => {
  const html = renderReportHtml(fixture(), css).toLowerCase();

  assert.equal(html.includes("afrigreen24"), false);
  assert.equal(html.includes("openai"), false);
  assert.equal(html.includes("humbleos"), false);
  assert.equal(html.includes("kivu solar test"), true);
});

test("uses brand primary color", () => {
  const html = renderReportHtml(fixture(), css);
  assert.equal(html.includes("--accent:#145C4D"), true);
});

test("sanitizes generated PDF filenames", () => {
  assert.equal(
    rendererTest.sanitizeFilename("Rapport ESG — Kivu / Solar"),
    "Rapport-ESG-Kivu-Solar"
  );
});


test("translates internal client-facing vocabulary", () => {
  assert.equal(
    clientLabel("AG24_DATA_QUALITY_V1"),
    "Méthode de qualité des données"
  );

  assert.equal(
    clientLabel("NOT_ASSESSED"),
    "Non évaluée"
  );

  assert.equal(
    clientLabel("CRITICAL"),
    "Critique"
  );
});

test("premium HTML contains no internal vocabulary codes", () => {
  const html = renderReportHtml(fixture(), css);

  assert.equal(html.includes("AG24_DATA_QUALITY_V1"), false);
  assert.equal(html.includes("NOT_ASSESSED"), false);
  assert.deepEqual(findInternalClientLeaks(html), []);
});


test("renders editorial narrative without altering canonical block data", () => {
  const spec = fixture();
  const html = renderReportHtml(spec, css);

  assert.equal(
    html.includes("Le pilier environnemental obtient un score de 61 / 100."),
    true
  );

  assert.equal(
    html.includes('data-narrative-for="SNAP-PILLAR-E"'),
    true
  );

  assert.equal(
    spec.documentModel.report.sections[1].blocks[0].data.score,
    61
  );
});

test("emits block identity for content-parity QA", () => {
  const html = renderReportHtml(fixture(), css);

  assert.equal(
    html.includes('data-block-id="SNAP-P1-COVER"'),
    true
  );

  assert.equal(
    html.includes('data-block-id="SNAP-PILLAR-E"'),
    true
  );
});
