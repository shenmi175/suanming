import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { ZodError } from "zod";
import { runCyberFatePipeline } from "@/lib/agents/runCyberFatePipeline";
import { serverEnv } from "@/lib/env/serverEnv";
import { normalizeLlmMode } from "@/lib/llm/modelConfig";
import { generateReportPdf } from "@/lib/pdf/generatePdf";
import { getReport, saveReport } from "@/lib/report/reportStore";
import { IntakeProfileSchema } from "@/lib/schemas/intake";

const defaultPort = 4000;

function traceId() {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function sanitizeMessage(message: string) {
  return message
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***");
}

function safeResponseMode() {
  try {
    return normalizeLlmMode();
  } catch {
    return serverEnv.cyberFate.llmMode || "unknown";
  }
}

function setCors(request: IncomingMessage, response: ServerResponse) {
  const origin = request.headers.origin;
  response.setHeader("Access-Control-Allow-Origin", origin || "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  response.setHeader("Access-Control-Max-Age", "86400");
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendPdf(response: ServerResponse, filename: string, pdf: Buffer) {
  response.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
  response.end(pdf);
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > 1024 * 1024) {
      throw new Error("REQUEST_BODY_TOO_LARGE");
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function reportIdFromPath(pathname: string, suffix = "") {
  const pattern = suffix
    ? new RegExp(`^/api/reports/([^/]+)/${suffix}$`)
    : /^\/api\/reports\/([^/]+)$/;
  const match = pattern.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

async function handleCreateReport(request: IncomingMessage, response: ServerResponse) {
  try {
    const json = await readJsonBody(request);
    const profile = IntakeProfileSchema.parse(json);
    const result = await runCyberFatePipeline(profile);
    await saveReport(result.report);

    sendJson(response, 200, {
      id: result.report.id,
      mode: result.mode,
      report: result.report,
      artifacts: result.artifacts,
    });
  } catch (error) {
    const id = traceId();
    const isValidationError = error instanceof ZodError || error instanceof SyntaxError;
    const message = sanitizeMessage(
      error instanceof Error ? error.message : "Unknown report generation error.",
    );

    sendJson(response, isValidationError ? 400 : 502, {
      error: isValidationError ? "INVALID_INTAKE_PAYLOAD" : "MODEL_GENERATION_FAILED",
      message: isValidationError ? "输入数据校验失败，请返回表单检查字段。" : message,
      traceId: id,
      occurredAt: new Date().toISOString(),
      mode: safeResponseMode(),
      hint: error instanceof ZodError
        ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("；")
        : "当前版本要求模型生成。请把此错误反馈给开发者，并检查模型 key、代理、模型名与响应 JSON。",
    });
  }
}

async function handleGetReport(reportId: string, response: ServerResponse) {
  const report = await getReport(reportId);
  if (!report) {
    sendJson(response, 404, { error: "REPORT_NOT_FOUND" });
    return;
  }

  sendJson(response, 200, report);
}

async function handleGetReportPdf(reportId: string, response: ServerResponse) {
  const report = await getReport(reportId);
  if (!report) {
    sendJson(response, 404, { error: "REPORT_NOT_FOUND" });
    return;
  }

  try {
    const pdf = await generateReportPdf(report);
    sendPdf(response, `${report.id}.pdf`, pdf);
  } catch (error) {
    sendJson(response, 500, {
      error: "PDF_GENERATION_FAILED",
      message: error instanceof Error ? error.message : "Unknown PDF generation error.",
    });
  }
}

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  setCors(request, response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const { pathname } = url;

  if (request.method === "GET" && pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "cyber-fate-backend",
      mode: safeResponseMode(),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/reports") {
    await handleCreateReport(request, response);
    return;
  }

  const pdfReportId = reportIdFromPath(pathname, "pdf");
  if (request.method === "GET" && pdfReportId) {
    await handleGetReportPdf(pdfReportId, response);
    return;
  }

  const reportId = reportIdFromPath(pathname);
  if (request.method === "GET" && reportId) {
    await handleGetReport(reportId, response);
    return;
  }

  sendJson(response, 404, { error: "NOT_FOUND" });
}

export function createBackendServer() {
  return createServer((request, response) => {
    void handleRequest(request, response).catch((error) => {
      sendJson(response, 500, {
        error: "BACKEND_INTERNAL_ERROR",
        message: error instanceof Error ? sanitizeMessage(error.message) : "Unknown backend error.",
      });
    });
  });
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.BACKEND_PORT || defaultPort);
  const host = process.env.BACKEND_HOST || "0.0.0.0";
  createBackendServer().listen(port, host, () => {
    console.log(`Cyber Fate backend listening on http://${host}:${port}`);
  });
}
