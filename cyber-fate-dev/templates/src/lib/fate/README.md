# Fate calculator templates

Codex should implement deterministic symbolic calculators here.

Rules:

- Return JSON signals only.
- No long prose in calculator functions.
- Add Vitest tests before connecting to LLM agents.
- Mark approximation explicitly.

Suggested modules:

```text
westernZodiac.ts
chineseZodiacApprox.ts
wuxing.ts
iching.ts
bazi.ts  # later; do not implement complex calendar math from scratch in MVP
```

Example signal:

```ts
export type CalculatedSignal = {
  id: string;
  module: string;
  label: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
};
```
