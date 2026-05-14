export type AgentRole = "interviewer" | "researcher" | "fusion" | "copywriter" | "reviewer" | "image-director";
export type LlmMode = "mock" | "openai-direct" | "openai-agents" | "perceptleap";

export interface RoleModelConfig {
  role: AgentRole;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

const defaultModel = process.env.OPENAI_MODEL_DEFAULT || "gpt-4.1-mini";
const perceptLeapTextModel = process.env.PERCEPTLEAP_TEXT_MODEL || "gpt-5.4";

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
  "image-director": {
    role: "image-director",
    model: process.env.OPENAI_MODEL_IMAGE_DIRECTOR || defaultModel,
    temperature: 0.5,
  },
};

export const perceptLeapRoleModelConfig: Record<AgentRole, RoleModelConfig> = {
  interviewer: {
    role: "interviewer",
    model: process.env.PERCEPTLEAP_MODEL_INTERVIEWER || perceptLeapTextModel,
    temperature: 0.2,
    maxOutputTokens: 2400,
  },
  researcher: {
    role: "researcher",
    model: process.env.PERCEPTLEAP_MODEL_RESEARCHER || perceptLeapTextModel,
    temperature: 0.2,
    maxOutputTokens: 3600,
  },
  fusion: {
    role: "fusion",
    model: process.env.PERCEPTLEAP_MODEL_FUSION || perceptLeapTextModel,
    temperature: 0.35,
    maxOutputTokens: 4200,
  },
  copywriter: {
    role: "copywriter",
    model: process.env.PERCEPTLEAP_MODEL_COPYWRITER || perceptLeapTextModel,
    temperature: 0.75,
    maxOutputTokens: 14000,
  },
  reviewer: {
    role: "reviewer",
    model: process.env.PERCEPTLEAP_MODEL_REVIEWER || perceptLeapTextModel,
    temperature: 0.1,
    maxOutputTokens: 2600,
  },
  "image-director": {
    role: "image-director",
    model: process.env.PERCEPTLEAP_MODEL_IMAGE_DIRECTOR || perceptLeapTextModel,
    temperature: 0.45,
    maxOutputTokens: 1800,
  },
};

export function getEffectiveLlmMode(): LlmMode {
  const requested = process.env.CYBER_FATE_LLM_MODE;
  const enablePerceptLeap = process.env.ENABLE_PERCEPTLEAP === "true";
  const hasPerceptLeapKey = Boolean(process.env.PERCEPTLEAP_API_KEY);
  if ((requested === "perceptleap" || enablePerceptLeap) && hasPerceptLeapKey) return "perceptleap";

  const enableOpenAI = process.env.ENABLE_OPENAI === "true";
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  if (!enableOpenAI || !hasKey) return "mock";

  if (requested === "openai-agents" || requested === "openai-direct") return requested;
  return "openai-agents";
}
