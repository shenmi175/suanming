# Cyber Fate 后续迭代任务

当前第一版已完成本地端到端闭环：intake -> pipeline -> report preview -> PDF。

## P0：稳定演示

- 为 `/api/reports/[id]/pdf` 增加端到端 smoke test。
- 在开发机上固定 Playwright 浏览器路径或完成 `playwright install chromium`。
- 增加生成失败时的前端重试按钮。

## P1：OpenAI 质量增强

- 为 openai-agents 模式加入 Copywriter Agent 的结构化输出，而不是只由 deterministic builder assembly。
- 把 Reviewer blocker 回路接入一次自动修订。
- 记录 agent artifacts 到本地 JSON，给调试页展示。

## P2：命理模块升级

- 评估维护良好的农历/节气 npm 包，例如 `lunar-javascript`。
- 增加出生时间未知、生日接近春节、海外时区等 fixtures。
- 保持所有复杂计算都返回透明 JSON，不输出绝对化断语。

## P3：产品化

- 报告历史列表。
- 分享链接与导出文件命名优化。
- 样式 token 化与 Figma/设计系统对齐。
- 数据库与账号系统，放在本地 MVP 稳定之后。
