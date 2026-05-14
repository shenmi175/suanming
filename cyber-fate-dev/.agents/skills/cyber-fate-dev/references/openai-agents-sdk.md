# OpenAI Agents SDK implementation notes

Use this reference when implementing real LLM agents.

## Why this SDK

OpenAI Agents SDK is the preferred foundation when the app needs multi-agent orchestration, specialist collaboration, handoffs, tools, tracing, sessions, or approvals. Do not build those primitives from scratch unless an official SDK limitation is proven.

Official docs to check during implementation:

- Agents SDK guide: https://developers.openai.com/api/docs/guides/agents
- TypeScript SDK: https://openai.github.io/openai-agents-js/
- Orchestration and handoffs: https://developers.openai.com/api/docs/guides/agents/orchestration

## Recommended pattern for this app

For MVP, prefer code-orchestrated sequential agents:

```text
IntakeProfile
  -> fate deterministic signals
  -> Researcher Agent output
  -> Fusion Analyst Agent output
  -> Copywriter Agent output
  -> Reviewer Agent output
  -> Report JSON
  -> HTML
  -> PDF
```

This is more controllable than asking a manager agent to decide the entire flow.

After MVP, add a manager agent that calls specialist agents as tools, or use handoffs when the conversation itself should move from one specialist to another.

## Minimal TypeScript shape

The exact API surface can change, so verify imports against the official TypeScript docs when Codex implements this. The intended shape is:

```ts
import { Agent } from "@openai/agents";

export const researcherAgent = new Agent({
  name: "Cyber Fate Researcher",
  instructions: "Return concise research notes, not final prose. Return JSON that matches the ResearchResult schema.",
});
```

Then put actual running/orchestration logic in `src/lib/agents/orchestrator.ts`, not scattered across API routes.

## Role model routing

Use environment variables or config rather than hard-coding:

```text
OPENAI_API_KEY=...
CYBER_FATE_LLM_MODE=mock | openai-structured | openai-agents
CYBER_FATE_DEFAULT_MODEL=...
CYBER_FATE_WRITER_MODEL=...
OPENAI_VECTOR_STORE_ID=...
ENABLE_WEB_SEARCH=false
```

## Tool selection

- Local metaphysics notes: application function/tool around `content/metaphysics`.
- Curated private knowledge base: OpenAI File Search / Vector Stores after local KB works.
- Live web search: optional and feature-flagged, only when the user asks for current information or the report needs updated references.
- Internal deterministic fate calculations: plain TypeScript functions, not LLM tools unless the agent truly needs to call them dynamically.

## Output typing

Every agent that feeds the app should return validated JSON. Avoid free-form text for intermediate artifacts.

## Tracing

Use the Agents SDK's tracing/debugging capabilities during development to inspect which role ran, which tools were called, and what output was produced.
