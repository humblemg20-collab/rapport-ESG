import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeRenderer, renderPdf } from "../src/renderer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.join(__dirname, "../samples/investor-premium.json");
const outputPath = path.resolve(process.cwd(), "sample-investor-premium.pdf");

const spec = JSON.parse(await fs.readFile(samplePath, "utf8"));

try {
  const result = await renderPdf(spec);
  await fs.writeFile(outputPath, result.pdf);

  process.stdout.write(
    JSON.stringify(
      {
        success: true,
        outputPath,
        bytes: result.pdf.length,
        qa: result.qa,
        rendererVersion: result.rendererVersion
      },
      null,
      2
    ) + "\n"
  );
} finally {
  await closeRenderer();
}
