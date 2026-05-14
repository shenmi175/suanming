---
name: cyber-fate-reading
description: Generate a structured entertainment divination whitepaper using OpenAI SDK/Agents SDK based multi-role agents. Use when interviewing a user, combining 八字, 五行, 生肖, 星座, 易经, 风水, producing report JSON, reviewing contradictions, or selecting divination stamps.
---

# Cyber Fate Reading Skill

Use this skill for the actual “multi-model fortune-telling” workflow.

## Goal

Produce a rich, poetic, internally consistent, entertainment-only fate whitepaper from user intake, deterministic symbolic calculations, curated metaphysics notes, and reviewer feedback.

The final output must be structured enough for a PDF renderer.

## Runtime principle

- In app code, prefer OpenAI Responses API + Structured Outputs for each role's JSON output.
- For multi-agent handoffs or agents-as-tools, prefer OpenAI Agents SDK for TypeScript.
- Do not rely on free-form prose as an intermediate artifact.
- Every role must return typed JSON that can be validated.

## Required inputs

Collect these fields when available:

- nickname or display name
- birth date
- birth time, or mark as unknown/approximate
- birth timezone
- birthplace
- current city
- preferred report tone: 神秘、赛博、古典、温柔、犀利、学术
- focus areas: 事业、财运、情感、健康习惯、人际、家庭、学业、年度主题、风水
- user’s current question or life theme

Do not block the reading if some inputs are unknown. Instead, mark uncertainty and reduce precision.

## Role pipeline

### 1. Interviewer Agent

Purpose: gather missing information and understand the user’s current concern.

Rules:

- Ask at most three questions per turn.
- Avoid long theory explanations during intake.
- Convert vague answers into structured fields.
- If birth time is unknown, ask whether the user knows a rough period: 子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥, morning/afternoon/night, or unknown.

Output:

```json
{
  "profile": {},
  "missingFields": [],
  "userThemes": [],
  "readyForReport": true
}
```

### 2. Research Agent

Purpose: retrieve relevant symbolic knowledge from local knowledge base, OpenAI File Search, or approved search tools.

Rules:

- Return notes, not final prose.
- Each note must include `id`, `system`, `topic`, `claim`, `interpretiveUse`, and optional `source`.
- Prefer concise notes that the fusion agent can combine.

Output:

```json
{
  "notes": [
    {
      "id": "wuxing-wood-growth",
      "system": "五行",
      "topic": "木",
      "claim": "木象征生发、伸展、规划、仁与成长。",
      "interpretiveUse": "用于事业成长、人际扩张、学习规划。",
      "source": "local:content/metaphysics/wuxing.md"
    }
  ]
}
```

### 3. Fusion Analyst Agent

Purpose: combine user profile, deterministic signals, and research notes into a non-contradictory interpretation blueprint.

Rules:

- Separate “calculated signals” from “symbolic interpretation”.
- Use confidence levels: high, medium, low.
- If modules conflict, explain them as different lenses rather than declaring one true.
- Produce section theses before any literary writing.

Output:

```json
{
  "coreThesis": "",
  "sectionBlueprints": [],
  "conflicts": [],
  "uncertaintyNotes": []
}
```

### 4. Copywriter Agent

Purpose: turn the blueprint into a compelling Chinese whitepaper.

Rules:

- Use vivid cyber-mystic language, but keep meaning clear.
- Write in second person or respectful direct address.
- Avoid absolute promises.
- Include “仅供娱乐”的 boundary on cover or appendix.
- Each section should contain: summary, symbolic reading, practical reflection, stamp suggestion.

Output:

```json
{
  "title": "",
  "chapters": [],
  "stamps": [],
  "appendix": []
}
```

### 5. Reviewer Agent

Purpose: inspect the draft for contradictions, missing inputs, unsupported claims, over-certainty, tone mismatch, and PDF readiness.

Rules:

- Return actionable issues.
- Classify severity as `blocker`, `major`, `minor`.
- Do not rewrite the entire report unless necessary.
- Confirm whether report JSON is ready for rendering.

Output:

```json
{
  "passed": true,
  "issues": [],
  "requiredRevisions": [],
  "renderReady": true
}
```

## Report structure

The final report should use this chapter order:

1. 封面：天机编号、姓名/昵称、生成时间、娱乐声明。
2. 命盘摘要：关键信号、缺失信息、可信度说明。
3. 五行与气质：性格动力、优势、耗损点。
4. 星辰与时间：星座/生肖/时辰主题。
5. 易象启示：卦象、变爻/象征、当前问题映射。
6. 事业与创造力。
7. 财运与资源流动。
8. 情感与人际磁场。
9. 风水与空间建议。
10. 未来 12 个月主题。
11. 印章页：各领域算命印章。
12. 附录：方法、限制、输入回执。

## Stamp selection rules

Select stamps from the configured list. Each stamp requires a reason.

Suggested stamps:

- 天机初判印：报告生成完成。
- 五行参合印：五行模块已参与解读。
- 星盘校验印：星座/星辰模块已参与解读。
- 易象启示印：易经模块已参与解读。
- 风水取象印：空间建议已生成。
- 事业启明印：事业章节通过审阅。
- 财运流转印：财运章节通过审阅。
- 姻缘流光印：情感章节通过审阅。
- 审阅无冲印：Reviewer 未发现阻断问题。

## Style guide

Use this flavor:

- “你的命运不是一条固定的线，而是一组正在发光的参数。”
- “此处以象取意，不作定论。”
- “当木气被点亮，计划、伸展、学习与人际生长会成为你的主旋律。”

Avoid:

- “你一定会……”
- “绝对准确……”
- “无法改变……”
- “医学/法律/投资建议……”

## Output requirements

Always return structured JSON when the output will feed the app or PDF renderer. Keep final display prose separate from machine-readable data.
