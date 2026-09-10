# Design Token Scaffold

一套可直接运行、零运行时依赖的 Design Token 脚手架。它用“基础值 → 语义值 → 组件值 → 主题覆盖”的结构管理项目样式，并构建 Web 和 TypeScript 可消费的产物。

核心脚手架不依赖飞书妙搭。它可以在任意电脑、任意本地前端项目和不同编码 Agent 中运行；`miaoda/` 目录只是可选的平台适配资料，不参与 Token 引擎、抽取器和构建器的核心运行。

完整字段定义见 [`docs/token-contract.md`](docs/token-contract.md)。用于从已有项目提取候选 Token 的 Agent Skill 位于 [`skills/extract-design-tokens`](skills/extract-design-tokens)，用于落地页面和组件的 Skill 位于 [`skills/apply-design-tokens`](skills/apply-design-tokens)。

## 快速开始

需要 Node.js 20 或更高版本。

```bash
npm run check
```

对已有项目进行第一轮事实盘点：

```bash
npm run extract -- --root D:\your-project --output D:\your-project\design-system\audit --exclude docs
```

命令说明：

- `npm run validate`：检查名称、类型、说明、别名、循环引用和模式完整性。
- `npm test`：运行 Token 引擎单元测试。
- `npm run build`：生成 `dist/` 中的 CSS、JSON、TypeScript 和清单文件。

抽取 Skill 除了 `raw-inventory.json` 和 `candidate-tokens.json`，还会生成 `structure-inventory.json`、`layout-inventory.json` 与 `font-inventory.json`：前者记录标题层级、页面地标、表格结构和组件使用位置，中者记录源码中实际出现的 MUI/Tailwind/CSS 栅格列定义与响应式线索，后者记录字体声明及资源地址。它们都是证据清单，不会把某个项目的 2 列、3 列或字体声明擅自变成已验证的全局规则；模型需回到来源文件和运行时，产出有插槽的页面模板代码和登记表。

## 分层结构

```text
src/tokens/
├── primitives/      原始颜色、字号、间距、圆角、阴影、动效等
├── semantic/        light、dark、high-contrast 中的用途映射
├── components/      Button、Input、Card、Dialog 等组件决策
└── themes/          品牌、密度或产品线覆盖
```

业务代码应优先消费语义 Token 或组件 Token，避免直接依赖原始色阶。

## 安装到现有项目并让模型执行

首次把脚手架安装到一个外部项目时，在脚手架目录运行一次：

```bash
npm run project:init -- --target D:\your-project
```

这一个命令会完成目标项目初始化、首次样式抽取、两个仓库级 Skills 安装，以及
`AGENTS.md`、`CLAUDE.md` 规则写入。抽取证据默认放在 `design-system/audit/`。
脚手架会复制两个仓库级 Skills 到
`.agents/skills/extract-design-tokens/` 和 `.agents/skills/apply-design-tokens/`，并在目标项目的
`AGENTS.md`、`CLAUDE.md` 中写入一段可重复更新的规则。模型重新打开项目后会按这些规则自动匹配 Skill；也可以显式输入
`$extract-design-tokens`（抽取和审计）或 `$apply-design-tokens`（按规范实现页面）。

初始化器会在目标项目的 `package.json` 中登记唯一的刷新脚本（只在缺少时写入，不覆盖其他脚本）：

```json
{
  "scripts": {
    "project:init": "node design-system/scripts/project-init.mjs"
  }
}
```

以后需要刷新审计时，在目标项目根目录执行：

```bash
npm run project:init
```

脚本会以当前目录为项目根目录，刷新 `design-system/audit/` 和构建产物，不再需要 `--target`、`--agent` 等参数。第一次带 `--target` 的安装命令已经完成首次扫描和构建，不需要紧接着重复执行这条命令。

如果只需要安装文件而暂时不扫描源码，可以加 `--skip-extract`；一般不需要使用这个选项。

完成初始化后，用户不需要再手动执行抽取步骤，直接描述页面即可，例如：

```text
生成一个产品列表页：复用项目已有壳层和列表模板，使用已抽取的 Token，接入现有路由和菜单。
```

模型会先读取 `design-system/audit/` 和项目源码；如果正式 Token 或页面模板尚未沉淀，会在同一轮任务中补齐，再实现页面。

如果项目使用 Claude Code，初始化时选择 `--agent claude` 或 `--agent both` 会写入项目命令
`.claude/commands/build-page.md`。之后可直接使用：

```text
/build-page 生成一个产品列表页，复用现有公共壳层和最接近的页面模板
```

该命令只是项目级提示词入口，真正的约束仍来自 `AGENTS.md`/`CLAUDE.md`、Design Token 和模板代码；也可以完全使用自然语言，不依赖斜杠命令。

### 不使用妙搭的本地项目

本地项目只需要使用通用脚手架的安装器和仓库级规则，不需要安装或注册 `miaoda/` 下的任何扩展：

1. 在脚手架目录执行一次 `npm run project:init -- --target D:\your-project`；这一步同时安装 `design-system/`、抽取 Skill、应用 Skill、项目规则，并完成首次扫描和构建。
2. 不需要立即重复执行命令。以后源码或主题发生变化时，再进入项目根目录执行无参数的 `npm run project:init` 刷新审计和构建产物。
3. 使用支持 `AGENTS.md`/`.agents/skills` 的本地编码 Agent；Claude Code 可以使用 `.claude/commands/页面开发.md`，其他 Agent 直接用自然语言提出页面需求。
4. 首次抽取只产生机械审计和构建产物；语义 Token、Recipe、页面模板和迁移映射由本地抽取 Skill 结合源码沉淀，不依赖 `@设计变量解析`。

### 接入飞书妙搭

妙搭的 Agent 是云端项目 Agent，不能直接读取你电脑上的本地项目，也不会自动把本地 `.claude/commands` 当成规范。推荐先在项目根目录执行：

```bash
npm run project:init
```

`project:init` 会同时刷新审计并构建 `design-system/dist/`。

然后将业务代码和 `design-system/` 一起通过妙搭的“导入新建应用”导入 ZIP；也可以把 `design-system/` 放入已有妙搭应用，再把
[`docs/miaoda-agent.md`](docs/miaoda-agent.md) 中的首轮提示词发送给 Agent。妙搭官方支持 ZIP 项目导入，并支持在对话中继续分析代码、依赖和页面上下文。

导入后不要只告诉妙搭“做成某某风格”，而应先要求它读取 `design-system/docs/miaoda-agent.md`、`design-system/audit/`、正式 Token 和页面模板，再提出页面需求。只要这些文件已经随项目代码导入，妙搭 Agent 可以直接读取，不需要再用 `@文件解析` 重复附加。若妙搭开发容器提供终端能力，可在其中运行 `npm run project:init`；必须以真实返回码和产物更新为成功证据，否则使用 CI 或本地项目环境执行。

其中 `audit/` 是真实源码证据，若正式 Token 尚未由模型确认，`dist/` 只能视为脚手架基线；不要把基线 Token 当成已完成的品牌规范。

妙搭中的 `/` 可以管理和选择项目技能，`@` 可以选择插件或组件。脚手架会生成两个已经写好的固定扩展定义、安装指令和 `manifest.json`：`design-system/miaoda/extensions/slash-page-development.md`（`/页面开发`）、`design-system/miaoda/extensions/at-design-variable-parser.md`（`@设计变量解析`）以及 `design-system/miaoda/install-skill-prompt.md`。在妙搭的“告诉妙搭创建技能”入口中，只使用安装指令把固定文件原样注册，不要让 Agent 自行生成规则；项目内的 Token、审计和模板由 Agent 直接读取，只有项目外部资料才使用 `@文件解析`。清单不会绕过妙搭权限自动注册扩展；详细配置和提示词见 [`docs/miaoda-agent.md`](docs/miaoda-agent.md)。

妙搭首次接入按固定顺序操作：先在应用项目根目录确认/写入 `AGENTS.md` 或 `CLAUDE.md`；再原样注册 `/页面开发`；然后调用 `@设计变量解析`，先在可执行环境运行 `npm run project:init`，再依据真实源码生成/刷新 `/页面开发` 读取清单中的步骤 2–5；最后执行 `/页面开发`。步骤 5 是对现有壳层、插槽和页面模式的登记，不是复制完整业务页面。初始化完成后，日常新增页面只调用 `/页面开发`；只有主题、字体、组件覆盖、公共壳层或审计发生变化时才重新调用 `@设计变量解析`。

妙搭的逐项操作手册见 [`miaoda/README.md`](miaoda/README.md)；其中明确了同步清单、固定注册指令、`/` 与 `@` 的执行顺序和无终端环境下的回退方式。

默认同时写入 Codex 和 Claude 的规则；如果只需要其中一种，才使用 `--agent codex` 或 `--agent claude`。
已有文件不会被覆盖，确需刷新脚手架文件时再加 `--force`。

`examples/` 如果存在，仅用于演示脚手架能力；真实项目的 Token、审计和页面代码必须留在各自项目目录，不会被脚手架安装器复制进其他项目。

### 运行后会沉淀什么

抽取一个真实项目时，结果分为四类：

1. **证据层**：`raw-inventory.json`、`candidate-tokens.json`、`structure-inventory.json`、`layout-inventory.json`、`font-inventory.json`、`audit-report.md`，保留值、来源、频次、语义结构、布局/字体线索和未决缺口。初始化命令会自动生成这一层。
2. **规范层**：`canonical/` 下的 Primitive、Semantic、Component、主题模式、迁移映射和中文 `design-spec.md`；这些需要模型结合源码语义确认，不能由正则扫描直接批准。
3. **模板层**：`page-templates.json` 与 `templates/*.tsx` 等可编译代码，登记已有 AppShell/Layout 的复用点、列表/选项卡/设置/两列/三列内容网格等实际存在的模式、插槽、响应式和验证状态；不复制完整业务页面。
4. **执行层**：目标项目的 `design-system/`、两个 Agent Skill，以及 `AGENTS.md`/`CLAUDE.md` 中的规则。模型打开项目后先读这些规则，再按模板和 Token 实现新页面。

其中“扫描脚本”负责可重复的事实盘点，“模型”负责源码上下文、语义命名、模板抽象和缺口标记；`npm run check/build` 负责 Token 契约、引用和产物生成，不等同于视觉验收。

## Token 格式

文件使用便于审查和合并的扁平名称，同时采用接近 DTCG 的 `$type`、`$value`、`$description` 字段：

```json
{
  "color.action.primary.default": {
    "$type": "color",
    "$value": "{color.brand.600}",
    "$description": "主要操作默认色"
  }
}
```

别名必须完整引用另一个 Token，且两者类型必须一致。不要在业务代码里写原始值；先补充 Token，再构建产物。

## 新增一个 Token

1. 将原始视觉值加入 `primitives/`。
2. 在每个 `semantic/*.json` 模式中添加相同名称的语义映射。
3. 组件专属决策放入 `components/` 并引用语义值。
4. 运行 `npm run check`。

如果只在某个品牌或密度下变化，把同名 Token 放入对应的 `themes/*.json`，它会在构建时覆盖前面各层。

## 构建产物

```text
dist/
├── css/tokens.css                  CSS 自定义属性和主题选择器
├── json/{theme}.{mode}.json        嵌套值、扁平值及构建信息
├── typescript/tokens.generated.ts  const 对象和名称联合类型
└── manifest.json                   类型、说明和 CSS 变量映射
```

在 Web 中切换主题和模式：

```html
<html data-theme="default" data-mode="dark">
```

```css
.card {
  color: var(--color-text-primary);
  background: var(--card-background);
  border-radius: var(--card-radius);
}
```

## 扩展

在 `tokens.config.json` 中注册新的模式或主题即可参与所有构建。若要支持 iOS、Android、Figma 或特定框架，可以基于 `dist/json/*.json` 增加平台转换器；核心 Token 源文件无需改变。
