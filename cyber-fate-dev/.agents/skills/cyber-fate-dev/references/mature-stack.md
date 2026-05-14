# Mature stack decisions

This project should avoid custom infrastructure until a real limitation appears.

## Core stack

| Area | Use | Avoid |
|---|---|---|
| Web app | Next.js App Router + TypeScript | Custom SSR server |
| UI | Tailwind + shadcn/ui + lucide-react | Hand-building all base components |
| Agent runtime | OpenAI `@openai/agents` | Custom agent framework |
| Direct model calls | Official `openai` Node SDK | Raw fetch calls everywhere |
| Structured output | Zod + Agent `outputType` | Prompt-only JSON |
| Search/RAG | Local notes first, then `webSearchTool` / `fileSearchTool` | Scraping random sites in app code |
| PDF | HTML template + Playwright | LLM-generated PDF bytes |
| Tests | Vitest + Playwright smoke tests | Manual-only verification |
| Persistence | Supabase/Postgres after MVP | Premature custom backend |

## Metaphysics calculation modules

Do not implement complex Chinese calendar math from scratch in MVP.

Phase 1 approximation:

- Zodiac: Gregorian year approximation, with visible note.
- Western zodiac: deterministic month/day calculation.
- Five elements: simple symbolic mapping.
- I Ching: seeded deterministic hexagram.

Phase 2 upgrade:

- Evaluate a maintained lunar calendar library such as `lunar-javascript` or an equivalent package before implementing Chinese lunar calendar, solar terms, heavenly stems, earthly branches, and bazi calculations.
- Add tests around known public examples.
- Keep all calculator outputs as JSON signals, not prose.

## PDF choice

Use HTML + Playwright because:

- Designers can iterate in HTML/CSS.
- The same report preview can be used in the browser.
- Stamps can be SVG/CSS.
- Generated PDF can be smoke-tested.

## Research choice

Start with local notes because metaphysics knowledge is mostly stable and curated tone matters. Add live web only for current cultural references, updated sources, or user-requested research.

## Suggested command sequence

```bash
pnpm create next-app@latest . --ts --tailwind --eslint --app
pnpm add @openai/agents openai zod date-fns clsx tailwind-merge lucide-react
pnpm add -D vitest @playwright/test tsx prettier
pnpm dlx shadcn@latest init
```

Codex should adapt commands to the actual package manager and existing repo.
