import type { AgentRole } from "@/lib/llm/modelConfig";

export interface PipelineArtifact<T = unknown> {
  role: AgentRole;
  label: string;
  status: "completed" | "failed";
  output: T;
  createdAt: string;
  model: string;
}
