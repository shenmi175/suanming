# Codex Master Prompt — Cyber Fate 初代产品

> 使用方式：把整段复制到 Codex 的新任务里。确保仓库里已经放入 `cyber_fate_skill_pack_v2` 的内容，尤其是 `AGENTS.md`、`.agents/skills/cyber-fate-dev/SKILL.md`、`.agents/skills/cyber-fate-reading/SKILL.md`、`docs/`、`templates/`、`content/`、`assets/`。

```text
你是 Codex，请根据本仓库中的 AGENTS.md 与 .agents/skills 里的 skill，完成一个“赛博玄学命理白皮书生成网站”的较成熟初代产品。请优先使用 $cyber-fate-dev，并在生成命理报告内容相关代码时使用 $cyber-fate-reading。

一、先读取并遵守这些项目资料

请先阅读：
1. AGENTS.md
2. README.md
3. docs/CODEX_TASKS.md
4. docs/PRD.md（如果存在）
5. docs/ARCHITECTURE.md（如果存在）
6. docs/LLM_WORKFLOW.md（如果存在）
7. .agents/skills/cyber-fate-dev/SKILL.md
8. .agents/skills/cyber-fate-dev/references/*
9. .agents/skills/cyber-fate-reading/SKILL.md
10. .agents/skills/cyber-fate-reading/references/*
11. schemas/*
12. templates/*
13. content/metaphysics/*
14. assets/stamps/*

如果这些文件缺失，请根据 skill pack 的意图补齐最小可用版本，但不要因此停止任务。

二、产品目标

我要的是一个可以本地运行、可演示、端到端闭环的初代产品，不是只做脚手架。

产品名称暂定：Cyber Fate / 赛博天命局。

用户体验目标：
用户进入网站后，通过访谈式表单提供姓名或昵称、出生日期、出生时间、出生地、当前居住城市、关心的人生领域、空间/风水偏好、想问的问题等信息。系统生成一份带赛博东方玄学视觉风格的“命运白皮书 PDF”。报告仅供娱乐，但要有仪式感、结构感和可读性。报告中需要包含多个领域的“算命印章”。

第一版必须做到：
1. 首页 / Landing Page
2. 访谈式 Intake 页面
3. 生成进度页面，显示多 agent 步骤
4. 报告预览页面
5. PDF 下载接口
6. 本地 mock 模式：没有 OPENAI_API_KEY 也能生成一份完整示例报告
7. OpenAI 模式：有 OPENAI_API_KEY 时调用官方 OpenAI SDK / Agents SDK 生成结构化报告
8. 本地玄学知识库读取
9. 命理 signal 计算模块
10. 印章系统
11. Reviewer 审阅回路
12. 基础测试、lint、build 全部可运行

三、技术栈要求：成熟方案优先，不要从零造轮子

请使用：
1. Next.js App Router
2. TypeScript
3. Tailwind CSS
4. shadcn/ui 或 Radix UI 组件
5. Zod 做 schema 与结构化输出约束
6. OpenAI 官方 `openai` Node SDK
7. OpenAI 官方 `@openai/agents` TypeScript SDK
8. Playwright 或 Puppeteer 生成 PDF，优先 Playwright
9. Vitest 做单元测试
10. React Hook Form 或同等成熟表单方案
11. date-fns/dayjs 等成熟日期库
12. 如果需要农历、节气、八字相关计算，优先寻找维护良好的现成 npm 包或封装 adapter，不要手搓复杂历法算法

禁止：
1. 不要自己从 0 写一个 agent framework
2. 不要让 LLM 直接吐一整份不可解析的 PDF 文案
3. 不要把 PDF 内容硬编码成一段字符串
4. 不要把复杂命理算法伪装成精确算法
5. 不要在没有用户出生时间时假装高精度
6. 不要为了追求完整玄学体系而破坏端到端交付

四、Agent / LLM 架构

必须使用“薄编排器 + 官方 Agents SDK”的方式。

实现目录建议：
- src/lib/agents/
  - cyberFateAgents.ts
  - runCyberFatePipeline.ts
  - schemas.ts
  - tools.ts
- src/lib/llm/
  - openaiClient.ts
  - modelConfig.ts
  - mockPipeline.ts
- src/lib/fate/
  - signals.ts
  - zodiac.ts
  - wuxing.ts
  - iching.ts
  - fengshui.ts
  - stamps.ts
- src/lib/research/
  - localKnowledge.ts
- src/lib/report/
  - reportSchema.ts
  - buildReport.ts
  - sampleReport.ts
- src/lib/pdf/
  - renderReportHtml.ts
  - generatePdf.ts

多 agent 角色：
1. Interviewer Agent：整理用户输入，补全访谈摘要，识别缺失信息与不确定性。
2. Researcher Agent：从本地知识库和可选 OpenAI hosted tools 中提取玄学资料，只产出 ResearchNote，不写最终报告。
3. Fusion Analyst Agent：融合用户输入、命理 signals、资料 notes，产出结构化解读骨架。
4. Copywriter Agent：写成中文赛博东方玄学风格白皮书，必须仍然输出结构化 JSON。
5. Reviewer Agent：检查逻辑矛盾、过度断言、章节缺失、印章不匹配，并给出修复建议。

执行方式：
- MVP 用顺序式 pipeline，不要一开始做自由 handoff。
- 每个 agent 都使用 Zod outputType 或等价结构化输出。
- 如果 API key 缺失，自动进入 mock mode。
- 如果某个 OpenAI 调用失败，页面要显示可理解错误；mock 模式必须始终可用。
- 保留 ENABLE_WEB_SEARCH、OPENAI_VECTOR_STORE_ID 等 env 开关；默认不要强依赖联网搜索。

五、报告 JSON 结构

最终报告不要直接是一段 markdown。请产出稳定 JSON，至少包含：

```ts
type CyberFateReport = {
  id: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  entertainmentNotice: string;
  userProfile: {
    displayName: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    currentCity?: string;
    focusAreas: string[];
    uncertaintyNotes: string[];
  };
  signals: {
    westernZodiac?: string;
    chineseZodiac?: string;
    wuxingProfile?: {
      dominantElements: string[];
      lackingElements: string[];
      notes: string[];
    };
    ichingHexagram?: {
      name: string;
      number?: number;
      theme: string;
    };
    fengshuiThemes?: string[];
  };
  executiveSummary: string;
  chapters: Array<{
    id: string;
    title: string;
    sealName?: string;
    summary: string;
    sections: Array<{
      heading: string;
      body: string;
      bullets?: string[];
    }>;
  }>;
  stamps: Array<{
    id: string;
    label: string;
    domain: string;
    reason: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
  reviewer: {
    passed: boolean;
    issues: Array<{
      severity: 'low' | 'medium' | 'high';
      message: string;
      suggestedFix?: string;
    }>;
  };
  appendix: Array<{
    title: string;
    body: string;
  }>;
};
```

可以扩展，但不要破坏基本字段。

六、命理 signal 模块要求

第一版要做“可解释、可测试、可降级”的简化命理 signals：

1. Western Zodiac：根据公历生日算星座。
2. Chinese Zodiac：根据年份粗略算生肖；如果没有农历/立春精确处理，要在 notes 标注“第一版按公历年份近似”。
3. Wuxing：基于季节、生肖、用户关注领域做象征性五行侧写。第一版可以是规则系统，但必须透明标注不是专业排盘。
4. I Ching Seed：根据用户输入生成稳定 seed，映射到 64 卦之一，保证同样输入得到同样结果。
5. Fengshui：根据当前城市、居住空间偏好、关注领域生成象征性风水建议。没有户型图/朝向时不要输出高精度宅盘。
6. Stamps：根据 signals 和 focusAreas 选择印章。

七、PDF 与视觉要求

报告预览和 PDF 要有完整视觉，不要只是一页纯文字。

视觉方向：赛博东方、黑金/霓虹/朱印、古籍章法 + 白皮书结构。

PDF 至少包含：
1. 封面
2. 用户命盘摘要页
3. 领域总览页
4. 事业 / 财帛 / 关系 / 空间风水 / 心性节律等章节，具体根据 focusAreas 决定
5. 印章页或章节内盖章效果
6. 附录：计算说明、娱乐声明、数据不确定性说明

实现建议：
- 先用 HTML/CSS 做 print 页面
- 用 Playwright 把 print 页面转 PDF
- 印章用 SVG/CSS 生成，不要依赖外部图片
- 提供 `/api/reports/[id]/pdf` 或同等下载接口
- 提供 sample report，方便无 API key 演示

八、页面与路由建议

请实现这些页面：

1. `/` 首页
   - 产品名
   - 简短介绍
   - “开始生成白皮书”按钮
   - 示例印章/报告截图区域，可以用真实组件占位

2. `/intake`
   - 访谈式 wizard 或表单
   - 字段包括 displayName、birthDate、birthTime、birthPlace、currentCity、focusAreas、question、homeDirection/homeLayoutNotes 可选
   - Zod 校验
   - 提交后进入生成流程

3. `/generate`
   - 显示 agent pipeline 进度
   - mock mode 下也显示步骤
   - 完成后跳转报告页

4. `/report/[id]`
   - 报告在线预览
   - 显示章节、印章、reviewer 状态
   - PDF 下载按钮

5. `/report/[id]/print`
   - 专门给 Playwright 渲染 PDF 的 print layout

6. `/api/reports`
   - POST 创建报告

7. `/api/reports/[id]`
   - GET 获取报告

8. `/api/reports/[id]/pdf`
   - GET 生成/下载 PDF

存储方式：
- 第一版可以用内存 + 本地 JSON 文件 + sample fixture。
- 如果实现数据库，优先 Prisma + SQLite，但不要让数据库复杂度阻断 MVP。
- 请明确 README 中说明本地存储限制。

九、测试与质量要求

必须添加测试，至少覆盖：
1. intake schema 校验
2. zodiac 计算
3. iching seed 稳定性
4. stamp selection
5. mock pipeline 生成完整 CyberFateReport
6. report schema parse
7. PDF HTML renderer 至少能生成非空 HTML

必须提供脚本：
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

如果当前项目没有 pnpm，请选择一种主流包管理器并在 README 写清楚。优先 pnpm。

十、环境变量

请创建 `.env.example`：

```env
OPENAI_API_KEY=
OPENAI_MODEL_DEFAULT=
OPENAI_MODEL_RESEARCHER=
OPENAI_MODEL_COPYWRITER=
OPENAI_MODEL_REVIEWER=
ENABLE_OPENAI=false
ENABLE_WEB_SEARCH=false
OPENAI_VECTOR_STORE_ID=
APP_BASE_URL=http://localhost:3000
```

规则：
- `ENABLE_OPENAI=false` 或 `OPENAI_API_KEY` 缺失时走 mock mode。
- 不要把 key 写进代码。
- README 要写清楚如何启用 OpenAI 模式。

十一、文档要求

请补充或更新：
1. README.md：项目介绍、安装、运行、环境变量、mock/OpenAI 模式、PDF 生成说明
2. docs/ARCHITECTURE.md：架构图文字版、核心模块、agent pipeline
3. docs/LLM_WORKFLOW.md：各 agent 输入输出、schema、失败降级
4. docs/CODEX_TASKS.md：后续迭代任务

十二、实现顺序

请按以下阶段推进，但不要每做完一个小阶段就停下来问我。能继续就继续，直到完成较成熟初代产品或遇到真正阻塞。

Phase 1：初始化/修复项目结构
- 确认 Next.js + TS + Tailwind 可运行
- 安装成熟依赖
- 建立目录结构
- 加 README 和 env example

Phase 2：Intake 与页面框架
- 首页
- intake 页面
- report 页面骨架
- print 页面骨架
- 基础 UI 组件

Phase 3：命理 signals 与本地知识库
- zodiac
- chinese zodiac
- wuxing
- iching seed
- fengshui themes
- stamps
- tests

Phase 4：报告 schema 与 mock pipeline
- CyberFateReport schema
- sample report
- mockPipeline
- create/get report API
- report preview 可用

Phase 5：OpenAI Agents SDK pipeline
- `@openai/agents` agent 定义
- structured output schemas
- local knowledge search tool
- optional web/file search hooks
- OpenAI mode env gate
- reviewer loop

Phase 6：PDF
- print layout CSS
- Playwright PDF generation
- API download route
- README 验证步骤

Phase 7：质量收口
- lint/test/build
- 修复失败
- 删除明显死代码
- 写清楚 mock/OpenAI 模式
- 给出最终验收说明

十三、验收标准

完成后必须满足：
1. `pnpm install` 后项目可运行
2. `pnpm dev` 可打开首页
3. 无 OPENAI_API_KEY 时，用户仍可完成 intake 并生成 mock 报告
4. 报告页有完整章节与印章
5. PDF 下载可用，至少能生成一份完整 PDF
6. `pnpm test` 通过
7. `pnpm lint` 尽量通过；如果模板工具造成非关键警告，请说明
8. `pnpm build` 通过；如果无法通过，请修复到通过，除非有明确不可控原因
9. README 能让一个没有编程经验的人按步骤启动
10. 最终回复必须列出：改动文件、运行命令、测试结果、如何启动、如何切换 OpenAI 模式、下一步建议

十四、产品边界

第一版不要做：
1. 登录注册
2. 支付
3. 复杂后台
4. 用户长期数据库
5. 完整专业八字/紫微/奇门精算
6. 上传户型图/图片分析
7. 多语言
8. 商业部署自动化

但要预留扩展接口。

十五、重要工程原则

1. 端到端优先：任何时候都优先保证“输入 → 生成 → 预览 → PDF 下载”闭环。
2. 成熟方案优先：用官方 SDK、成熟 UI/表单/测试/PDF 工具。
3. 结构化优先：agent 输出必须能被 schema parse。
4. 可降级优先：没有 key、没有联网、没有出生时间，都不能让产品崩。
5. 可演示优先：mock mode 要好看、完整、有仪式感。
6. 可测试优先：核心规则函数必须有测试。
7. 不要伪装精确：简化算法要在报告 appendix 说明。
8. 不要无意义询问：请自主做合理选择并继续实现。

现在开始执行。请先简要确认你读取了哪些项目指令文件，然后直接开始修改代码。完成后运行可用的测试/构建命令，并在最终回复中给出结果。
```

---

## 后续单独迭代 Prompt

如果 Codex 一次没有完整做完，可以按下面顺序继续。

### 续写 Prompt 1：补齐 Agents SDK

```text
请继续使用 $cyber-fate-dev 和 $cyber-fate-reading，重点补齐 OpenAI 官方 @openai/agents pipeline。

要求：
1. 不要自造 agent framework。
2. 定义 Interviewer、Researcher、Fusion Analyst、Copywriter、Reviewer 五个 Agent。
3. 每个 Agent 使用 Zod/JSON schema 结构化输出。
4. 默认 mock mode；ENABLE_OPENAI=true 且 OPENAI_API_KEY 存在时才调用真实 OpenAI。
5. Researcher 优先使用本地 content/metaphysics 知识库，web/file search 只做可选开关。
6. Reviewer 必须检查章节缺失、印章不匹配、过度断言和不确定性说明。
7. 给 mock pipeline 与 OpenAI pipeline 都写最小测试或可验证脚本。
8. 跑 pnpm test/build，修复失败。
```

### 续写 Prompt 2：补齐 PDF 与印章视觉

```text
请继续使用 $cyber-fate-dev，重点把报告预览和 PDF 做到可演示产品水平。

要求：
1. `/report/[id]` 是在线预览。
2. `/report/[id]/print` 是打印/PDF 专用页面。
3. `/api/reports/[id]/pdf` 用 Playwright 生成 PDF。
4. 印章使用 SVG/CSS 组件，不依赖外部图片。
5. PDF 至少有封面、摘要、章节、印章、附录。
6. 视觉方向为赛博东方、白皮书结构、朱印仪式感。
7. 没有 OPENAI_API_KEY 时 sample report 也能下载 PDF。
8. 更新 README 的 PDF 验证步骤。
9. 跑 pnpm test/build，修复失败。
```

### 续写 Prompt 3：产品成熟度收口

```text
请继续使用 $cyber-fate-dev，对当前项目做产品成熟度收口。

请检查并修复：
1. 首页是否像一个真实产品，而不是 demo 页面。
2. Intake 表单是否有校验、错误提示、默认值和顺畅跳转。
3. 生成进度是否展示五个 agent 步骤。
4. 报告是否结构完整、中文文案是否统一。
5. 印章是否根据 focusAreas 和 signals 合理出现。
6. 没有出生时间/出生地时是否有降级说明。
7. mock mode 是否足够好看。
8. README 是否适合非程序员启动。
9. 所有测试/build 是否通过。

完成后列出剩余技术债和下一版路线图。
```
