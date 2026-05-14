# OpenAI SDK Architecture

## 关键原则

1. API key 只存在服务端环境变量中。
2. 浏览器不直接调用 OpenAI。
3. 所有模型输出必须经过 schema validation。
4. 所有中间产物都应保存为 JSON，方便 debug 和 PDF 渲染。
5. 不把模型名写死在角色函数里。

## 推荐文件

```text
src/lib/llm/
  openaiClient.ts          # 创建官方 OpenAI client
  structuredOutput.ts      # Responses API + JSON Schema helper
  modelConfig.ts           # role -> model 配置
  provider.ts              # Mock / OpenAI runner interface

src/lib/agents/
  agents.ts                # OpenAI Agents SDK agent definitions
  orchestrator.ts          # sequential / agents SDK orchestrator
  prompts/
    interviewer.md
    researcher.md
    fusion.md
    copywriter.md
    reviewer.md
```

## 环境变量

```env
OPENAI_API_KEY=sk-...
CYBER_FATE_LLM_MODE=mock # mock | openai-structured | openai-agents
CYBER_FATE_DEFAULT_MODEL=gpt-5.5-mini
CYBER_FATE_WRITER_MODEL=gpt-5.5
```

模型名只是占位，Codex 实现时应根据你账户可用模型与官方文档更新。

## 推荐类型

```ts
export type AgentRole = 'interviewer' | 'researcher' | 'fusion' | 'copywriter' | 'reviewer';

export interface RoleModelConfig {
  role: AgentRole;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AgentArtifact<T = unknown> {
  role: AgentRole;
  input: unknown;
  output: T;
  createdAt: string;
  model?: string;
  durationMs?: number;
}
```

## 结构化输出策略

- App 内部使用 Zod 类型。
- 发给模型时使用 JSON Schema。
- 模型返回后再次用 Zod parse。
- 失败时记录错误并重试一次；不要让错误 JSON 进入 PDF 渲染层。

## 真实多 agent 策略

第一阶段：

```text
MockRunner -> deterministic fake outputs
```

第二阶段：

```text
OpenAIStructuredOutputRunner -> 每个角色一次 Responses API structured output
```

第三阶段：

```text
OpenAIAgentsRunner -> @openai/agents 的 Agent / Runner / handoffs / agents-as-tools
```

## 检索策略

MVP：

```text
content/metaphysics/*.md -> simple keyword retrieval -> ResearchNote[]
```

成熟版：

```text
curated metaphysics docs -> OpenAI Vector Stores -> File Search -> ResearchNote[]
```

无论检索方式如何，Fusion 和 Copywriter 只接收统一的 `ResearchNote[]`。
