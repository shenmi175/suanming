import { Agent, fileSearchTool, run, tool, webSearchTool } from "@openai/agents";
import { z } from "zod";
import { calculateFateSignals } from "@/lib/fate/signals";
import { searchLocalKnowledge } from "@/lib/research/localKnowledge";
import type { IntakeProfile } from "@/lib/schemas/intake";
import { buildCyberFateReport } from "@/lib/report/buildReport";
import { roleModelConfig } from "@/lib/llm/modelConfig";
import {
  FusionOutputSchema,
  InterviewOutputSchema,
  ResearchOutputSchema,
  ReviewOutputSchema,
} from "./schemas";

const localMetaphysicsSearchTool = tool({
  name: "local_metaphysics_search",
  description: "Search curated local metaphysics notes by system/topic and return ResearchNote objects.",
  parameters: z.object({
    systems: z.array(z.string()).optional(),
    topics: z.array(z.string()).optional(),
    query: z.string().optional(),
    limit: z.number().int().min(1).max(20).default(8),
  }),
  async execute(input) {
    return searchLocalKnowledge(input);
  },
});

export function createCyberFateAgents() {
  const interviewer = new Agent({
    name: "Cyber Fate Interviewer",
    model: roleModelConfig.interviewer.model,
    instructions: "整理用户 intake，标注缺失字段与不确定性，不写最终报告。必须输出结构化 JSON。",
    outputType: InterviewOutputSchema,
  });

  const researcherTools = [
    localMetaphysicsSearchTool,
    ...(process.env.ENABLE_WEB_SEARCH === "true" ? [webSearchTool({ searchContextSize: "medium" })] : []),
    ...(process.env.OPENAI_VECTOR_STORE_ID
      ? [fileSearchTool(process.env.OPENAI_VECTOR_STORE_ID, { maxNumResults: 5 })]
      : []),
  ];

  const researcher = new Agent({
    name: "Cyber Fate Researcher",
    model: roleModelConfig.researcher.model,
    instructions: "只返回 ResearchNote[]，优先使用本地知识库。不要写最终白皮书文案。",
    tools: researcherTools,
    outputType: ResearchOutputSchema,
  });

  const fusion = new Agent({
    name: "Cyber Fate Fusion Analyst",
    model: roleModelConfig.fusion.model,
    instructions: "融合 profile、signals 与 notes，输出章节蓝图。冲突解释为不同镜头，不做绝对判断。",
    outputType: FusionOutputSchema,
  });

  const reviewer = new Agent({
    name: "Cyber Fate Reviewer",
    model: roleModelConfig.reviewer.model,
    instructions: "检查章节缺失、过度确定性、印章理由、娱乐声明与 PDF readiness。只输出 review JSON。",
    outputType: ReviewOutputSchema,
  });

  return { interviewer, researcher, fusion, reviewer };
}

export async function runOpenAIAgentsPipeline(profile: IntakeProfile) {
  const agents = createCyberFateAgents();
  const signals = calculateFateSignals(profile);

  const interview = await run(agents.interviewer, JSON.stringify({ profile }));
  const interviewOutput = InterviewOutputSchema.parse(interview.finalOutput);

  const research = await run(
    agents.researcher,
    JSON.stringify({
      profile: interviewOutput.profile,
      calculatedSignals: signals.calculatedSignals,
    }),
  );
  const researchOutput = ResearchOutputSchema.parse(research.finalOutput);

  const fusion = await run(
    agents.fusion,
    JSON.stringify({
      profile: interviewOutput.profile,
      calculatedSignals: signals.calculatedSignals,
      researchNotes: researchOutput.notes,
    }),
  );
  const fusionOutput = FusionOutputSchema.parse(fusion.finalOutput);

  // The first product version keeps report assembly deterministic even in OpenAI mode.
  // LLM roles enrich and review the context; JSON assembly stays schema-owned by app code.
  const report = buildCyberFateReport(interviewOutput.profile);

  const review = await run(
    agents.reviewer,
    JSON.stringify({
      profile: interviewOutput.profile,
      calculatedSignals: signals.calculatedSignals,
      researchNotes: researchOutput.notes,
      fusion: fusionOutput,
      report,
    }),
  );
  const reviewOutput = ReviewOutputSchema.parse(review.finalOutput);

  return {
    mode: "openai-agents" as const,
    report: {
      ...report,
      reviewer: {
        passed: reviewOutput.passed,
        issues: reviewOutput.issues.map((issue) => ({
          severity: issue.severity === "blocker" ? "high" : issue.severity === "major" ? "medium" : "low",
          message: issue.message,
          suggestedFix: issue.requiredAction,
        })),
      },
    },
    artifacts: [
      { role: "interviewer", label: "Interviewer Agent", status: "completed", output: interviewOutput, createdAt: new Date().toISOString(), model: roleModelConfig.interviewer.model },
      { role: "researcher", label: "Researcher Agent", status: "completed", output: researchOutput, createdAt: new Date().toISOString(), model: roleModelConfig.researcher.model },
      { role: "fusion", label: "Fusion Analyst Agent", status: "completed", output: fusionOutput, createdAt: new Date().toISOString(), model: roleModelConfig.fusion.model },
      { role: "copywriter", label: "Deterministic Report Builder", status: "completed", output: { chapterCount: report.chapters.length }, createdAt: new Date().toISOString(), model: "app-code" },
      { role: "reviewer", label: "Reviewer Agent", status: "completed", output: reviewOutput, createdAt: new Date().toISOString(), model: roleModelConfig.reviewer.model },
    ],
  };
}
