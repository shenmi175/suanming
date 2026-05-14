export type AgentRole = "interviewer" | "researcher" | "fusion" | "copywriter" | "reviewer";
export type LlmMode = "mock" | "openai-direct" | "openai-agents";

export interface RoleModelConfig {
  role: AgentRole;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

const defaultModel = process.env.OPENAI_MODEL_DEFAULT || "gpt-4.1-mini";

export const roleModelConfig: Record<AgentRole, RoleModelConfig> = {
  interviewer: {
    role: "interviewer",
    model: process.env.OPENAI_MODEL_INTERVIEWER || defaultModel,
    temperature: 0.2,
  },
  researcher: {
    role: "researcher",
    model: process.env.OPENAI_MODEL_RESEARCHER || defaultModel,
    temperature: 0.2,
  },
  fusion: {
    role: "fusion",
    model: process.env.OPENAI_MODEL_FUSION || defaultModel,
    temperature: 0.4,
  },
  copywriter: {
    role: "copywriter",
    model: process.env.OPENAI_MODEL_COPYWRITER || defaultModel,
    temperature: 0.7,
  },
  reviewer: {
    role: "reviewer",
    model: process.env.OPENAI_MODEL_REVIEWER || defaultModel,
    temperature: 0.1,
  },
};

export function getEffectiveLlmMode(): LlmMode {
  const enableOpenAI = process.env.ENABLE_OPENAI === "true";
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  if (!enableOpenAI || !hasKey) return "mock";

  const requested = process.env.CYBER_FATE_LLM_MODE;
  if (requested === "openai-agents" || requested === "openai-direct") return requested;
  return "openai-agents";
}
