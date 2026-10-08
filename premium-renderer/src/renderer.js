import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ENGINE_VERSION } from "./profiles.js";
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

async function runVisualQa(page) {
  return page.evaluate(() => {
    const text = (document.body.innerText || "").toLowerCase();
    const forbidden = ["afrigreen24", "openai", "humbleos"]
      .filter(term => text.includes(term));

    const externalImages = [...document.images]
      .map(img => img.getAttribute("src") || "")
      .filter(src => /^https?:\/\//i.test(src));

    const horizontalOverflow = document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 2;

    return {
      pass:
        forbidden.length === 0 &&
        externalImages.length === 0 &&
        horizontalOverflow === false,
      forbidden,
      externalImages,
      horizontalOverflow
    };
  });
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

    const qa = await runVisualQa(page);

    if (!qa.pass) {
      const error = new Error(
        "VISUAL_QA_FAILED: " +
        JSON.stringify({
          forbidden: qa.forbidden,
          externalImages: qa.externalImages.length,
          horizontalOverflow: qa.horizontalOverflow
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
  sanitizeFilename
};
