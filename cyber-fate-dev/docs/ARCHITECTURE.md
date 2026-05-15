# Cyber Fate Architecture

## 目标闭环

```text
Frontend Landing -> Intake -> Generate Pipeline -> Backend API -> Report Preview -> Print Layout -> PDF Download
```

第一版优先保证本地端到端可演示，但用户报告生成必须走模型。默认使用 `CYBER_FATE_LLM_MODE=perceptleap`；缺少 key、代理失败或模型输出不合规时，API 返回错误，生成页右下角显示可复制反馈信息，不自动生成本地替代报告。

## 部署形态

项目已拆成前后端分离的两个运行进程：

```text
frontend: Next.js App Router, 默认 http://localhost:3000
backend:  Node HTTP API,    默认 http://localhost:4000
```

前端不直接 import 模型、PDF、报告存储模块；浏览器和服务端页面都通过 backend API 访问数据。Docker/Ubuntu 启动脚本会同时启动两个进程。

## Web 层

- `/`：产品首页与样例入口。
- `/intake`：访谈式表单，React Hook Form + Zod 校验。
- `/generate`：展示六个 agent 步骤，并调用 backend `/api/reports`。
- `/report/[id]`：在线报告预览。
- `/report/[id]/print`：专门给打印/PDF 使用的页面布局。

## Backend API

- `GET /health`：backend 健康检查。
- `POST /api/reports`：创建报告，保存本地 JSON。
- `GET /api/reports/:id`：读取报告 JSON。
- `GET /api/reports/:id/pdf`：使用 Playwright 生成 PDF。

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
src/lib/agents/runCyberFatePipeline.ts
src/lib/pdf/*
src/backend/server.ts           独立 backend API 入口
src/lib/frontend/backendApi.ts   frontend API client
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

PerceptLeap mode 中五个文本角色都调用 Responses API，并用 Zod parse 输出；Image Director 先生成图像提示词，只有 `ENABLE_PERCEPTLEAP_IMAGE=true` 时才调用 `gpt-image-2`。OpenAI direct mode 保留为单模型结构化输出路径；旧 OpenAI Agents assembly 路径已从运行时移除。

并行策略：

- Interviewer 与 Researcher 同时启动，Researcher 使用已校验 intake、signals 与本地 notes 候选集。
- Fusion 等待访谈与检索结果。
- Copywriter 等待 Fusion。
- Image Director 与 Reviewer 在报告 JSON 完成后并行执行。

## PDF 架构

模型管线只产出 JSON：

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
