# Reference Skills and Patterns

这个项目的 skill 不应该凭空写。建议参考以下模式。

## 官方参考

### OpenAI Skills Catalog

用途：看官方/社区 skill 的目录结构、`SKILL.md` 元数据和可复用资源组织方式。

参考重点：

- 每个 skill 聚焦一个明确任务。
- `SKILL.md` 只放稳定流程与判断规则。
- 可复用脚本、模板、参考资料应放在 skill 目录内，而不是塞进一个超长 prompt。

### Skill Creator

用途：学习如何从具体案例抽象成可复用 skill。

参考重点：

- 先收集具体使用例。
- 再规划可复用内容：scripts、references、assets。
- 初始化、验证、迭代，而不是一次写完。

### OpenAI Docs Skill

用途：让 Codex 开发 OpenAI API 相关代码时优先查最新官方文档。

参考重点：

- SDK 语法和模型参数容易变化，应该在实现时核对。
- 不要把旧版 Chat Completions / Assistants API 习惯强行套到 Responses API。

### Codex AGENTS.md

用途：项目级约束。

参考重点：

- `AGENTS.md` 应短、具体、可执行。
- repo-level 约定负责技术栈、目录、验收标准。
- skill 负责某个可复用工作流。

## 社区参考

### promptfoo skill examples

用途：参考如何把 eval / 测试流程写进 skill。

对本项目的启发：

- 给命理报告生成做 fixtures。
- 固定检查项：章节完整、schema 合法、没有绝对化措辞、PDF 可生成。

### awesome-codex-skills

用途：参考不同任务型 skill 的粒度。

对本项目的启发：

- 不要只写一个巨大的万能 skill。
- 可以拆成 dev skill、reading skill、eval skill、visual style skill。

## 本项目采用的参考模式

```text
.agents/skills/cyber-fate-dev/SKILL.md
  负责开发流程、技术栈、目录结构、验收标准

.agents/skills/cyber-fate-reading/SKILL.md
  负责应用内多角色算命报告流程

docs/*.md
  负责架构、SDK、任务序列、参考资料

templates/*
  负责给 Codex 可复制的代码骨架

scripts/*
  负责验证 skill 包和后续 eval
```

## 不建议照搬的地方

- 不要把别人的 skill 全文复制进来。
- 不要为了“多 agent”而牺牲可调试性。
- 不要让 skill 变成玄学百科全书；知识库应该单独维护。
