# Optional direct OpenAI SDK helpers

Primary multi-agent orchestration should use `templates/src/lib/agents/cyberFateAgents.ts` and `@openai/agents`.

These `llm` helpers are optional for simple one-shot model calls that do not need agent tools, handoffs, sessions, or tracing.
