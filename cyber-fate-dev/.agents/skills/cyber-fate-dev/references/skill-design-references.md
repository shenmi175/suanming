# Skill design references

This skill pack borrows patterns from official and public skill examples. Use these as design guidance, not as code dependencies.

## OpenAI official skills catalog

Repository: https://github.com/openai/skills

Borrowed patterns:

- A skill is a folder with `SKILL.md`, optional `scripts/`, `references/`, and `assets/`.
- Keep the workflow repeatable and task-specific.
- Use helper scripts only when they improve reliability.

## OpenAI skill-creator

Reference: https://github.com/openai/skills/blob/main/skills/.system/skill-creator/SKILL.md

Borrowed patterns:

- Keep `SKILL.md` focused on essential workflow.
- Move detailed examples and variants into `references/`.
- Avoid duplicating the same information across files.
- Use progressive disclosure: metadata first, SKILL.md next, references only when needed.
- Validate skills after writing them.

## openai-agents-js in-repo skills

Examples:

- `.agents/skills/openai-knowledge/SKILL.md`
- `.agents/skills/examples-auto-run/SKILL.md`

Borrowed patterns:

- Use trigger-oriented descriptions.
- Prefer authoritative docs lookup when implementing OpenAI APIs.
- Provide deterministic helper scripts for repeatable operations.
- Keep commands and defaults explicit.

## openai-agents-python release-review skill

Example:

- `.agents/skills/final-release-review/SKILL.md`

Borrowed patterns:

- Define a purpose, quick start, gate policy, and concrete acceptance criteria.
- Avoid vague “blocked” / “failed” conclusions without evidence.
- Require actionable next steps.

## How to apply these patterns here

- `cyber-fate-dev` focuses on building the app.
- `cyber-fate-reading` focuses on generating the report.
- SDK details live in `references/openai-agents-sdk.md`.
- Mature stack choices live in `references/mature-stack.md`.
- Long task sequence lives in `docs/CODEX_TASKS.md`.
