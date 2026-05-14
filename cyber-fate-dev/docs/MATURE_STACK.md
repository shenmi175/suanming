# Mature Stack Decision

## 目标

这个项目不是要从零发明 LLM 平台，而是组合成熟工具：

- Next.js 负责网站与 API routes。
- OpenAI 官方 SDK 负责模型调用。
- OpenAI Agents SDK 负责多 agent 编排。
- Structured Outputs 负责稳定 JSON。
- 本地知识库 / OpenAI File Search 负责资料检索。
- Playwright/Puppeteer 负责 PDF。

## 推荐依赖

```bash
pnpm add openai @openai/agents zod
pnpm add -D vitest @playwright/test playwright tsx typescript
```

可选：

```bash
pnpm add clsx tailwind-merge lucide-react
pnpm dlx shadcn@latest init
```

## 为什么不用完全自研 agent 框架

自研框架会带来这些额外工作：

- 角色状态管理
- tool calling
- handoff / agent-as-tool
- tracing / debug
- 结构化输出失败重试
- 多模型配置
- 中间产物可观察性

第一版只需要一个 typed pipeline；真实 multi-agent 能力应该优先靠 OpenAI Agents SDK，而不是从零写。

## 两种可选 LLM 路线

### 路线 A：直接 Responses API，适合 MVP

每个角色一次结构化调用：

```text
profile + signals + notes -> Fusion JSON
blueprint -> Draft JSON
draft -> Review JSON
```

优点：简单、可控、便宜、容易测试。

### 路线 B：OpenAI Agents SDK，适合多 agent

使用 agents-as-tools 或 handoffs：

```text
Manager Agent
  ├─ Researcher Agent as tool
  ├─ Fusion Agent as tool
  ├─ Copywriter Agent as tool
  └─ Reviewer Agent as tool
```

优点：更接近你想要的“多个 LLM 角色协作”。

## MVP 建议

先做路线 A，保留 `AgentRunner` 接口；当报告质量稳定后，把真实多角色编排升级到路线 B。

这样不是从零开始，而是先用官方 SDK 的直接结构化输出，后续自然迁移到官方 Agents SDK。
