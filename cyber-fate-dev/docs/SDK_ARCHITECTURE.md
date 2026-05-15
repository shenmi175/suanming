# Model SDK Architecture

## 关键原则

1. API key 只存在服务端环境变量中，推荐使用 `*_API_KEY_ENCRYPTED` 加密写法。
2. 浏览器不直接调用 PerceptLeap/OpenAI。
3. 用户报告必须由模型生成；缺少 key、代理失败或 schema 校验失败时直接返回错误。
4. 所有模型输出必须经过 Zod validation。
5. 角色模型名从环境变量读取，不写死在角色函数里。

## 当前运行路径

```text
src/lib/llm/perceptLeapClient.ts
src/lib/llm/perceptLeapStructuredOutput.ts
src/lib/llm/perceptLeapPipeline.ts
src/lib/agents/runCyberFatePipeline.ts
src/lib/env/serverEnv.ts
src/backend/server.ts
```

Next frontend 不再暴露 `/api/reports` 路由；报告生成、读取、PDF 下载都由独立 backend 进程提供。

默认：

```env
CYBER_FATE_LLM_MODE=perceptleap
ENABLE_PERCEPTLEAP=true
CYBER_FATE_ENV_SECRET=<long-passphrase>
PERCEPTLEAP_API_KEY_ENCRYPTED=enc:v1:...
```

可选单模型路径：

```env
CYBER_FATE_LLM_MODE=openai-direct
CYBER_FATE_ENV_SECRET=<long-passphrase>
OPENAI_API_KEY_ENCRYPTED=enc:v1:...
```

本地个人调试仍可使用 `PERCEPTLEAP_API_KEY` / `OPENAI_API_KEY` 明文变量；如果同时存在明文与加密值，加密值优先。

## 并行策略

- Interviewer 与 Researcher 并行。
- Fusion 等待二者输出。
- Copywriter 等待 Fusion。
- Image Director 与 Reviewer 并行。

## 错误策略

`/api/reports` 返回结构化错误：

```json
{
  "error": "MODEL_GENERATION_FAILED",
  "message": "...",
  "traceId": "...",
  "mode": "perceptleap",
  "hint": "..."
}
```

前端生成页右下角展示错误 toast，并提供复制反馈信息按钮。
