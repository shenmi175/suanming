# 可直接复制给 Codex 的成熟方案任务序列

## 任务 0：检查 skill 包

请先读取 AGENTS.md 和 .agents/skills/cyber-fate-dev/SKILL.md。运行 scripts/validate_skill_pack.py。总结这个仓库目前有哪些约定，不要改代码。

## 任务 1：初始化项目骨架

请使用 $cyber-fate-dev 初始化一个 Next.js + TypeScript + Tailwind 项目。建立推荐目录结构，添加首页、intake 表单、Zod schema、mock report 页面。不要接入真实 LLM。完成后运行 lint/test/build，并告诉我下一步。

## 任务 2：实现基础命理 signal 模块

请使用 $cyber-fate-dev 在 `src/lib/fate` 实现 western zodiac、Chinese zodiac、basic wuxing placeholder、I Ching seeded hexagram 四个模块。每个模块返回 typed JSON。添加 Vitest 测试。不要写长文案。

## 任务 3：实现 report schema 和 mock 白皮书

请使用 $cyber-fate-dev 创建 `Report` schema，把 intake + fate signals 合成一份 mock whitepaper JSON。添加一个页面展示报告章节和印章。不要生成 PDF。

## 任务 4：加入 OpenAI 官方 SDK 底座

请使用 $cyber-fate-dev 接入官方 `openai` SDK。创建 `src/lib/llm/openaiClient.ts`、`structuredOutput.ts`、`modelConfig.ts`。要求：

1. API key 只从环境变量读取。
2. 使用 Responses API + JSON Schema 做结构化输出 helper。
3. 保留 MockProvider，不要让测试依赖真实 API。
4. 添加 `.env.example`。
5. 实现一个最小 API route，可在 mock mode 和 openai mode 之间切换。

## 任务 5：实现多角色 typed pipeline

请使用 $cyber-fate-dev 实现 Interviewer、Researcher、Fusion Analyst、Copywriter、Reviewer 五个角色。先用 MockRunner 串起完整流程。要求每个角色输入输出都有类型和 schema，debug 页面能查看中间产物。

## 任务 6：升级到 OpenAI Agents SDK

请使用 $cyber-fate-dev 在保持 MockRunner 可用的前提下，加入 `@openai/agents`。实现 OpenAIAgentsRunner，使用 agents-as-tools 或 handoffs 组织五个角色。角色到模型的映射写入 config。不要删除 direct structured output runner。

## 任务 7：加入本地知识库

请使用 $cyber-fate-dev 创建 `content/metaphysics` 本地资料库，并实现 Researcher 的简易检索。资料包括五行、生肖、星座、易经、风水基础解释。要求 notes 有 id、system、topic、claim、interpretiveUse、source。

## 任务 8：可选加入 OpenAI File Search

请使用 $cyber-fate-dev 评估并实现一个可选的 managed retrieval 层：本地 KB 与 OpenAI File Search 输出统一转换为 ResearchNote[]。使用 feature flag 控制，不要影响 mock mode。

## 任务 9：PDF 生成

请使用 $cyber-fate-dev 实现 HTML-to-PDF。LLM/report pipeline 只输出 JSON，PDF 模板读取 JSON 渲染。PDF 包含封面、目录、章节、印章页、附录。添加 smoke test。

## 任务 10：eval 与质量稳定

请使用 $cyber-fate-dev 添加 eval fixtures：完整出生信息、缺出生时间、只看事业、只看情感、当前城市未知。检查：schema 合法、章节完整、无绝对化措辞、印章有理由、renderReady 正确、PDF 非空。
