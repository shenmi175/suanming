import { serverEnv } from "@/lib/env/serverEnv";

export type AgentRole = "interviewer" | "researcher" | "fusion" | "copywriter" | "reviewer" | "image-director";
export type LlmMode = "perceptleap" | "openai-direct";

export interface RoleModelConfig {
  role: AgentRole;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

const defaultModel = serverEnv.openAI.modelDefault;
const perceptLeapTextModel = serverEnv.perceptLeap.textModel;

export const roleModelConfig: Record<AgentRole, RoleModelConfig> = {
  interviewer: {
    role: "interviewer",
    model: serverEnv.openAI.modelInterviewer || defaultModel,
    temperature: 0.2,
  },
  researcher: {
    role: "researcher",
    model: serverEnv.openAI.modelResearcher || defaultModel,
    temperature: 0.2,
  },
  fusion: {
    role: "fusion",
    model: serverEnv.openAI.modelFusion || defaultModel,
    temperature: 0.4,
  },
  copywriter: {
    role: "copywriter",
    model: serverEnv.openAI.modelCopywriter || defaultModel,
    temperature: 0.7,
  },
  reviewer: {
    role: "reviewer",
    model: serverEnv.openAI.modelReviewer || defaultModel,
    temperature: 0.1,
  },
  "image-director": {
    role: "image-director",
    model: serverEnv.openAI.modelImageDirector || defaultModel,
    temperature: 0.5,
  },
};

export const perceptLeapRoleModelConfig: Record<AgentRole, RoleModelConfig> = {
  interviewer: {
    role: "interviewer",
    model: serverEnv.perceptLeap.modelInterviewer || perceptLeapTextModel,
    temperature: 0.2,
    maxOutputTokens: 2400,
  },
  researcher: {
    role: "researcher",
    model: serverEnv.perceptLeap.modelResearcher || perceptLeapTextModel,
    temperature: 0.2,
    maxOutputTokens: 3600,
  },
  fusion: {
    role: "fusion",
    model: serverEnv.perceptLeap.modelFusion || perceptLeapTextModel,
    temperature: 0.35,
    maxOutputTokens: 4200,
  },
  copywriter: {
    role: "copywriter",
    model: serverEnv.perceptLeap.modelCopywriter || perceptLeapTextModel,
    temperature: 0.75,
    maxOutputTokens: 14000,
  },
  reviewer: {
    role: "reviewer",
    model: serverEnv.perceptLeap.modelReviewer || perceptLeapTextModel,
    temperature: 0.1,
    maxOutputTokens: 2600,
  },
  "image-director": {
    role: "image-director",
    model: serverEnv.perceptLeap.modelImageDirector || perceptLeapTextModel,
    temperature: 0.45,
    maxOutputTokens: 1800,
  },
};

export function normalizeLlmMode(rawMode = serverEnv.cyberFate.llmMode): LlmMode {
  const requested = (rawMode || "perceptleap").trim();
  if (requested === "perceptleap") return "perceptleap";
  if (requested === "openai-direct") return "openai-direct";

  const legacyLocalMode = ["mo", "ck"].join("");
  if (requested === legacyLocalMode) return "perceptleap";

  throw new Error(`不支持的 CYBER_FATE_LLM_MODE: ${requested}`);
}

export function getEffectiveLlmMode(): LlmMode {
  const requested = normalizeLlmMode();

  if (requested === "perceptleap") {
    if (!serverEnv.perceptLeap.apiKey) {
      throw new Error("缺少 PERCEPTLEAP_API_KEY 或 PERCEPTLEAP_API_KEY_ENCRYPTED。当前版本要求使用模型生成，不再自动降级到本地内容。");
    }
    return "perceptleap";
  }

  if (requested === "openai-direct") {
    if (!serverEnv.openAI.apiKey) {
      throw new Error("缺少 OPENAI_API_KEY 或 OPENAI_API_KEY_ENCRYPTED。openai-direct 模式要求可用模型 key。");
    }
    return "openai-direct";
  }

  throw new Error(`不支持的 CYBER_FATE_LLM_MODE: ${requested}`);
}
