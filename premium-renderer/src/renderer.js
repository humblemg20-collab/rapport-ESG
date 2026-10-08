import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ENGINE_VERSION } from "./profiles.js";
import { findInternalClientLeaks } from "./clientVocabulary.js";
import { applySmartPagination } from "./pagination.js";
import { renderReportHtml } from "./template.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, "styles.css");

let browserPromise = null;
let cssPromise = null;

async function getCss() {
  if (!cssPromise) {
    cssPromise = fs.readFile(cssPath, "utf8");
  }
  return cssPromise;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        "--disable-dev-shm-usage",
        "--font-render-hinting=medium"
      ]
    });
  }

  return browserPromise;
}

function sanitizeFilename(value) {
  return String(value || "rapport-esg")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "rapport-esg";
}

async function runContentParityQa(page, spec) {
  const manifest =
    spec?.documentModel?.report?.presentation?.contentManifest ||
    [];

  const expected = manifest.length
    ? manifest
    : (spec?.documentModel?.report?.sections || []).flatMap(section =>
        (section.blocks || []).map(block => ({
          sectionId: section.sectionId,
          blockId: block.blockId,
          type: block.type,
          required: block.required === true,
          renderPolicy: block?.presentationContent?.renderPolicy || "RENDER",
          narrativeRequired:
            block?.presentationContent?.narrativeRequired === true
        }))
      );

  const dom = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll("[data-block-id]")].map(node => ({
      blockId: node.getAttribute("data-block-id") || "",
      type: node.getAttribute("data-block-type") || "",
      status: node.getAttribute("data-render-status") || "",
      textLength: (node.innerText || "").trim().length
    }));

    const narratives = [...document.querySelectorAll("[data-narrative-for]")]
      .map(node => ({
        blockId: node.getAttribute("data-narrative-for") || "",
        textLength: (node.innerText || "").trim().length
      }));

    return {
      blocks,
      narratives
    };
  });

  const renderedById = new Map(
    dom.blocks
      .filter(item => item.blockId)
      .map(item => [item.blockId, item])
  );

  const narrativeById = new Map(
    dom.narratives
      .filter(item => item.blockId)
      .map(item => [item.blockId, item])
  );

  const missingBlocks = [];
  const unsupportedBlocks = [];
  const missingNarratives = [];
  let omittedAllowed = 0;

  for (const item of expected) {
    if (!item.blockId) {
      missingBlocks.push("BLOCK_ID_MISSING");
      continue;
    }

    const actual = renderedById.get(item.blockId);

    if (!actual) {
      if (item.renderPolicy === "OMIT_ALLOWED") {
        omittedAllowed += 1;
        continue;
      }

      missingBlocks.push(item.blockId);
      continue;
    }

    if (
      item.renderPolicy === "RENDER" &&
      actual.status !== "RENDERED"
    ) {
      unsupportedBlocks.push(item.blockId);
    }

    if (
      item.renderPolicy === "RENDER" &&
      actual.status === "RENDERED" &&
      item.type !== "COVER_BLOCK" &&
      actual.textLength === 0
    ) {
      unsupportedBlocks.push(item.blockId);
    }

    if (item.renderPolicy === "OMIT_ALLOWED") {
      omittedAllowed += 1;
    }

    if (item.narrativeRequired === true) {
      const narrative = narrativeById.get(item.blockId);

      if (!narrative || narrative.textLength === 0) {
        missingNarratives.push(item.blockId);
      }
    }
  }

  const duplicateDomIds = dom.blocks
    .map(item => item.blockId)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) !== index);

  return {
    pass:
      missingBlocks.length === 0 &&
      unsupportedBlocks.length === 0 &&
      missingNarratives.length === 0 &&
      duplicateDomIds.length === 0,

    expectedBlockCount: expected.length,
    representedBlockCount: dom.blocks.length,
    omittedAllowed,
    missingBlocks: [...new Set(missingBlocks)],
    unsupportedBlocks: [...new Set(unsupportedBlocks)],
    missingNarratives: [...new Set(missingNarratives)],
    duplicateDomIds: [...new Set(duplicateDomIds)]
  };
}

async function runVisualQa(page) {
  const browserQa = await page.evaluate(() => {
    const text = document.body.innerText || "";
    const lowerText = text.toLowerCase();

    const forbidden = ["afrigreen24", "openai", "humbleos"]
      .filter(term => lowerText.includes(term));

    const externalImages = [...document.images]
      .map(img => img.getAttribute("src") || "")
      .filter(src => /^https?:\/\//i.test(src));

    const horizontalOverflow = document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 2;

    const brokenImages = [...document.images]
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.getAttribute("src") || "");

    return {
      text,
      forbidden,
      externalImages,
      brokenImages,
      horizontalOverflow
    };
  });

  const internalCodeLeaks =
    findInternalClientLeaks(
      browserQa.text
    );

  return {
    pass:
      browserQa.forbidden.length === 0 &&
      browserQa.externalImages.length === 0 &&
      browserQa.brokenImages.length === 0 &&
      browserQa.horizontalOverflow === false &&
      internalCodeLeaks.length === 0,

    forbidden:
      browserQa.forbidden,

    externalImages:
      browserQa.externalImages,

    brokenImages:
      browserQa.brokenImages,

    horizontalOverflow:
      browserQa.horizontalOverflow,

    internalCodeLeaks
  };
}

export async function renderPdf(spec) {
  const css = await getCss();
  const html = renderReportHtml(spec, css);
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: {
      width: 1240,
      height: 1754
    }
  });

  try {
    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30_000
    });

    await page.emulateMedia({
      media: "print"
    });

    const pagination =
      await applySmartPagination(
        page
      );

    const contentParity =
      await runContentParityQa(
        page,
        spec
      );

    const visualQa = await runVisualQa(page);

    const qa = {
      ...visualQa,
      contentParity,
      pass:
        visualQa.pass === true &&
        contentParity.pass === true
    };

    if (!qa.pass) {
      const error = new Error(
        "VISUAL_QA_FAILED: " +
        JSON.stringify({
          forbidden: qa.forbidden,
          externalImages: qa.externalImages.length,
          brokenImages: qa.brokenImages.length,
          internalCodeLeaks: qa.internalCodeLeaks,
          horizontalOverflow: qa.horizontalOverflow,
          contentParity: qa.contentParity
        })
      );

      error.code = "VISUAL_QA_FAILED";
      throw error;
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });

    if (!pdf || pdf.length < 1000) {
      const error = new Error("PDF_EMPTY_OR_TOO_SMALL");
      error.code = "PDF_EMPTY_OR_TOO_SMALL";
      throw error;
    }

    const organization =
      spec?.documentModel?.organization?.name ||
      spec?.brandProfile?.organizationName ||
      "organisation";

    const reportId =
      spec?.documentModel?.report?.reportId ||
      "rapport";

    return {
      pdf,
      qa,
      pagination,
      rendererVersion: ENGINE_VERSION,
      filename:
        sanitizeFilename(
          `Rapport-ESG-${organization}-${reportId}`
        ) + ".pdf"
    };
  } finally {
    await page.close();
  }
}

export async function closeRenderer() {
  if (!browserPromise) return;

  try {
    const browser = await browserPromise;
    await browser.close();
  } finally {
    browserPromise = null;
  }
}

export const _test = {
  sanitizeFilename,
  runVisualQa,
  runContentParityQa
};
