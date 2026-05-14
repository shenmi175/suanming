# Mature Stack Decision

## 目标

项目使用成熟工具组合，重点是稳定模型生成、结构化校验和 PDF 闭环：

- Next.js 负责网站与 API routes。
- PerceptLeap Responses API 负责多角色文本生成。
- PerceptLeap Images API 负责可选封面图生成。
- OpenAI SDK 保留为 `openai-direct` 单模型结构化输出路径。
- Zod 负责所有模型输出校验。
- 本地知识库负责 Researcher 的候选资料来源。
- Playwright 负责 PDF。

## 推荐依赖

```bash
pnpm add openai undici zod zod-to-json-schema
pnpm add -D vitest @playwright/test playwright tsx typescript
```

## 为什么使用 typed pipeline

当前版本不做自由 handoff。每个角色都是有输入、有 schema、有 artifact 的可观测步骤，便于错误定位和 PDF 稳定渲染。

## 当前模型路线

```text
Interviewer + Researcher 并行
  -> Fusion
  -> Copywriter
  -> Image Director + Reviewer 并行
  -> CyberFateReport JSON
```

失败策略是显式报错，不生成本地替代报告。
