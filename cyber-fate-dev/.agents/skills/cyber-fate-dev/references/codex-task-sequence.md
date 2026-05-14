# Codex task sequence

Use this when implementing the project from zero.

## Phase 1 prompt

```text
请使用 $cyber-fate-dev 初始化项目。
建立 Next.js + TypeScript + Tailwind + shadcn/ui 项目，安装 @openai/agents、openai、zod、playwright、vitest。
建立目录结构、intake schema、mock report schema、首页、intake 页面、mock report 预览。
不要调用真实 LLM。
运行 lint/test/build，并输出文件变更、验证结果和下一步 prompt。
```

## Phase 2 prompt

```text
请使用 $cyber-fate-dev 实现确定性命理模块。
实现 western zodiac、Gregorian-year Chinese zodiac approximation、basic wuxing mapping、seeded I Ching hexagram。
所有模块返回 JSON signals，不写散文。
添加 Vitest 测试。
```

## Phase 3 prompt

```text
请使用 $cyber-fate-dev 接入 OpenAI Agents SDK pipeline。
创建 Interviewer、Researcher、Fusion Analyst、Copywriter、Reviewer 五个 Agent。
每个 Agent 使用 Zod outputType。
Researcher 先使用 local_metaphysics_search function tool，不开启 webSearchTool。
生成中间产物调试页面。
```

## Phase 4 prompt

```text
请使用 $cyber-fate-dev 实现 PDF 白皮书。
把 Report JSON 渲染成 HTML，再用 Playwright 生成 PDF。
实现封面、目录、章节、印章页、附录。
添加 PDF smoke test 或手动验证命令。
```

## Phase 5 prompt

```text
请使用 $cyber-fate-dev 优化报告质量。
让 Reviewer 检查章节之间的矛盾、缺失输入、过度确定性、stamp reason 是否存在。
如果 reviewer 有 blocker，则回到 Copywriter 修订一次。
```

## Phase 6 prompt

```text
请使用 $cyber-fate-dev 扩展研究层。
在本地知识库基础上，加入可配置的 webSearchTool 和 fileSearchTool。
默认关闭联网搜索，只有 ENABLE_WEB_SEARCH=true 时开启。
```
