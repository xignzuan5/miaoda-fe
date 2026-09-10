# 飞书妙搭 Agent 接入规范

本文件用于把当前项目的 Design Token、组件配方和页面模板交给飞书妙搭的代码 Agent 使用。妙搭中的 Agent 不应依赖本地 Codex/Claude 会话状态；所有必须遵守的内容都要落在项目代码和本文件中。面向项目维护者的同步和操作步骤见脚手架仓库的 `miaoda/README.md`；该 README 是可选手册，不属于具体项目运行时的必需输入，安装器默认不会复制它。

## 接入前准备

在项目根目录执行：

```bash
npm run project:init
```

`project:init` 会同时刷新 `design-system/audit/` 并构建 `design-system/dist/`；如果项目此前没有安装脚本，先完成一次脚手架初始化即可。

注意：`audit/` 是从真实项目扫描出的证据；如果 `src/tokens/` 仍是脚手架初始值，`dist/` 只是可运行基线，不代表已经完成真实主题的语义确认。首次接入妙搭时，必须让 Agent 先根据 `audit/` 和源码替换/补齐正式 Token，再开始批量生成页面。

初始化后至少保留以下目录：

```text
design-system/
├── audit/                    抽取证据：值、来源、布局、字体、结构
├── src/tokens/               正式 Token 源文件
├── dist/css/tokens.css       可直接引入的 CSS 变量
├── dist/json/                按主题和模式输出的 JSON
├── docs/page-template-contract.md
└── docs/miaoda-agent.md      本文件
```

## 导入妙搭

推荐使用妙搭的“导入新建应用”导入项目 ZIP。ZIP 中应同时包含业务代码、`design-system/` 和本项目已有的壳层/组件代码；不要只上传一张截图或只粘贴几个颜色值。

如果是在已有妙搭应用中接入，则把 `design-system/` 和本文件放入应用代码目录，再通过 Agent 对话要求它先读取本文件和审计证据。

`.claude/commands/`、`.agents/skills/` 是其他编码 Agent 的入口，不是妙搭规范的唯一载体；妙搭任务必须以本文件、代码中的 CSS 变量和模板实现为准。

## 妙搭 Agent 首轮提示词

将下面的提示词发送给妙搭 Agent（其中路径按导入后的项目结构调整）：

```text
请先读取 design-system/docs/miaoda-agent.md、design-system/docs/page-template-contract.md、design-system/audit/ 和 design-system/src/tokens/，再分析现有 Layout/AppShell、路由、菜单、字体资源和代表页面。

把 design-system/dist/css/tokens.css 接入应用入口，并确认主题模式切换实际生效。页面只能使用语义 Token 和组件 Token；缺少决策时先补 Token/Recipe，不要凭经验新增颜色、字号、间距、边框、圆角、阴影、行高或字体值。

已有公共壳层时只修改内容插槽、路由、菜单、权限和面包屑，不复制顶栏、侧栏、全局搜索、Provider 或壳层 padding。列表、选项卡、设置表单、详情、仪表盘、两列和三列内容网格只复用审计中真实存在且已登记的模板；不要把完整业务页面复制成模板。

完成后运行项目的类型检查和构建，并检查主题、字体实际加载、响应式、表头/单元格、页面容器、标题层级、焦点和禁用态。请用中文说明读取了哪些来源、复用了哪个模板、哪些内容仍未验证。
```

## 后续页面开发提示词

```text
基于 design-system 中已登记的公共壳层和页面模板，新增一个产品列表页。保持壳层、导航、字体和页面容器不变，只替换内容区；先读取最接近的列表模板及其 Token/Recipe，再实现筛选、表格、状态和分页。不要复制整个现有页面，也不要引入未登记的硬编码视觉值。
```

如果妙搭当前版本的 `/` 菜单支持项目级快捷指令，可以把上述“后续页面开发提示词”登记为 `build-page`；如果不支持，直接使用自然语言即可，规范来源不变。

## 使用妙搭的 `/` 和 `@` 扩展

当前妙搭项目中：

- `/` 菜单用于选择专家助手或技能。进入“管理 → 技能 → 添加技能 → 告诉妙搭创建技能”，使用 `design-system/miaoda/install-skill-prompt.md` 中的固定安装指令，把已经写好的 `slash-page-development.md` 原样注册为“页面开发”；妙搭 Agent 只负责安装，不负责重新生成技能内容。
- `@` 菜单用于选择插件或组件。脚手架提供 `design-system/miaoda/extensions/at-design-variable-parser.md` 作为“设计变量解析”插件定义；如果当前租户的 `@` 菜单没有自定义插件入口，使用 `@文件解析` 附加该文件和审计资料即可执行，不会丢失规则。

建议给 `/` 技能使用下面的配置：

```text
技能名称：页面开发
技能描述：读取当前项目的 Design Token、组件 Recipe 和页面模板，复用公共壳层实现新页面；适用于列表、详情、表单、仪表盘、两列和三列内容网格。
用户提问示例：
- 按现有设计系统生成一个产品列表页
- 复用公共壳层新增一个两列详情页
- 在不改变导航和字体的情况下新增三列卡片网格
```

技能提示词直接使用 `design-system/miaoda/extensions/slash-page-development.md` 的固定内容，不要让妙搭 Agent 自行总结或重写。安装时补充：

```text
每次执行前必须读取本技能来源文件 design-system/miaoda/extensions/slash-page-development.md，以及 design-system/docs/miaoda-agent.md、design-system/audit/、design-system/src/tokens/ 和页面模板代码。来源文件是唯一规则源，不得自行改写；若 audit 有证据但正式 Token 或模板缺失，按来源文件的固定规则处理并标注来源。完成后说明复用了哪些 Token、Recipe、模板和插件。
```

### 首次接入的固定顺序

首次把这套设计系统接入一个妙搭应用时，顺序是“先装项目规则，再原样注册页面技能，再确定性抽取，最后开发页面”：

```text
0. 修改/确认项目根目录的 AGENTS.md 或 CLAUDE.md（步骤 1）
        ↓
1. 原样注册 design-system/miaoda/extensions/slash-page-development.md
   为 /页面开发（只注册固定文件，不让 Agent 重新生成）
        ↓
2. 调用 @设计变量解析（首次初始化或审计过期时）
   先执行 npm run project:init，再按真实源码生成/刷新步骤 2–5 的资料
        ↓
3. 重新读取步骤 2–5，执行 /页面开发
```

这里的“步骤 2–5”对应 `/页面开发` 每次执行前的读取清单：

- 步骤 2：`design-system/docs/miaoda-agent.md`、`page-template-contract.md` 等项目规范；
- 步骤 3：`design-system/audit/` 中的审计、布局/字体/结构清单和 `page-templates.json`；
- 步骤 4：`design-system/src/tokens/`、`src/recipes/` 和 `dist/css/tokens.css`；
- 步骤 5：现有 AppShell/Layout、Provider、路由、菜单、权限、面包屑和代表页面/模板代码。

`@设计变量解析` 会生成或刷新步骤 2–4 的文件，并把步骤 5 中真实存在的壳层、插槽和页面模式登记到模板清单；步骤 5 不是把整个业务页面复制成一个新文件。所有结果必须带来源和状态（如 `confirmed`、`candidate`、`unresolved`、`not-found`、`not-verified`），缺失内容不能凭经验补齐。

如果当前妙搭租户没有自定义 `@` 插件入口，使用 `@文件解析` 附加 `at-design-variable-parser.md` 只能执行第二阶段语义整理；确定性扫描仍必须在可执行项目命令的本地/CI/妙搭终端完成。没有 `npm run project:init` 的真实返回码和产物更新时间，就必须报告“确定性扫描未执行”。

### 日常新增页面

首次初始化完成且步骤 1–5 已存在并通过验证后，日常新增页面只需要调用 `/页面开发` 并提供页面需求；不需要每次重复调用 `@设计变量解析`。只有源码主题、组件覆盖、字体、公共壳层/模板发生变化，或审计已过期时，才重新执行 `@设计变量解析`，然后再调用 `/页面开发`。

`@文件解析` 仅用于项目代码之外的 PDF、Word、Figma 导出、截图或外部规范；已经随项目导入的 Token、审计和模板必须直接从项目代码读取。`/` 负责固定规则和任务路由，`@` 负责确定性抽取/外部资料能力，两者不是同一个层级；两者的定义都在项目文件中，妙搭不应自行生成替代版本。

## 确定性扫描与妙搭代码同步

`npm run project:init` 是 Node.js 项目命令，必须在能访问完整源码的环境执行。妙搭当前是否向租户开放终端/项目命令执行能力需要在应用内实测，因此首次导入或妙搭代码发生变化后，按下面的同步流程刷新：

```text
本地项目、Git 仓库或妙搭导出代码
        ↓
npm run project:init
        ↓
提交 design-system/audit 和 design-system/dist
        ↓
把更新后的代码同步/导入妙搭
        ↓
/页面开发 直接读取项目内文件
```

如果当前妙搭开发环境实际提供终端/项目命令执行能力，也可以让 Agent 在项目根目录运行 `npm run project:init`；必须以真实进程返回码、扫描统计和产物文件更新为成功证据。没有命令执行日志就视为未扫描。`@文件解析` 只负责把项目外部资料转成 Agent 可读上下文，不能刷新源码审计，也不是本地命令的替代品。

脚手架会把扩展定义和机器可读清单一起放入项目：

```text
design-system/miaoda/
├── manifest.json
└── extensions/
    ├── at-design-variable-parser.md
    └── slash-page-development.md
```

`manifest.json` 只是项目内的携带清单，不会绕过妙搭的权限自动注册插件。当前妙搭租户若没有“新建自定义 @ 插件”入口，必须按清单把 `/页面开发` 创建为技能，并用 `@文件解析` 加载 `@设计变量解析` 定义；这样执行逻辑仍然完整。

## 维护规则

- 源码主题、组件覆盖和真实运行页面与审计产物冲突时，以源码和运行时为准，并回填 Token/Recipe。
- `audit/` 是证据，不等于已批准的语义 Token；未确认的值要标注来源和状态。
- 模板必须是可编译代码，使用插槽和 Props 表达业务变化；不要把某个页面的业务字段写死进通用模板。
- 每次 Token 或模板变更后重新运行构建，并在妙搭预览中检查代表页面和视口。
