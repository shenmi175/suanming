import { CyberFateReportSchema } from "@/lib/report/reportSchema";
import type { IntakeProfile } from "@/lib/schemas/intake";
import { getEffectiveLlmMode, roleModelConfig } from "@/lib/llm/modelConfig";
import { generateStructuredOutput } from "@/lib/llm/structuredOutput";
import { runMockPipeline, type PipelineArtifact } from "@/lib/llm/mockPipeline";
import { buildCyberFateReport } from "@/lib/report/buildReport";

export async function runCyberFatePipeline(profile: IntakeProfile): Promise<{
  mode: string;
  report: ReturnType<typeof CyberFateReportSchema.parse>;
  artifacts: PipelineArtifact[];
}> {
  const mode = getEffectiveLlmMode();

  if (mode === "perceptleap") {
    try {
      const { runPerceptLeapPipeline } = await import("@/lib/llm/perceptLeapPipeline");
      const result = await runPerceptLeapPipeline(profile);
      return {
        mode: result.mode,
        report: CyberFateReportSchema.parse(result.report),
        artifacts: result.artifacts,
      };
    } catch (error) {
      const fallback = await runMockPipeline(profile);
      fallback.report.reviewer.issues.push({
        severity: "medium",
        message: "PerceptLeap API 模式失败，已自动降级到本地备用管线。",
        suggestedFix: error instanceof Error ? error.message : "检查 PERCEPTLEAP_API_KEY、代理、模型名与响应 JSON。",
      });
      return fallback;
    }
  }

  if (mode === "openai-agents") {
    try {
      const { runOpenAIAgentsPipeline } = await import("./cyberFateAgents");
      const result = await runOpenAIAgentsPipeline(profile);
      return {
        mode: result.mode,
        report: CyberFateReportSchema.parse(result.report),
        artifacts: result.artifacts as PipelineArtifact[],
      };
    } catch (error) {
      const fallback = await runMockPipeline(profile);
      fallback.report.reviewer.issues.push({
        severity: "medium",
        message: "OpenAI Agents 模式失败，已自动降级到本地备用管线。",
        suggestedFix: error instanceof Error ? error.message : "检查 OPENAI_API_KEY、模型名与 @openai/agents 配置。",
      });
      return fallback;
    }
  }

  if (mode === "openai-direct") {
    try {
      const deterministic = buildCyberFateReport(profile);
      const report = await generateStructuredOutput({
        model: roleModelConfig.copywriter.model,
        schemaName: "CyberFateReport",
        zodSchema: CyberFateReportSchema,
        system:
          "你是 Cyber Fate 白皮书 copywriter。必须输出完整 CyberFateReport JSON，避免绝对预测，保留娱乐声明和不确定性说明。",
        user: {
          profile,
          deterministicDraft: deterministic,
        },
        temperature: roleModelConfig.copywriter.temperature,
      });

      return {
        mode,
        report,
        artifacts: [
          {
            role: "copywriter",
            label: "OpenAI Responses Structured Output",
            status: "completed",
            output: { chapterCount: report.chapters.length },
            createdAt: new Date().toISOString(),
            model: roleModelConfig.copywriter.model,
          },
        ],
      };
    } catch (error) {
      const fallback = await runMockPipeline(profile);
      fallback.report.reviewer.issues.push({
        severity: "medium",
        message: "OpenAI Direct 模式失败，已自动降级到本地备用管线。",
        suggestedFix: error instanceof Error ? error.message : "检查 OPENAI_API_KEY 与模型结构化输出支持。",
      });
      return fallback;
    }
  }

  return runMockPipeline(profile);
}
