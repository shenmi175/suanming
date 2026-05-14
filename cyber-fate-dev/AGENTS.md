# Cyber Fate 项目 Codex 工作约定

## 用户背景

用户没有编程经验。每次任务都必须小步、可运行、可回滚。不要一次性实现全部玄学体系。

## 技术底座优先级

1. 多角色生成：优先使用 PerceptLeap Responses API + typed pipeline。
2. 直接模型调用：需要简单单次模型请求时使用官方 `openai` Node SDK 的 `openai-direct` 路径。
3. 结构化输出：优先使用 Zod schema + JSON Schema；不要靠纯 prompt 要 JSON。
4. 资料检索：MVP 先用本地 `content/metaphysics`；后续联网/私有资料库必须归一为 `ResearchNote[]`。
5. Web：Next.js App Router + TypeScript。
6. UI：Tailwind CSS + shadcn/ui，避免从零写基础组件。
7. PDF：HTML 模板 + Playwright PDF。
8. 测试：Vitest 测纯函数，Playwright 做页面/PDF smoke test。
9. 数据库：MVP 不要上数据库；需要保存报告后再用 Supabase/Postgres。

## 严禁造轮子

- 不要自己写通用 agent framework。
- 不要自己实现浏览器 PDF 引擎。
- 不要自己实现完整农历、节气、八字天文历法，除非已经证明现成库无法满足。
- 不要把五个 agent 写成五段散落的 prompt；必须有统一 schema、日志和 orchestration。
- 用户报告必须由模型生成；模型失败时显式报错，不生成本地替代报告。

## 推荐目录

```text
src/
  app/
    page.tsx
    intake/page.tsx
    report/[id]/page.tsx
    api/
      chat/route.ts
      report/route.ts
      pdf/route.ts
  components/
    intake/
    report/
    cyber-ui/
  lib/
    agents/
      runCyberFatePipeline.ts
      schemas.ts
      tools.ts
    fate/
      zodiac.ts
      astrology.ts
      wuxing.ts
      iching.ts
      bazi.ts
    research/
      localKnowledge.ts
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

## Codex 每次完成任务必须汇报

- 改了哪些文件。
- 运行了哪些命令。
- lint/test/build 状态。
- 当前能演示什么。
- 已知限制。
- 下一步推荐 prompt。
