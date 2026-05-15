import { NextResponse } from "next/server";
import { runCyberFatePipeline } from "@/lib/agents/runCyberFatePipeline";
import { normalizeLlmMode } from "@/lib/llm/modelConfig";
import { saveReport } from "@/lib/report/reportStore";
import { IntakeProfileSchema } from "@/lib/schemas/intake";
import { serverEnv } from "@/lib/env/serverEnv";
import { ZodError } from "zod";

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

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const profile = IntakeProfileSchema.parse(json);
    const result = await runCyberFatePipeline(profile);
    await saveReport(result.report);

    return NextResponse.json({
      id: result.report.id,
      mode: result.mode,
      report: result.report,
      artifacts: result.artifacts,
    });
  } catch (error) {
    const id = traceId();
    const isValidationError = error instanceof ZodError;
    const message = sanitizeMessage(
      error instanceof Error ? error.message : "Unknown report generation error.",
    );

    return NextResponse.json(
      {
        error: isValidationError ? "INVALID_INTAKE_PAYLOAD" : "MODEL_GENERATION_FAILED",
        message: isValidationError ? "输入数据校验失败，请返回表单检查字段。" : message,
        traceId: id,
        occurredAt: new Date().toISOString(),
        mode: safeResponseMode(),
        hint: isValidationError
          ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("；")
          : "当前版本要求模型生成。请把此错误反馈给开发者，并检查模型 key、代理、模型名与响应 JSON。",
      },
      { status: isValidationError ? 400 : 502 },
    );
  }
}
