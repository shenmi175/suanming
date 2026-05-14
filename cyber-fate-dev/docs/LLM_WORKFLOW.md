# LLM Workflow

## 模式选择

入口：`src/lib/agents/runCyberFatePipeline.ts`

```text
ENABLE_OPENAI=false 或缺少 OPENAI_API_KEY -> mock
ENABLE_OPENAI=true + CYBER_FATE_LLM_MODE=openai-agents -> @openai/agents
ENABLE_OPENAI=true + CYBER_FATE_LLM_MODE=openai-direct -> OpenAI Responses Structured Output
```

任何 OpenAI 调用失败都会降级到 mock pipeline，并把错误写入 report reviewer issues。

## 角色输入输出

所有中间产物都有 Zod schema，定义在：

```text
src/lib/agents/schemas.ts
```

角色：

- Interviewer：输入 `IntakeProfile`，输出 profile、missingFields、userThemes、readyForReport。
- Researcher：输入 profile + calculatedSignals，输出 `ResearchNote[]`。
- Fusion Analyst：输入 profile + signals + notes，输出 sectionBlueprints、conflicts、uncertaintyNotes。
- Copywriter：输出结构化报告草稿；第一版 mock builder 直接生成 `CyberFateReport`。
- Reviewer：输出 passed、renderReady、issues、requiredRevisions。

## 本地知识库

`content/metaphysics/*.md` 使用简易 note block：

```text
id: wuxing-wood-growth
system: 五行
topic: 木
claim: 木象征生发、伸展、规划、仁与成长。
interpretiveUse: 可用于事业成长、人际扩张、学习规划、创造力章节。
```

读取器会统一转换成 `ResearchNote`，供 Researcher/Fusion/Copywriter 使用。

## Web Search / File Search

默认关闭联网工具：

```env
ENABLE_WEB_SEARCH=false
OPENAI_VECTOR_STORE_ID=
```

启用后，`src/lib/agents/cyberFateAgents.ts` 会把 `webSearchTool` 或 `fileSearchTool` 加入 Researcher。无论来源如何，最终都应归一为 `ResearchNote[]`。

## 安全边界

- API key 只在服务端读取。
- 浏览器不直接调用 OpenAI。
- 模型输出必须经过 Zod parse。
- PDF renderer 只消费 validated report JSON。
- 报告中必须包含娱乐声明与不确定性说明。
