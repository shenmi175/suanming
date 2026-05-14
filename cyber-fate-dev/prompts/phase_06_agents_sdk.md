请使用 $cyber-fate-dev 加入 OpenAI Agents SDK。

目标：实现真实多角色 agent 编排，但不破坏已有 mock pipeline。

要求：
1. 安装 `@openai/agents`。
2. 新建 `src/lib/agents/agents.ts`，定义 Interviewer、Researcher、Fusion、Copywriter、Reviewer。
3. 新建 `src/lib/agents/orchestrator.ts`，支持 mock、openai-structured、openai-agents 三种模式。
4. 优先使用 agents-as-tools 或 handoffs，不要手搓复杂 agent 框架。
5. 所有角色输出仍必须是可验证 JSON。
6. debug 页面能查看每个 role 的输入输出。
