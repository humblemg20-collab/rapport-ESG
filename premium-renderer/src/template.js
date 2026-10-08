import {
  buildRuntimeTokens,
  resolveDesignProfile,
  resolveSectorProfile
} from "./profiles.js";
import { clientLabel } from "./clientVocabulary.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function score(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

function scoreText(value) {
  const n = score(value);
  return n === null ? "—" : `${Math.round(n * 100) / 100} / 100`;
}

function itemLabel(item) {
  if (item === null || item === undefined) return "";
  if (typeof item !== "object") return String(item);

  return String(
    item.theme ||
    item.subtheme ||
    item.name ||
    item.title ||
    item.description ||
    item.action ||
    item.topic ||
    item.questionText ||
    item.questionId ||
    item.riskId ||
    ""
  );
}

function severityLabel(item) {
  return clientLabel(
    item?.legacySeverity ||
    item?.priority ||
    item?.level ||
    item?.severity ||
    item?.inherentScore ||
    "PRIORITAIRE",
    "Prioritaire"
  );
}

function renderNarrative(block) {
  const narrative = String(
    block?.presentationContent?.narrative || ""
  ).trim();

  if (!narrative) {
    return "";
  }

  return `
    <div class="editorial-narrative" data-narrative-for="${esc(block?.blockId || "")}">
      ${esc(narrative)}
    </div>
  `;
}

function renderStakeholders(block) {
  const stakeholders = block?.data?.stakeholders || [];

  if (!stakeholders.length) return "";

  return `
    <section class="card">
      <div class="kicker">Parties prenantes</div>
      <div class="stakeholder-grid">
        ${stakeholders.map(item => `
          <div class="stakeholder-card">
            <strong>${esc(item?.name || item?.label || item?.stakeholder || itemLabel(item))}</strong>
            ${item?.relationship ? `<div class="muted small">${esc(item.relationship)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRiskMatrix(block) {
  const risks = (block?.data?.risks || [])
    .filter(risk => {
      const likelihood = Number(risk?.likelihood);
      const impact = Number(risk?.impact);
      return Number.isFinite(likelihood) &&
        Number.isFinite(impact) &&
        likelihood >= 1 && likelihood <= 5 &&
        impact >= 1 && impact <= 5;
    });

  if (risks.length < 3) return "";

  const cells = [];

  for (let impact = 5; impact >= 1; impact -= 1) {
    for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
      const matches = risks.filter(risk =>
        Number(risk.likelihood) === likelihood &&
        Number(risk.impact) === impact
      );

      const level = likelihood * impact;
      const className =
        level >= 16
          ? "matrix-critical"
          : level >= 10
            ? "matrix-high"
            : level >= 5
              ? "matrix-medium"
              : "matrix-low";

      cells.push(`
        <div class="risk-matrix-cell ${className}">
          <span class="matrix-score">${likelihood}×${impact}</span>
          ${matches.map(risk => `
            <span class="matrix-dot" title="${esc(itemLabel(risk))}"></span>
          `).join("")}
        </div>
      `);
    }
  }

  return `
    <section class="card">
      <div class="kicker">Matrice des risques</div>
      <div class="risk-matrix-wrap">
        <div class="risk-matrix-y">Impact ↑</div>
        <div class="risk-matrix">${cells.join("")}</div>
      </div>
      <div class="muted small matrix-axis">Probabilité →</div>
    </section>
  `;
}

function renderImageBlock(block) {
  const dataUrl = String(
    block?.data?.mediaDataUrl ||
    block?.presentationContent?.mediaDataUrl ||
    ""
  );

  if (!dataUrl.startsWith("data:image/")) {
    return "";
  }

  return `
    <figure class="media-card">
      <img src="${esc(dataUrl)}" alt="${esc(block?.data?.caption || "")}">
      ${block?.data?.caption ? `<figcaption>${esc(block.data.caption)}</figcaption>` : ""}
    </figure>
  `;
}

function renderScoreRing(value) {
  const n = score(value) ?? 0;
  const circumference = 2 * Math.PI * 42;
  const dash = (n / 100) * circumference;

  return `
    <svg class="score-ring" viewBox="0 0 100 100" role="img" aria-label="Score ${esc(scoreText(value))}">
      <circle class="track" cx="50" cy="50" r="42"></circle>
      <circle class="value" cx="50" cy="50" r="42"
        stroke-dasharray="${dash.toFixed(2)} ${circumference.toFixed(2)}"></circle>
      <text x="50" y="48" text-anchor="middle" font-size="20" font-weight="750">${esc(n.toFixed(n % 1 ? 1 : 0))}</text>
      <text x="50" y="64" text-anchor="middle" font-size="8" opacity="0.68">/ 100</text>
    </svg>
  `;
}

function renderMetric(label, value, note = "") {
  return `
    <div class="metric-card">
      <div class="metric-label">${esc(label)}</div>
      <div class="metric-value">${esc(value)}</div>
      ${note ? `<div class="metric-note">${esc(note)}</div>` : ""}
    </div>
  `;
}

function renderList(items, empty = "Non disponible") {
  const values = (items || []).map(itemLabel).filter(Boolean);

  if (!values.length) {
    return `<div class="muted small">${esc(empty)}</div>`;
  }

  return `
    <ul class="list-clean">
      ${values.map(v => `<li>${esc(v)}</li>`).join("")}
    </ul>
  `;
}

function renderFooter(model) {
  const org = model?.organization?.name || "";
  const id = model?.report?.reportId || "";

  return `
    <div class="footer">
      <span>${esc(org)} — Rapport ESG</span>
      <span>${esc(id)}</span>
    </div>
  `;
}

function renderSectionHeading(section, index) {
  const pageNumber = section?.pageNumber || index + 1;
  return `
    <header class="section-heading">
      <div class="section-number">${String(pageNumber).padStart(2, "0")} — Rapport ESG</div>
      <div>
        <h1 class="section-title">${esc(section?.title || "Rapport ESG")}</h1>
        <div class="section-rule"></div>
      </div>
    </header>
  `;
}

function renderCover(block, spec, sectorProfile) {
  const data = block?.data || {};
  const brand = spec?.brandProfile || {};
  const model = spec.documentModel;
  const logo = brand.logoDataUrl
    ? `<img class="cover-logo" alt="" src="${esc(brand.logoDataUrl)}">`
    : `<div class="cover-eyebrow">${esc(sectorProfile.eyebrow)}</div>`;

  const metadata = [
    brand.sector || model?.organization?.sector,
    brand.mainCountry || model?.organization?.mainCountry,
    data.period || model?.report?.period
  ].filter(Boolean).join("  •  ");

  return `
    <div class="cover-mark">${logo}</div>
    <div class="cover-grid">
      <div>
        <div class="cover-eyebrow">${esc(sectorProfile.eyebrow)}</div>
        <h1 class="cover-title">${esc(data.reportTitle || "RAPPORT ESG")}</h1>
        <p class="cover-subtitle">${esc(data.reportSubtitle || "Diagnostic environnemental, social et de gouvernance")}</p>
        <div class="cover-org">${esc(data.organizationName || model?.organization?.name || "")}</div>
        <div class="cover-meta">${esc(metadata)}</div>
        <div class="cover-meta">Référence : ${esc(data.reportId || model?.report?.reportId || "")}</div>
      </div>
      <div class="cover-score">
        <strong>${esc(scoreText(data?.scores?.overall || model?.scores?.esgOverallScoreV2).replace(" / 100", ""))}</strong>
        <span>Score ESG global</span>
      </div>
    </div>
  `;
}

function renderScoreBlock(block) {
  const scores = block?.data?.scores || {};
  const overall = block?.data?.displayScore ?? scores.esgOverallScoreV2;

  return `
    <section class="hero-grid no-break">
      <div class="hero-score-card">
        ${renderScoreRing(overall)}
      </div>
      <div class="metric-grid">
        ${renderMetric("Environnement", scoreText(scores.environmentScore))}
        ${renderMetric("Social", scoreText(scores.socialScore))}
        ${renderMetric("Gouvernance", scoreText(scores.governanceScore))}
        ${renderMetric("Préparation ESG", scoreText(block?.data?.readinessScore))}
        ${renderMetric("Confiance données", scoreText(scores.dataConfidenceScore))}
        ${renderMetric("Couverture preuves", scoreText(scores.evidenceCoverageScore))}
      </div>
    </section>
  `;
}

function renderDataQuality(block) {
  const q = block?.data?.dataQualityProfile || {};

  const optionalMetrics = [
    ["Complétude", q.completenessScore ?? q.completeness],
    ["Revue utilisateur", q.userReviewScore ?? q.userReview]
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  return `
    <section class="card data-quality-card">
      <div class="kicker">Qualité des données</div>
      <div class="data-quality-grid">
        <div class="method-card">
          <div class="metric-label">Méthode</div>
          <div class="method-value">${esc(clientLabel(q.methodologyVersion, "Méthode de qualité des données"))}</div>
        </div>
        ${optionalMetrics.map(([label, value]) => renderMetric(label, scoreText(value))).join("")}
      </div>
      ${Array.isArray(q.warnings) && q.warnings.length
        ? `<div class="callout warning small">${esc(q.warnings.join(" • "))}</div>`
        : ""}
    </section>
  `;
}

function renderExecutive(block) {
  const data = block?.data || {};
  const strengths = data.strengths || [];
  const gaps = data.gaps || [];
  const risks = data.risks || [];

  return `
    <section class="card">
      <div class="kicker">Lecture exécutive</div>
      ${renderNarrative(block)}
      <div class="triple-grid">
        <div>
          <h3 class="card-title">Forces</h3>
          ${renderList(strengths)}
        </div>
        <div>
          <h3 class="card-title">Écarts</h3>
          ${renderList(gaps)}
        </div>
        <div>
          <h3 class="card-title">Risques</h3>
          ${renderList(risks)}
        </div>
      </div>
    </section>
  `;
}

function renderOrganization(block) {
  const org = block?.data?.organization || {};
  const rows = [
    ["Organisation", org.name],
    ["Type", org.legalType],
    ["Secteur", org.sector],
    ["Pays principal", org.mainCountry],
    ["Zone d’intervention", org.interventionZone],
    ["Effectif", org.employeeCount],
    ["Année de création", org.creationYear]
  ].filter(([, value]) => value !== null && value !== undefined && String(value) !== "");

  return `
    <section class="card organization-card">
      <div class="kicker">Profil de l’organisation</div>
      <div class="profile-grid">
        ${rows.map(([label, value]) => `
          <div class="profile-item">
            <div class="metric-label">${esc(label)}</div>
            <div class="profile-value">${esc(String(value))}</div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderMateriality(block) {
  const data = block?.data || {};
  const topics = data.topics || [];

  return `
    <section class="card">
      <div class="kicker">Enjeux prioritaires</div>
      <table class="data-table">
        <thead><tr><th>Sujet</th><th>Pilier</th><th>Priorité / statut</th></tr></thead>
        <tbody>
          ${topics.map(topic => `
            <tr>
              <td>${esc(itemLabel(topic))}</td>
              <td>${esc(topic?.pillar || "—")}</td>
              <td>${esc(clientLabel(topic?.priority || topic?.status || "—"))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${data.disclaimer ? `<div class="callout small">${esc(data.disclaimer)}</div>` : ""}
    </section>
  `;
}

function pillarName(code) {
  return ({ E: "Environnement", S: "Social", G: "Gouvernance" })[code] || String(code || "");
}

function renderPillar(block) {
  const data = block?.data || {};
  const n = score(data.score);
  const strengths = data.strengths || [];
  const gaps = data.gaps || [];

  return `
    <section>
      <div class="pillar-head">
        <div>
          <div class="kicker">Performance ${esc(pillarName(data.pillar).toLowerCase())}</div>
          <div class="bar-track"><div class="bar-value" style="width:${n ?? 0}%"></div></div>
          <div class="muted small" style="margin-top:2mm">Lecture déterministe du diagnostic et des statuts de données.</div>
        </div>
        <div class="pillar-score">
          <strong>${esc(n === null ? "—" : Math.round(n * 100) / 100)}</strong>
          <span>Score / 100</span>
        </div>
      </div>
      ${renderNarrative(block)}
      <div class="split-grid">
        <div class="card">
          <h3 class="card-title">Points forts</h3>
          ${renderList(strengths)}
        </div>
        <div class="card">
          <h3 class="card-title">Écarts prioritaires</h3>
          ${renderList(gaps)}
        </div>
      </div>
    </section>
  `;
}

function renderTable(block) {
  const data = block?.data || {};
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return `
    <section class="card">
      ${data.title ? `<div class="kicker">${esc(data.title)}</div>` : ""}
      <table class="data-table">
        ${columns.length ? `<thead><tr>${columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>` : ""}
        <tbody>
          ${rows.map(row => `
            <tr>${(row || []).map(cell => `<td>${esc(cell)}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
      ${data.disclaimer ? `<div class="callout small">${esc(data.disclaimer)}</div>` : ""}
    </section>
  `;
}

function renderKpis(block) {
  const kpis = block?.data?.kpis || [];

  return `
    <section class="card">
      <div class="kicker">Indicateurs clés</div>
      <div class="metric-grid">
        ${kpis.map(kpi => renderMetric(
          kpi?.name || "KPI",
          kpi?.currentValue === null || kpi?.currentValue === undefined
            ? "Non disponible"
            : `${kpi.currentValue}${kpi.unit ? ` ${kpi.unit}` : ""}`,
          kpi?.targetValue !== null && kpi?.targetValue !== undefined
            ? `Cible : ${kpi.targetValue}${kpi.unit ? ` ${kpi.unit}` : ""}`
            : ""
        )).join("")}
      </div>
    </section>
  `;
}

function renderRisks(block) {
  const risks = block?.data?.risks || [];

  return `
    <section class="card">
      <div class="kicker">Risques ESG prioritaires</div>
      <div class="risk-grid">
        ${risks.map(risk => `
          <article class="risk-card">
            <div>
              <strong>${esc(itemLabel(risk))}</strong>
              ${Array.isArray(risk?.mitigationActions) && risk.mitigationActions[0]
                ? `<div class="muted small" style="margin-top:2mm">${esc(risk.mitigationActions[0])}</div>`
                : ""}
            </div>
            <div>
              <div class="risk-level">${esc(severityLabel(risk))}</div>
              <div class="muted small" style="margin-top:2mm;text-align:center">${esc(risk?.pillar || "")}</div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRecommendations(block) {
  const recommendations = block?.data?.recommendations || [];

  return `
    <section class="card">
      <div class="kicker">Actions prioritaires</div>
      <div class="risk-grid">
        ${recommendations.map(item => `
          <article class="risk-card" style="border-left-color:var(--accent)">
            <div>
              <strong>${esc(item?.action || item?.title || itemLabel(item))}</strong>
              ${item?.topic ? `<div class="muted small" style="margin-top:1.5mm">${esc(item.topic)}</div>` : ""}
            </div>
            <div>
              <div class="risk-level" style="color:var(--accent);background:var(--accent-soft)">${esc(clientLabel(item?.priority || "PRIORITAIRE", "Prioritaire"))}</div>
              <div class="muted small" style="margin-top:2mm;text-align:center">${esc(item?.pillar || "")}</div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function actionText(item) {
  return String(item?.action || item?.title || itemLabel(item) || "");
}

function renderRoadmap(block) {
  const horizons = block?.data?.horizons || {};
  const configs = [
    ["0_3_MONTHS", "0–3 mois"],
    ["3_12_MONTHS", "3–12 mois"],
    ["12_24_MONTHS", "12–24 mois"]
  ];

  const visible = configs
    .map(([key, label]) => ({ key, label, actions: Array.isArray(horizons[key]) ? horizons[key] : [] }))
    .filter(x => x.actions.length);

  if (!visible.length) return "";

  return `
    <section class="card">
      <div class="kicker">Feuille de route</div>
      <div class="roadmap">
        ${visible.map(group => `
          <div class="roadmap-item">
            <div class="roadmap-horizon">${esc(group.label)}</div>
            <div>${renderList(group.actions.map(actionText))}</div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderMethodology(block) {
  const data = block?.data || {};
  return `
    <section class="callout small">
      <strong>Méthodologie.</strong>
      Diagnostic fondé sur des règles de scoring déterministes, des statuts de données explicites et une séparation entre informations déclarées, preuves canoniques et confiance des données.
      ${data.materialityStatus ? ` Matérialité : ${esc(clientLabel(data.materialityStatus))}.` : ""}
    </section>
  `;
}

function renderDisclaimer(block) {
  return block?.data?.text
    ? `<section class="small muted">${esc(block.data.text)}</section>`
    : "";
}

function renderBlock(block) {
  switch (block?.type) {
    case "SCORE_BLOCK": return renderScoreBlock(block);
    case "DATA_QUALITY_BLOCK": return renderDataQuality(block);
    case "EXECUTIVE_SUMMARY_BLOCK": return renderExecutive(block);
    case "ORGANIZATION_BLOCK": return renderOrganization(block);
    case "MATERIALITY_BLOCK": return renderMateriality(block);
    case "STAKEHOLDER_BLOCK": return renderStakeholders(block);
    case "PILLAR_BLOCK": return renderPillar(block);
    case "TABLE_BLOCK": return renderTable(block);
    case "KPI_DASHBOARD_BLOCK": return renderKpis(block);
    case "RISK_BLOCK": return renderRisks(block);
    case "RISK_MATRIX_BLOCK": return renderRiskMatrix(block);
    case "IMAGE_BLOCK": return renderImageBlock(block);
    case "RECOMMENDATION_BLOCK": return renderRecommendations(block);
    case "ROADMAP_BLOCK": return renderRoadmap(block);
    case "METHODOLOGY_BLOCK": return renderMethodology(block);
    case "DISCLAIMER_BLOCK": return renderDisclaimer(block);
    default: return "";
  }
}

function cssVariables(tokens) {
  return Object.entries(tokens)
    .map(([key, value]) => `--${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${value};`)
    .join("");
}

function validatePresentationSpec(spec) {
  const errors = [];

  if (!spec || typeof spec !== "object") errors.push("SPEC_MISSING");
  if (spec?.contractVersion !== "ESG_PRESENTATION_CONTRACT_V2") errors.push("CONTRACT_VERSION_INVALID");
  if (!spec?.documentModel || typeof spec.documentModel !== "object") errors.push("DOCUMENT_MODEL_MISSING");
  if (!Array.isArray(spec?.documentModel?.report?.sections) || !spec.documentModel.report.sections.length) {
    errors.push("REPORT_SECTIONS_MISSING");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function renderReportHtml(spec, baseCss) {
  const validation = validatePresentationSpec(spec);
  if (!validation.valid) {
    throw new Error(`PRESENTATION_SPEC_INVALID: ${validation.errors.join(" | ")}`);
  }

  const design = resolveDesignProfile(spec.designProfile);
  const sector = resolveSectorProfile(spec.sectorProfile);
  const tokens = buildRuntimeTokens(design, spec.brandProfile || {});
  const model = spec.documentModel;
  const sections = model.report.sections || [];

  const pages = sections.map((section, index) => {
    const isCover = index === 0 || section.sectionId === "SNAP-COVER";
    const blocks = section.blocks || [];

    if (isCover) {
      const coverBlock = blocks.find(b => b.type === "COVER_BLOCK") || { data: {} };
      return `
        <section class="report-page cover" data-section-id="${esc(section.sectionId || "COVER")}">
          <div
            class="page-shell"
            data-block-id="${esc(coverBlock?.blockId || "")}"
            data-block-type="COVER_BLOCK"
            data-render-status="RENDERED"
          >
            ${renderCover(coverBlock, spec, sector)}
          </div>
        </section>
      `;
    }

    return `
      <section class="report-page" data-section-id="${esc(section.sectionId || "")}">
        <div class="page-shell">
          ${renderSectionHeading(section, index)}
          ${blocks.map(block => {
            const rendered = renderBlock(block);
            const policy = String(
              block?.presentationContent?.renderPolicy || "RENDER"
            );
            const status = rendered
              ? "RENDERED"
              : policy === "OMIT_ALLOWED"
                ? "OMITTED_ALLOWED"
                : "UNSUPPORTED";

            return `
              <div
                class="report-block"
                data-block-id="${esc(block?.blockId || "")}"
                data-block-type="${esc(block?.type || "")}"
                data-render-status="${esc(status)}"
              >
                ${rendered}
              </div>
            `;
          }).join("")}
        </div>
        ${renderFooter(model)}
      </section>
    `;
  }).join("");

  const title = `${model.organization?.name || "Organisation"} — Rapport ESG`;

  return `<!doctype html>
<html lang="${esc(spec.language || "fr")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>:root{${cssVariables(tokens)}}
${baseCss}</style>
</head>
<body>
${pages}
</body>
</html>`;
}

export const _test = {
  esc,
  itemLabel,
  score,
  scoreText,
  validatePresentationSpec,
  severityLabel
};
