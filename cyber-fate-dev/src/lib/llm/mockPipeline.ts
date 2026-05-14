import type { IntakeProfile } from "@/lib/schemas/intake";
import { calculateFateSignals } from "@/lib/fate/signals";
import { searchLocalKnowledge } from "@/lib/research/localKnowledge";
import { buildCyberFateReport } from "@/lib/report/buildReport";
import type { AgentRole } from "./modelConfig";

export interface PipelineArtifact<T = unknown> {
  role: AgentRole;
  label: string;
  status: "completed" | "failed";
  output: T;
  createdAt: string;
  model: "mock" | string;
}

function artifact<T>(role: AgentRole, label: string, output: T): PipelineArtifact<T> {
  return {
    role,
    label,
    status: "completed",
    output,
    createdAt: new Date().toISOString(),
    model: "mock",
  };
}

export async function runMockPipeline(profile: IntakeProfile) {
  const signals = calculateFateSignals(profile);
  const notes = searchLocalKnowledge({ limit: 8 });
  const report = buildCyberFateReport(profile);

  return {
    mode: "mock" as const,
    report,
    artifacts: [
      artifact("interviewer", "整理访谈资料", {
        readyForReport: true,
        uncertaintyNotes: report.userProfile.uncertaintyNotes,
      }),
      artifact("researcher", "检索本地玄学知识库", { notes }),
      artifact("fusion", "融合命理 signals 与资料", { calculatedSignals: signals.calculatedSignals }),
      artifact("copywriter", "写作结构化白皮书 JSON", {
        chapterCount: report.chapters.length,
        stampCount: report.stamps.length,
      }),
      artifact("reviewer", "审阅边界、章结构与印章理由", report.reviewer),
    ],
  };
}
