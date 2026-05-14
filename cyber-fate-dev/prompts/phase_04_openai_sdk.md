请使用 $cyber-fate-dev 加入 OpenAI 官方 SDK 底座。

目标：不从零手搓 LLM 调用，使用官方 `openai` SDK + Responses API + Structured Outputs。

要求：
1. 安装 `openai`。
2. 新建 `src/lib/llm/openaiClient.ts`，只从服务端 env 读取 `OPENAI_API_KEY`。
3. 新建 `src/lib/llm/structuredOutput.ts`，封装 JSON Schema structured output。
4. 新建 `src/lib/llm/modelConfig.ts`，维护 role -> model 配置。
5. 保留 MockProvider，测试不依赖真实 API。
6. 添加 `.env.example`。
7. 完成后运行 lint/test/build。
