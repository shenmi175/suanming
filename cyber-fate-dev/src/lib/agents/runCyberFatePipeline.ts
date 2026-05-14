import { calculateFateSignals } from "@/lib/fate/signals";
import { getEffectiveLlmMode, roleModelConfig } from "@/lib/llm/modelConfig";
import { generateStructuredOutput } from "@/lib/llm/structuredOutput";
import type { PipelineArtifact } from "@/lib/agents/pipelineTypes";
import {
  buildUncertaintyNotes,
  createReportId,
  entertainmentNotice,
} from "@/lib/report/buildReport";
import { CyberFateReportSchema } from "@/lib/report/reportSchema";
import { searchLocalKnowledge } from "@/lib/research/localKnowledge";
import { focusAreaLabels, type IntakeProfile } from "@/lib/schemas/intake";

export async function runCyberFatePipeline(profile: IntakeProfile): Promise<{
  mode: string;
  report: ReturnType<typeof CyberFateReportSchema.parse>;
  artifacts: PipelineArtifact[];
}> {
  const mode = getEffectiveLlmMode();

  if (mode === "perceptleap") {
    const { runPerceptLeapPipeline } = await import("@/lib/llm/perceptLeapPipeline");
    const result = await runPerceptLeapPipeline(profile);
    return {
      mode: result.mode,
      report: CyberFateReportSchema.parse(result.report),
      artifacts: result.artifacts,
    };
  }

  const signals = calculateFateSignals(profile);
  const notes = searchLocalKnowledge({
    systems: ["五行", "星座", "生肖", "易经", "风水"],
    query: profile.question ?? undefined,
    limit: 10,
  });

  const report = await generateStructuredOutput({
    model: roleModelConfig.copywriter.model,
    schemaName: "CyberFateReport",
    zodSchema: CyberFateReportSchema,
    system:
      "你是 Cyber Fate 白皮书 copywriter。必须直接生成完整 CyberFateReport JSON。不要复用本地样例或模板句；避免绝对预测，保留娱乐声明和不确定性说明。",
    user: {
      requiredIdentity: {
        id: createReportId(),
        title: "Cyber Fate / 赛博天命局",
        subtitle: `${profile.displayName} 的命运白皮书`,
        generatedAt: new Date().toISOString(),
        entertainmentNotice,
      },
      profile,
      normalizedUserProfile: {
        displayName: profile.displayName,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || undefined,
        birthPlace: profile.birthPlace || undefined,
        currentCity: profile.currentCity || undefined,
        focusAreas: profile.focusAreas.map((area) => focusAreaLabels[area]),
        uncertaintyNotes: buildUncertaintyNotes(profile),
      },
      signals,
      researchNotes: notes,
      rules: [
        "所有报告正文必须由模型生成，不要依赖本地草稿。",
        "chapters 至少 8 章，每章至少 1 个 section。",
        "appendix 必须包含计算说明、资料来源、娱乐声明。",
        "不得输出医学、法律、投资或重大人生决策建议。",
      ],
    },
    temperature: roleModelConfig.copywriter.temperature,
    maxOutputTokens: roleModelConfig.copywriter.maxOutputTokens,
  });

  return {
    mode,
    report,
    artifacts: [
      {
        role: "copywriter",
        label: "OpenAI Direct Model Generation",
        status: "completed",
        output: { chapterCount: report.chapters.length },
        createdAt: new Date().toISOString(),
        model: roleModelConfig.copywriter.model,
      },
    ],
  };
}
