export type AgentRole = 'interviewer' | 'researcher' | 'fusion' | 'copywriter' | 'reviewer';

export interface RoleModelConfig {
  role: AgentRole;
  model: string | undefined;
  temperature?: number;
  maxOutputTokens?: number;
}

const defaultModel = process.env.OPENAI_MODEL_DEFAULT;

export const roleModelConfig: Record<AgentRole, RoleModelConfig> = {
  interviewer: {
    role: 'interviewer',
    model: process.env.OPENAI_MODEL_INTERVIEWER ?? defaultModel,
    temperature: 0.3,
  },
  researcher: {
    role: 'researcher',
    model: process.env.OPENAI_MODEL_RESEARCHER ?? defaultModel,
    temperature: 0.2,
  },
  fusion: {
    role: 'fusion',
    model: process.env.OPENAI_MODEL_FUSION ?? defaultModel,
    temperature: 0.4,
  },
  copywriter: {
    role: 'copywriter',
    model: process.env.OPENAI_MODEL_COPYWRITER ?? defaultModel,
    temperature: 0.8,
  },
  reviewer: {
    role: 'reviewer',
    model: process.env.OPENAI_MODEL_REVIEWER ?? defaultModel,
    temperature: 0.1,
  },
};

export type LlmMode = 'mock' | 'openai-agents' | 'openai-direct';

export function getLlmMode(): LlmMode {
  const raw = process.env.CYBER_FATE_LLM_MODE ?? 'mock';
  if (raw === 'openai-agents' || raw === 'openai-direct' || raw === 'mock') return raw;
  return 'mock';
}
