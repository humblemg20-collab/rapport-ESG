import http from "node:http";
import crypto from "node:crypto";
import { CONTRACT_VERSION, ENGINE_VERSION } from "./profiles.js";
import { closeRenderer, renderPdf } from "./renderer.js";

const PORT = Number(process.env.PORT || 3000);
const TOKEN = String(process.env.RENDERER_API_TOKEN || "");
const MAX_BODY_BYTES = Number(process.env.MAX_RENDER_BODY_BYTES || 5_000_000);

function json(res, status, body, headers = {}) {
  const payload = Buffer.from(JSON.stringify(body));

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": payload.length,
    "Cache-Control": "no-store",
    ...headers
  });

  res.end(payload);
}

function tokenMatches(received) {
  if (!TOKEN || !received) return false;

  const expectedBuffer = Buffer.from(TOKEN);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function authenticate(req) {
  const header = String(req.headers.authorization || "");
  const match = /^Bearer\s+(.+)$/i.exec(header);

  return Boolean(match && tokenMatches(match[1]));
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;

    if (total > MAX_BODY_BYTES) {
      const error = new Error("REQUEST_BODY_TOO_LARGE");
      error.code = "REQUEST_BODY_TOO_LARGE";
      throw error;
    }

    chunks.push(chunk);
  }

  if (!chunks.length) {
    const error = new Error("REQUEST_BODY_EMPTY");
    error.code = "REQUEST_BODY_EMPTY";
    throw error;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("INVALID_JSON");
    error.code = "INVALID_JSON";
    throw error;
  }
}

function log(event) {
  process.stdout.write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...event
    }) + "\n"
  );
}

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, {
        success: true,
        service: "esg-premium-renderer",
        version: ENGINE_VERSION
      });
    }

    if (req.method !== "POST" || req.url !== "/v1/render") {
      return json(res, 404, {
        success: false,
        error: "NOT_FOUND"
      });
    }

    if (!TOKEN) {
      log({
        event: "renderer_config_error",
        requestId,
        error: "RENDERER_API_TOKEN_MISSING"
      });

      return json(res, 503, {
        success: false,
        error: "RENDERER_NOT_CONFIGURED"
      });
    }

    if (!authenticate(req)) {
      return json(res, 401, {
        success: false,
        error: "UNAUTHORIZED"
      });
    }

    const headerContract = String(
      req.headers["x-esg-contract-version"] || ""
    );

    if (headerContract && headerContract !== CONTRACT_VERSION) {
      return json(res, 400, {
        success: false,
        error: "CONTRACT_VERSION_HEADER_INVALID"
      });
    }

    const spec = await readJsonBody(req);

    if (spec?.contractVersion !== CONTRACT_VERSION) {
      return json(res, 400, {
        success: false,
        error: "CONTRACT_VERSION_INVALID"
      });
    }

    const result = await renderPdf(spec);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": result.pdf.length,
      "Content-Disposition": `inline; filename="${result.filename}"`,
      "Cache-Control": "no-store",
      "X-ESG-Renderer-Version": result.rendererVersion,
      "X-ESG-QA-Status": result.qa.pass ? "PASS" : "FAIL",
      "X-ESG-Pagination-Compacted": String(result.pagination.compactedSections.length),
      "X-ESG-Continuation-Sections": String(result.pagination.continuationSections.length),
      "X-ESG-Fragmentation-Risk-Sections": String(result.pagination.fragmentationRiskSections.length),
      "X-Request-Id": requestId
    });

    res.end(result.pdf);

    log({
      event: "esg_pdf_render",
      requestId,
      status: "PASS",
      bytes: result.pdf.length,
      latencyMs: Date.now() - startedAt,
      designProfile: spec.designProfile,
      sectorProfile: spec.sectorProfile,
      compactedSections: result.pagination.compactedSections,
      continuationSections: result.pagination.continuationSections,
      fragmentationRiskSections: result.pagination.fragmentationRiskSections
    });
  } catch (error) {
    const code = String(error?.code || error?.message || "RENDER_FAILED")
      .slice(0, 160);

    log({
      event: "esg_pdf_render",
      requestId,
      status: "FAIL",
      error: code,
      latencyMs: Date.now() - startedAt
    });

    if (!res.headersSent) {
      json(res, code === "REQUEST_BODY_TOO_LARGE" ? 413 : 500, {
        success: false,
        error: code,
        requestId
      });
    } else {
      res.destroy();
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  log({
    event: "renderer_started",
    port: PORT,
    version: ENGINE_VERSION,
    authConfigured: Boolean(TOKEN)
  });
});

async function shutdown(signal) {
  log({
    event: "renderer_shutdown",
    signal
  });

  server.close(async () => {
    await closeRenderer();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
