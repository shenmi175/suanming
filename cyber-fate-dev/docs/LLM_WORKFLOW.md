# LLM Workflow

## 模式选择

HTTP 入口：`src/backend/server.ts`

模型编排入口：`src/lib/agents/runCyberFatePipeline.ts`

```text
CYBER_FATE_LLM_MODE=perceptleap + ENABLE_PERCEPTLEAP=true + PERCEPTLEAP_API_KEY 或 PERCEPTLEAP_API_KEY_ENCRYPTED -> PerceptLeap Responses API
ENABLE_OPENAI=true + CYBER_FATE_LLM_MODE=openai-direct + OPENAI_API_KEY 或 OPENAI_API_KEY_ENCRYPTED -> OpenAI Responses Structured Output
缺少可用 API key 或 API 调用失败 -> backend API 返回错误，生成页右下角 toast 显示 traceId
```

所有运行时配置集中在 `src/lib/env/serverEnv.ts`；加密 API key 需要同时提供 `CYBER_FATE_ENV_SECRET`。
任何 PerceptLeap/OpenAI 调用失败都会由 backend API 返回错误，不会生成本地替代报告。Next frontend 只通过 HTTP 调 backend，不直接调用模型 SDK。

## 角色输入输出

所有中间产物都有 Zod schema，定义在：

```text
src/lib/agents/schemas.ts
```

角色：
- Interviewer：输入 `IntakeProfile`，输出 profile、missingFields、userThemes、readyForReport。
- Researcher：输入 profile + calculatedSignals + local/web notes，输出 `ResearchNote[]`。
- Fusion Analyst：输入 profile + signals + notes，输出 sectionBlueprints、conflicts、uncertaintyNotes。
- Copywriter：输出结构化报告草稿；PerceptLeap 模式生成完整中文报告 JSON。
- Reviewer：输出 passed、renderReady、issues、requiredRevisions。
- Image Director：生成封面图提示词；`ENABLE_PERCEPTLEAP_IMAGE=true` 时调用 `gpt-image-2` 生成图像。

并行关系：
- Interviewer、web research、Researcher 并行启动，Fusion 等待它们完成。
- Copywriter 等待 Fusion。
- Image Director 与 Reviewer 在报告生成后并行执行。

## 本地知识库

`content/metaphysics/*.md` 使用简化 note block：

```text
id: wuxing-wood-growth
system: 五行
topic: 木
claim: 木象征生发、伸展、规划、仁与成长。
interpretiveUse: 可用于事业成长、人际扩张、学习规划、创造力章节。
```

读取器会统一转换成 `ResearchNote`，供 Researcher/Fusion/Copywriter 使用。

## Web Search / File Search

Docker 启动默认开启自托管联网研究：

```env
ENABLE_WEB_SEARCH=true
WEB_RESEARCH_PROVIDER=searxng
SEARXNG_BASE_URL=http://searxng:8080
OPENAI_VECTOR_STORE_ID=
```

纯本地开发如果没有启动 SearXNG/Postgres，可以把 `ENABLE_WEB_SEARCH=false`。启用后，backend 会通过 SearXNG 搜索、抓取网页正文、Readability 清洗、缓存到 PostgreSQL 或文件缓存，并把结果归一成 `ResearchNote[]` 交给 Researcher。

## 安全边界

- API key 只在服务端读取。
- 浏览器不直接调用 PerceptLeap/OpenAI。
- 模型输出必须经过 Zod parse。
- PDF renderer 只消费 validated report JSON。
- 报告必须包含娱乐声明与不确定性说明。
