# 妙搭接入操作手册

这份手册给项目维护者使用，说明如何把本项目的 Design Token 和页面开发规则接入飞书妙搭。它不替代 Agent 执行契约：Agent 执行时必须以 [`../docs/miaoda-agent.md`](../docs/miaoda-agent.md) 和两个固定扩展定义为准。

## 先分清通用脚手架和具体项目

- `miaoda-fe/scaffold` 只保存通用脚手架、固定扩展、安装器和示例 Token 基线，不包含任何业务项目的真实页面或审计结果。
- 每个要接入妙搭的项目，都必须使用自己的源码完成一次确定性扫描，生成自己的 `design-system/audit/`、Token、Recipe 和页面模板登记；已有本地项目运行 `npm run project:init`，尚无本地副本则由 `npm run miaoda:init` 自动完成同一轮安装与扫描。
- 不要把任何具体项目（例如 `D:\your-project`）的源码、字体、页面、Token 或审计产物提交回通用脚手架分支。

## 需要同步到妙搭的文件

把“具体项目源码”和该项目的运行时 `design-system/` 一起同步。下面标为“可选”的文件只服务于维护者，不影响 Agent 运行；安装器默认不会把它们复制到具体项目。

```text
项目根目录/
├── AGENTS.md 或 CLAUDE.md
├── package.json                         含 project:init 脚本
├── src/                                 AppShell、Layout、路由、组件、页面
├── public/                              图片、字体等资源
└── design-system/
    ├── audit/                           真实项目扫描证据和模板登记
    ├── docs/
    │   ├── miaoda-agent.md              Agent 权威执行契约
    │   └── page-template-contract.md    页面模板契约
    ├── src/tokens/                      正式 Token 源文件
    ├── src/recipes/                     组件配方
    ├── dist/css/tokens.css              构建后的 CSS 变量
    ├── scripts/                         project:init 和构建脚本
    └── miaoda/
        ├── README.md                    可选：维护者操作手册
        ├── manifest.json
        ├── install-skill-prompt.md
        └── extensions/
            ├── slash-page-development.md
            └── at-design-variable-parser.md
```

如果还没有安装脚手架，先在脚手架目录执行一次（该命令已经包含首次扫描和构建）：

```cmd
cd /d <脚手架目录>\design-token-scaffold
npm run project:init -- --target D:\your-project
```

这条带 `--target` 的命令完成后，不要立刻在项目根目录重复执行。以后项目源码或主题发生变化时，才在项目根目录执行无参数的 `npm run project:init` 刷新审计。

如果妙搭应用可以直接从 Git 仓库同步，也可以先导入项目分支，再确认以上文件已经出现在应用代码目录中。只导入通用 `design-token-scaffold/` 而没有具体项目源码时，解析器无法得到该项目的真实壳层、字体、路由和页面模板。

## 从妙搭 Git 自动初始化

如果本地还没有项目副本，可以在脚手架根目录执行：

```cmd
npm run miaoda:init
```

命令会在同一轮中先检查 Node.js 版本、Git 和 `lark-cli`，再引导浏览器授权、核对应用访问权限、获取妙搭 Git 地址、clone `sprint/default`，安装脚手架并运行首次 `project:init`。Windows 检测到 `winget` 或 Chocolatey 时会询问是否协助安装 Git；`lark-cli` 缺失时最多重试 3 次网络安装，失败后自动检查 `vendor/lark-cli/` 或 `LARK_CLI_OFFLINE_DIR` 指定的完整离线包。它不会把通用脚手架误当成业务项目，也不会自动提交或推送。

由于 `npm run` 需要 Node.js/npm 才能启动，Node.js 完全不存在时无法由 `miaoda:init` 自行安装。Windows 用户可以先在脚手架根目录执行 `miaoda-init.cmd`，它会在启动 npm 前检查并询问是否用 winget 安装 Node.js LTS 和 Git；命令本身会检查版本过低并给出升级指引。首次授权、企业网络白名单、管理员应用权限和软件安装权限仍由相应管理员处理。

首次运行需要用户完成飞书授权；企业网络白名单、管理员应用权限和 Windows 软件安装权限仍由相应管理员处理。脚手架只能检查并反馈失败步骤，不能绕过这些限制。

### 公司网络下的 CLI 区分

妙搭同步使用通用 `lark-cli`，对应 npm 包是 `@larksuite/cli`：

```cmd
npx -y @larksuite/cli@latest install
lark-cli --help
```

如果需要让 AI Agent 直接选择妙搭命令，再安装官方 `lark-apps` Skill：

```cmd
npx -y skills add https://open.feishu.cn --skill lark-apps -g -y
```

飞书项目官方命令 `npx -y @lark-project/meegle@latest install` 安装的是 `meegle`，用于 Meegle 工作项和计划，不能替代妙搭同步所需的 `lark-cli`。如果 `@larksuite/cli` 也无法安装，请让 IT 检查 npm 仓库、CLI 原生下载地址、飞书授权地址和 `miaoda-git.feishu.cn` 的白名单；离线场景需准备完整且匹配操作系统/CPU 的 `lark-cli` 运行目录，并设置 `LARK_CLI_OFFLINE_DIR`。

如果目标目录已经存在，命令会校验它是否连接到同一个妙搭远端、是否处于目标开发分支以及工作区是否干净；不满足条件时停止，不覆盖目录。第二个妙搭应用再次执行同一个命令并选择新的应用和目标目录即可，不需要另外手工执行 `npm run project:init`。

初始化完成后的项目根目录会登记：

```cmd
npm run miaoda:pull
npm run miaoda:push -- --paths design-system client/src/pages/你的页面
```

命令只同步已提交的开发分支代码。`.agent/`、`.env`、密钥、Token 和妙搭数据库/平台素材不在普通 Git 同步范围内。

## 首次接入的固定顺序

必须按以下顺序操作，不能跳过步骤 1，也不能先开发页面：

```text
0. 首次安装时由带 `--target` 的安装命令完成扫描；之后仅在源码或主题变化时，在项目根目录运行无参数的 `npm run project:init`
        ↓
1. 确认妙搭应用项目根目录的 AGENTS.md 或 CLAUDE.md
        ↓
2. 原样注册 slash-page-development.md 为 /页面开发
        ↓
3. 调用 @设计变量解析，生成/刷新步骤 2–5 的资料
        ↓
4. 调用 /页面开发，实现新页面
```

### 1. 确认项目规则

在妙搭 Agent 中发送：

```text
请先只处理项目接入准备，不要开发页面。

检查当前项目根目录是否存在 AGENTS.md 或 CLAUDE.md。
如果不存在，按 design-system/docs/miaoda-agent.md 的固定规则创建。
如果存在，只更新 design-token-system 标记区，不修改其他用户内容。
写入后回读确认规则已生效。
```

### 2. 原样注册 `/页面开发`

进入妙搭的“管理 → 技能 → 添加技能 → 告诉妙搭创建技能”，复制 [`install-skill-prompt.md`](install-skill-prompt.md) 中“安装 `/页面开发`”的整段指令。

唯一来源文件必须是：

```text
design-system/miaoda/extensions/slash-page-development.md
```

注册结果必须满足：

- 名称为“页面开发”；
- 命令为 `/页面开发`；
- 内容原样采用来源文件；
- Agent 不得自行生成、改写、翻译、摘要或重排规则；
- 创建后回显名称、命令和来源路径。

### 3. 调用 `@设计变量解析`

如果租户支持自定义 `@` 插件，按 [`install-skill-prompt.md`](install-skill-prompt.md) 注册 `@设计变量解析`。

如果没有自定义 `@` 插件入口，使用妙搭自带的 `@文件解析`，附加：

```text
design-system/miaoda/extensions/at-design-variable-parser.md
```

然后发送：

```text
请按附件中的 @设计变量解析 固定规则执行首次项目抽取。

先确认项目根目录的 AGENTS.md 或 CLAUDE.md 已存在。
如果当前环境可以执行项目命令，先在项目根目录运行 npm run project:init，回显真实返回码、扫描统计和产物更新时间。
如果当前环境不能执行项目命令，明确报告“确定性扫描未执行”，不得把文字推断当成扫描结果。

然后读取当前项目源码、运行时样式、字体资源、组件、路由、菜单、权限、面包屑和代表页面。
生成或刷新 design-system/docs、audit、src/tokens、src/recipes、dist/css/tokens.css 和 audit/page-templates.json。
步骤 5 只登记真实存在的壳层、插槽和页面模式，不复制完整业务页面。
所有 Token、Recipe 和模板都记录来源与状态，缺失项不得凭经验批准。

完成后用中文汇报读取来源、更新文件、扫描证据和未验证项；完成前不要开发新页面。
```

`@设计变量解析` 会生成或刷新 `/页面开发` 所需的步骤 2–4，并把步骤 5 的真实复用点登记到模板清单。步骤 5 不是一份需要复制的完整页面代码。

如果妙搭没有终端能力，必须先在本地或 CI 执行 `npm run project:init`，再把最新 `design-system/` 同步回妙搭；`@文件解析` 不能替代确定性扫描。

### 4. 调用 `/页面开发`

确认步骤 1–5 已存在且状态可用后，发送：

```text
/页面开发

生成一个产品列表页：复用当前项目已经登记的公共壳层和列表模板，只实现内容区，并增加必要的路由、菜单、权限和面包屑配置。保持现有字体、页面容器、导航和主题结构不变。
```

技能会依次读取项目规则、设计规范、审计、Token/Recipe 和真实壳层/模板代码。若步骤 2–5 缺失或过期，技能必须暂停页面实现，先要求完成初始化抽取。

## 日常使用和刷新时机

首次接入完成后，日常新增页面只需调用 `/页面开发`。以下情况才重新调用 `@设计变量解析`：

- 主题颜色、排版或字体资源变化；
- 组件覆盖或公共 AppShell/Layout 变化；
- 新增了列表、选项卡、详情、仪表盘、两列或三列页面模式；
- 路由、菜单、权限或面包屑装配方式变化；
- 审计文件已经过期，或实现与源码/运行时不一致。

项目内已有的 Token、审计和模板直接从代码读取，不需要反复使用 `@文件解析` 附加。`@文件解析` 只用于项目外部的 PDF、Word、Figma 导出、截图或外部规范。

## 完成检查

每次首次抽取或刷新后，确认以下产物已经更新并可追溯：

- `design-system/audit/` 中有真实扫描统计、来源位置和未决项；
- `design-system/audit/page-templates.json` 登记了实际壳层、插槽和页面结构；
- `design-system/src/tokens/`、`src/recipes/` 和 `dist/css/tokens.css` 相互一致；
- 亮色/暗色/高对比度、字体实际加载、响应式、焦点、禁用、错误和加载态已经检查；
- `npm run check` 或项目规定的校验、测试和构建命令通过；
- Agent 用中文说明了来源、复用的模板、更新的 Token 以及仍未验证的内容。
