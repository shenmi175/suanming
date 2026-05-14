# Cyber Fate 当前迭代任务

## 已定运行原则

- 用户报告必须由模型生成。
- 模型错误直接反馈到页面右下角 toast，不生成本地替代报告。
- Interviewer 与 Researcher 并行，Image Director 与 Reviewer 并行。
- 报告 JSON 必须通过 Zod schema 后才能保存和渲染 PDF。

## 后续任务

1. 增加端到端 Playwright 测试：无 key 错误 toast、成功生成报告、PDF 下载。
2. 增加模型调用耗时统计和 traceId 服务端日志。
3. 增加一次 Reviewer blocker 后的模型修订回路。
4. 评估成熟农历/节气库，替换当前公历近似生肖边界。
5. 增加报告历史列表、删除报告、重新生成报告。
