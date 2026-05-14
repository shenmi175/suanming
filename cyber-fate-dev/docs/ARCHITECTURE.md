# Cyber Fate Architecture

## 目标闭环

```text
Landing -> Intake -> Generate Pipeline -> Report Preview -> Print Layout -> PDF Download
```

第一版优先保证本地端到端可演示。没有 API key 时走 mock pipeline；有 API key 且 `ENABLE_OPENAI=true` 时可切换 OpenAI mode。

## Web 层

- `/`：产品首页与样例入口。
- `/intake`：访谈式表单，React Hook Form + Zod 校验。
- `/generate`：展示五个 agent 步骤，并调用 `/api/reports`。
- `/report/[id]`：在线报告预览。
- `/report/[id]/print`：专门给打印/PDF 使用的页面布局。
- `/api/reports`：创建报告，保存本地 JSON。
- `/api/reports/[id]`：读取报告 JSON。
- `/api/reports/[id]/pdf`：使用 Playwright 生成 PDF。

## 核心模块

```text
src/lib/schemas/intake.ts       intake 数据契约
src/lib/report/reportSchema.ts  CyberFateReport 契约
src/lib/fate/*                  确定性 signals
src/lib/research/localKnowledge.ts
src/lib/fate/stamps.ts
src/lib/report/buildReport.ts
src/lib/llm/mockPipeline.ts
src/lib/agents/runCyberFatePipeline.ts
src/lib/pdf/*
```

## Agent Pipeline

```text
IntakeProfile
  -> Interviewer: 整理缺失字段与不确定性
  -> Researcher: 检索本地 metaphysics notes
  -> Fusion Analyst: 融合 profile + signals + notes
  -> Copywriter: 生成结构化 CyberFateReport
  -> Reviewer: 检查过度确定性、章节缺失、印章理由与 PDF readiness
```

mock mode 中这些步骤由本地代码产出 artifacts。OpenAI Agents mode 中 Interviewer、Researcher、Fusion、Reviewer 使用 `@openai/agents`；报告最终 assembly 仍由 app schema 控制，避免模型直接写不可控 PDF。

## PDF 架构

LLM 或 mock pipeline 只产出 JSON：

```text
CyberFateReport JSON -> renderReportHtml(report) -> Playwright page.pdf()
```

PDF renderer 不读取外部图片。印章使用 CSS/SVG 风格的文字印章，保证本地可生成。

## 存储

第一版使用本地 JSON 文件：

```text
.cyber-fate-data/reports/{id}.json
```

后续如需要账号、历史记录、分享、支付，再接入数据库。
