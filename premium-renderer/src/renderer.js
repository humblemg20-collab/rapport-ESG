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

function countChromiumPdfPages(pdfBuffer) {
  const source = Buffer.from(pdfBuffer).toString("latin1");
  const matches = source.match(/\/Type\s*\/Page(?!s)\b/g);
  return matches ? matches.length : 0;
}

async function renderSingleSectionPageCount(page, sectionId) {
  const state = await page.evaluate(targetSectionId => {
    const sections = [...document.querySelectorAll(".report-page")];

    const snapshot = {
      bodyStyle: document.body.getAttribute("style"),
      sections: sections.map(section => ({
        sectionId: section.dataset.sectionId || "",
        style: section.getAttribute("style")
      }))
    };

    sections.forEach(section => {
      const active = (section.dataset.sectionId || "") === targetSectionId;

      if (active) {
        section.style.display = "block";
        section.style.breakAfter = "auto";
        section.style.pageBreakAfter = "auto";
      } else {
        section.style.display = "none";
      }
    });

    document.body.style.margin = "0";
    document.body.style.padding = "0";

    return snapshot;
  }, sectionId);

  try {
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

    return Math.max(1, countChromiumPdfPages(pdf));
  } finally {
    await page.evaluate(snapshot => {
      if (snapshot.bodyStyle === null) {
        document.body.removeAttribute("style");
      } else {
        document.body.setAttribute("style", snapshot.bodyStyle);
      }

      const byId = new Map(
        snapshot.sections.map(item => [item.sectionId, item.style])
      );

      [...document.querySelectorAll(".report-page")]
        .forEach(section => {
          const key = section.dataset.sectionId || "";
          const previousStyle = byId.get(key);

          if (previousStyle === null || previousStyle === undefined) {
            section.removeAttribute("style");
          } else {
            section.setAttribute("style", previousStyle);
          }
        });
    }, state);
  }
}

async function runPhysicalSectionPreflight(page, spec) {
  if (String(spec?.reportProfile || "").toUpperCase() !== "SNAPSHOT") {
    return {
      enabled: false,
      sections: [],
      rescuedSections: [],
      unresolvedSections: []
    };
  }

  const sectionIds = await page.evaluate(() =>
    [...document.querySelectorAll(".report-page:not(.cover)")]
      .map(section => section.dataset.sectionId || "")
      .filter(Boolean)
  );

  const results = [];
  const rescuedSections = [];
  const unresolvedSections = [];

  for (const sectionId of sectionIds) {
    const before = await renderSingleSectionPageCount(page, sectionId);
    let after = before;
    let rescueApplied = false;

    if (before > 1) {
      await page.evaluate(targetSectionId => {
        const section = [...document.querySelectorAll(".report-page")]
          .find(item => (item.dataset.sectionId || "") === targetSectionId);

        if (section) {
          section.classList.add("density-rescue");
          section.dataset.physicalPreflightRescue = "true";
        }
      }, sectionId);

      rescueApplied = true;
      rescuedSections.push(sectionId);
      after = await renderSingleSectionPageCount(page, sectionId);
    }

    if (after > 1) {
      unresolvedSections.push(sectionId);
    }

    results.push({
      sectionId,
      pagesBefore: before,
      pagesAfter: after,
      rescueApplied,
      resolvedToSinglePage: after === 1
    });
  }

  return {
    enabled: true,
    sections: results,
    rescuedSections,
    unresolvedSections
  };
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
    const blocks = [...document.querySelectorAll("[data-block-id]")].map(node => {
      const itemCounts = {};

      [...node.querySelectorAll("[data-parity-item]")]
        .forEach(item => {
          const key = item.getAttribute("data-parity-item") || "";
          if (!key) return;
          itemCounts[key] = (itemCounts[key] || 0) + 1;
        });

      const text = (node.innerText || "").trim();

      return {
        blockId: node.getAttribute("data-block-id") || "",
        type: node.getAttribute("data-block-type") || "",
        status: node.getAttribute("data-render-status") || "",
        text,
        textLength: text.length,
        itemCounts
      };
    });

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
  const itemCountMismatches = [];
  const criticalValueMismatches = [];
  let omittedAllowed = 0;

  const normalizeText = value =>
    String(value ?? "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

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

    const expectedItemCounts = item.itemCounts || {};

    for (const [key, rawExpected] of Object.entries(expectedItemCounts)) {
      const expectedCount = Number(rawExpected || 0);
      const actualCount = Number(actual?.itemCounts?.[key] || 0);

      if (expectedCount !== actualCount) {
        itemCountMismatches.push({
          blockId: item.blockId,
          key,
          expected: expectedCount,
          actual: actualCount
        });
      }
    }

    const normalizedActualText = normalizeText(actual?.text || "");

    for (const rawValue of item.criticalValues || []) {
      const expectedValue = normalizeText(rawValue);

      if (
        expectedValue &&
        !normalizedActualText.includes(expectedValue)
      ) {
        criticalValueMismatches.push({
          blockId: item.blockId,
          value: String(rawValue)
        });
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
      itemCountMismatches.length === 0 &&
      criticalValueMismatches.length === 0 &&
      duplicateDomIds.length === 0,

    expectedBlockCount: expected.length,
    representedBlockCount: dom.blocks.length,
    omittedAllowed,
    missingBlocks: [...new Set(missingBlocks)],
    unsupportedBlocks: [...new Set(unsupportedBlocks)],
    missingNarratives: [...new Set(missingNarratives)],
    itemCountMismatches,
    criticalValueMismatches,
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

    const cover = document.querySelector(".report-page.cover");
    const coverGrid = cover?.querySelector(".cover-grid");
    const coverScore = cover?.querySelector(".cover-score");

    let coverBalance = {
      pass: true,
      heroTopRatio: null,
      heroBottomRatio: null,
      scoreBottomRatio: null
    };

    if (cover && coverGrid) {
      const coverRect = cover.getBoundingClientRect();
      const gridRect = coverGrid.getBoundingClientRect();
      const scoreRect = coverScore?.getBoundingClientRect();

      const height = Math.max(1, coverRect.height);
      const heroTopRatio = (gridRect.top - coverRect.top) / height;
      const heroBottomRatio = (gridRect.bottom - coverRect.top) / height;
      const scoreBottomRatio = scoreRect
        ? (scoreRect.bottom - coverRect.top) / height
        : null;

      coverBalance = {
        pass:
          heroTopRatio >= 0.12 &&
          heroTopRatio <= 0.40 &&
          heroBottomRatio <= 0.88 &&
          (
            scoreBottomRatio === null ||
            scoreBottomRatio <= 0.88
          ),
        heroTopRatio: Number(heroTopRatio.toFixed(3)),
        heroBottomRatio: Number(heroBottomRatio.toFixed(3)),
        scoreBottomRatio:
          scoreBottomRatio === null
            ? null
            : Number(scoreBottomRatio.toFixed(3))
      };
    }

    return {
      text,
      forbidden,
      externalImages,
      brokenImages,
      horizontalOverflow,
      coverBalance
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
      browserQa.coverBalance.pass === true &&
      internalCodeLeaks.length === 0,

    forbidden:
      browserQa.forbidden,

    externalImages:
      browserQa.externalImages,

    brokenImages:
      browserQa.brokenImages,

    horizontalOverflow:
      browserQa.horizontalOverflow,

    coverBalance:
      browserQa.coverBalance,

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

    const physicalPreflight =
      await runPhysicalSectionPreflight(
        page,
        spec
      );

    const contentParity =
      await runContentParityQa(
        page,
        spec
      );

    const visualQa = await runVisualQa(page);

    const printFlow = {
      pass:
        pagination.orphanRiskSections.length === 0,

      packedSections:
        pagination.packedSections,

      rescueSections:
        pagination.rescueSections,

      continuationSections:
        pagination.continuationSections,

      fragmentationRiskSections:
        pagination.fragmentationRiskSections,

      orphanRiskSections:
        pagination.orphanRiskSections,

      physicalPreflight
    };

    const qa = {
      ...visualQa,
      contentParity,
      printFlow,
      pass:
        visualQa.pass === true &&
        contentParity.pass === true &&
        printFlow.pass === true
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
          coverBalance: qa.coverBalance,
          contentParity: qa.contentParity,
          printFlow: qa.printFlow
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

    const physicalPageCount =
      countChromiumPdfPages(
        pdf
      );

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
      pagination: {
        ...pagination,
        physicalPreflight,
        physicalPageCount
      },
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
  runContentParityQa,
  countChromiumPdfPages,
  runPhysicalSectionPreflight
};
