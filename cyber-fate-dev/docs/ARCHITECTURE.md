# Cyber Fate Architecture

## 目标闭环

```text
Landing -> Intake -> Generate Pipeline -> Report Preview -> Print Layout -> PDF Download
```

第一版优先保证本地端到端可演示。默认走本地备用管线；有 `PERCEPTLEAP_API_KEY` 且 `CYBER_FATE_LLM_MODE=perceptleap` 时走 PerceptLeap 多角色 API 管线；仍保留 OpenAI SDK/Agents SDK 接入点。

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
src/lib/llm/perceptLeapClient.ts
src/lib/llm/perceptLeapPipeline.ts
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
  -> Image Director: 生成封面图提示词，可选调用图像模型
  -> Reviewer: 检查过度确定性、章节缺失、印章理由与 PDF readiness
```

PerceptLeap mode 中五个文本角色都调用 Responses API，并用 Zod parse 输出；Image Director 先生成图像提示词，只有 `ENABLE_PERCEPTLEAP_IMAGE=true` 时才调用 `gpt-image-2`。OpenAI Agents mode 中 Interviewer、Researcher、Fusion、Reviewer 使用 `@openai/agents`；本地备用模式由规则代码产出 artifacts。

## PDF 架构

LLM 或本地备用管线只产出 JSON：

```text
CyberFateReport JSON -> renderReportHtml(report) -> Playwright page.pdf()
```

PDF renderer 消费已验证的 report JSON；如果报告带有 `coverImage.dataUrl` 会嵌入封面图。印章使用 CSS/SVG 风格的文字印章，保证本地可生成。

## 存储

第一版使用本地 JSON 文件：

```text
.cyber-fate-data/reports/{id}.json
```

后续如需要账号、历史记录、分享、支付，再接入数据库。
