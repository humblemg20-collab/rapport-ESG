import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeRenderer, renderPdf } from "../src/renderer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.join(__dirname, "../samples/investor-premium.json");
const preferredOutputPath = path.resolve(process.cwd(), "sample-investor-premium.pdf");

const spec = JSON.parse(await fs.readFile(samplePath, "utf8"));

function timestampSuffix() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+$/, "")
    .replace("T", "-");
}

async function writePdfWithLockedFileFallback(preferredPath, pdfBuffer) {
  try {
    await fs.writeFile(preferredPath, pdfBuffer);

    return {
      outputPath: preferredPath,
      fallbackUsed: false,
      reason: ""
    };
  } catch (error) {
    if (error?.code !== "EBUSY" && error?.code !== "EPERM") {
      throw error;
    }

    const parsed = path.parse(preferredPath);
    const fallbackPath = path.join(
      parsed.dir,
      `${parsed.name}-${timestampSuffix()}${parsed.ext}`
    );

    await fs.writeFile(fallbackPath, pdfBuffer);

    return {
      outputPath: fallbackPath,
      fallbackUsed: true,
      reason: error.code
    };
  }
}

try {
  const result = await renderPdf(spec);

  const written = await writePdfWithLockedFileFallback(
    preferredOutputPath,
    result.pdf
  );

  process.stdout.write(
    JSON.stringify(
      {
        success: true,
        outputPath: written.outputPath,
        outputFallbackUsed: written.fallbackUsed,
        outputFallbackReason: written.reason,
        bytes: result.pdf.length,
        qa: result.qa,
        pagination: result.pagination,
        rendererVersion: result.rendererVersion
      },
      null,
      2
    ) + "\n"
  );
} finally {
  await closeRenderer();
}
