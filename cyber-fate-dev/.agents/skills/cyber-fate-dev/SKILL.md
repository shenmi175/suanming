---
name: cyber-fate-dev
description: Build and iterate a Cyber Fate entertainment divination website using mature foundations: Next.js, TypeScript, OpenAI official SDK, OpenAI Agents SDK, structured outputs, local/RAG research, HTML-to-PDF, stamps, tests, and deployment tasks.
---

# Cyber Fate Development Skill

Use this skill whenever the user asks Codex to build, modify, debug, or plan the Cyber Fate website.

## Mission

Create a polished entertainment-first “cyber fortune-telling” website that interviews a user, combines symbolic metaphysics systems, generates a structured report, renders a PDF whitepaper, and applies themed divination stamps.

Build the pipeline first. Add deep metaphysics modules later.

## Mature-solution rule

Do not hand-roll a custom LLM framework unless there is a clear reason. Prefer:

- `openai` JavaScript/TypeScript SDK for direct model calls.
- `@openai/agents` for multi-agent orchestration.
- Responses API + Structured Outputs for JSON report generation.
- OpenAI File Search / Vector Stores for managed RAG after the local KB MVP.
- Playwright/Puppeteer for PDF rendering.
- Zod + JSON Schema for validation.

Before implementing SDK-specific code, verify syntax against current official docs or an installed `$openai-docs` skill if available.

## Default stack

Prefer this stack unless the repository already clearly uses another stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod for runtime validation
- JSON Schema for model structured outputs
- Vitest for pure functions
- Playwright or Puppeteer for HTML-to-PDF
- OpenAI SDK `openai`
- OpenAI Agents SDK `@openai/agents`
- Optional Supabase/Postgres only after the local MVP works

## Development style

1. Make small, reviewable changes.
2. Start every major feature with data contracts and schemas.
3. Keep deterministic calculations separate from LLM prose.
4. Keep LLM prompts in files or well-named modules, not scattered inline.
5. Add tests for pure functions before connecting them to UI.
6. Keep MockProvider/MockRunner for development and tests.
7. Use official SDK for real LLM execution.
8. End every task with changed files, verification commands, and next step.

## Product boundaries

- The app is for entertainment and symbolic self-reflection.
- Use language like “象征性解读”, “娱乐参考”, “倾向”, “主题”, and “可能性”.
- Avoid writing as if the system has certain supernatural proof.
- The UI and PDF should show “仅供娱乐，不作为现实决策依据”.

## Recommended repository structure

```text
src/
  app/
    page.tsx
    api/
      intake/route.ts
      report/route.ts
      pdf/route.ts
  components/
    intake/
    report/
    cyber-ui/
  lib/
    fate/
      zodiac.ts
      astrology.ts
      wuxing.ts
      iching.ts
    llm/
      openaiClient.ts
      structuredOutput.ts
      modelConfig.ts
      provider.ts
    agents/
      agents.ts
      orchestrator.ts
      prompts/
    research/
      knowledgeBase.ts
      fileSearch.ts
      citations.ts
    report/
      schema.ts
      buildReport.ts
      reviewer.ts
    pdf/
      renderHtml.ts
      generatePdf.ts
content/
  metaphysics/
public/
  stamps/
tests/
```

## Phase plan

### Phase 1: Scaffold

Build a clean Next.js TypeScript app with a cyber-style landing page and an intake form. No real LLM required.

Acceptance:

- `pnpm dev` works.
- Home page explains the product as entertainment.
- User can enter nickname, birth date, approximate birth time, birthplace, current city, and focus areas.
- Intake payload validates with Zod.

### Phase 2: Deterministic symbolic modules

Implement small pure modules:

- Western zodiac from month/day.
- Chinese zodiac from year, with a clear note if lunar new year is not implemented yet.
- Basic five-element mapping placeholder.
- I Ching hexagram generator from a seed.

Acceptance:

- Functions live in `src/lib/fate`.
- Vitest covers normal and edge cases.
- Each module returns structured JSON, not prose.

### Phase 3: Report schema and mock pipeline

Create a report schema and generate a mock whitepaper from intake + symbolic modules.

Acceptance:

- API route returns `Report` JSON.
- Report includes sections: 封面、用户画像、命理概览、事业、财运、情感、人际、风水建议、年度主题、印章页、附录。
- No model calls required yet.

### Phase 4: OpenAI SDK foundation

Add official SDK integration, but keep mock mode.

Acceptance:

- Install `openai`.
- Add `src/lib/llm/openaiClient.ts` reading API key only from env.
- Add a `generateStructuredOutput` helper using Responses API + JSON Schema.
- Add tests for schema validation with mock responses.
- Do not expose API keys to browser code.

### Phase 5: Multi-role agent orchestration

Implement roles as typed agents:

- Interviewer
- Researcher
- Fusion Analyst
- Copywriter
- Reviewer

Use `@openai/agents` for real orchestration after MockRunner works.

Acceptance:

- Roles accept and return typed JSON.
- Pipeline logs intermediate artifacts.
- Reviewer can flag contradictions and missing inputs.
- Role-to-model mapping lives in config.

### Phase 6: Knowledge base / research

Add a local knowledge base in `content/metaphysics` before live web search.

Acceptance:

- Researcher can retrieve relevant notes by module and topic.
- Notes have stable IDs, source labels, and short summaries.
- Copywriter may use notes only through the structured `ResearchNote` object.

### Phase 7: Managed RAG / Search, optional

After local KB works, evaluate OpenAI File Search / Vector Stores for curated metaphysics material.

Acceptance:

- A feature flag can switch between local KB and managed file search.
- Retrieved notes are normalized into the same `ResearchNote` shape.
- Sources are tracked.

### Phase 8: PDF whitepaper

Render report JSON to HTML, then PDF.

Acceptance:

- Generated PDF has cover, table of contents, content sections, stamp page, appendix.
- Stamp assets are deterministic SVG or CSS first.
- PDF route can be smoke-tested.

### Phase 9: Polish and deployment

Add saving, sharing, payment gates, account system, or deployment only after the full local report flow works.

## Multi-model implementation rule

Do not hard-code five different models in early MVP. Create role config first:

```ts
export type AgentRole = 'interviewer' | 'researcher' | 'fusion' | 'copywriter' | 'reviewer';

export interface RoleModelConfig {
  role: AgentRole;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}
```

Then implement:

1. `MockRunner` for development and tests.
2. `OpenAIStructuredOutputRunner` for direct Responses API calls.
3. `OpenAIAgentsRunner` using `@openai/agents` when multi-agent orchestration is needed.

## Agent SDK rule

For a simple sequential pipeline, direct structured calls may be enough. For handoffs, agent-as-tool, tracing, or specialized roles, use `@openai/agents` rather than hand-rolled orchestration.

## PDF implementation rule

Never ask the LLM to create raw PDF bytes. LLM generates validated report JSON. Code renders JSON to HTML. Playwright/Puppeteer converts HTML to PDF.

## Stamps implementation rule

Stamps are content badges attached to report sections. Store them as config:

- `id`
- `label`
- `domain`
- `trigger`
- `assetPath`
- `meaning`

Apply stamps only after reviewer pass or with a visible “待校验” status.

## Codex completion checklist

At the end of every task, report:

- Files changed.
- Commands run.
- Test/lint status.
- What works now.
- Known limitations.
- Best next prompt for the user to paste.
