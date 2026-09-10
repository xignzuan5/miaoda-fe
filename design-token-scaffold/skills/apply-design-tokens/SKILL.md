---
name: apply-design-tokens
description: 在创建或修改页面、组件、主题和视觉样式时，读取项目现有 Design Token 与组件 Recipe，并将其落实到代码中。适用于 UI 实现、样式重构、主题适配和组件库映射；不用于从未知项目首次抽取 Token。
---

# 应用 Design Token

在写 UI 代码前确认项目的 Token 源文件、生成产物、组件 Recipe 和局部规则。优先复用既有语义，不根据当前颜色值猜测用途。
如果项目只有 `design-system/audit/` 证据，而正式 Token、模板登记或模板代码尚未生成，应在当前任务中先读取抽取 Skill、结合源码完成沉淀，再继续实现页面；不要要求用户额外执行第二条抽取命令。

## 执行要求

新增页面前先读取项目模板登记表及代码，查找 AppShell/Layout 与 children/Outlet。已有壳层时只开发内容区及必要的路由、菜单、权限、面包屑注册；禁止重复生成顶栏、侧栏、全局搜索和 Provider。优先复用列表、选项卡、表单等现有模板，模板缺失才从源码提炼。页面级布局规则按模板适用范围使用，不将列表满宽推广到设置表单。验证双重壳层/双重 padding、路由直达、菜单激活、面包屑和字体实际加载。详细契约位于安装目录 design-system/docs/page-template-contract.md；脚手架内为 docs/page-template-contract.md。

1. 阅读项目根目录的 `AGENTS.md` 或 `CLAUDE.md`，再定位 `design-system/src/tokens`、组件 Recipe 和构建命令。
   如果审计报告、示例页面或生成 CSS 与主题源码冲突，以源码中的主题对象、组件覆盖规则和真实页面结构为最高优先级；先补齐 Token/Recipe，再改使用方。
2. 页面只使用语义 Token；组件内部使用语义 Token和组件 Token；Primitive 只用于定义和少量稳定结构值。
3. 优先使用现有组件的 variant、size、state 和 part 映射。缺少所需决策时，先补 Token 和 Recipe，再修改组件。
4. 不新增硬编码视觉值。确有一次性算法值或数据值时，明确证明它不是设计决策，并保持在业务域内。
5. 同时检查亮色、暗色、密度、响应式、键盘焦点、禁用态、错误态和减少动效设置。
6. 修改后运行项目规定的 Token 校验与构建，并执行相关组件测试或视觉检查。至少检查表头/单元格、页面容器、标题层级、字体加载和组件状态是否与源码证据一致。
7. 所有设计说明和报告使用中文；代码标识符、Token 键名和标准技术术语可以保留英文。

## 组件库适配

第三方组件库通过 Adapter 消费 Semantic 和 Component Token。不要把 MUI、Ant Design 等库的专属字段反向写进核心 Token 名称。组件 Props 表达业务语义，Adapter 负责映射到不同平台。

## 停止条件

如果同一 Token 在当前上下文存在多个互斥语义、模式映射缺失，或变更会改变公共组件 API，不要自行猜测。保留现状、列出证据，并只请求决定该冲突所需的最小信息。
