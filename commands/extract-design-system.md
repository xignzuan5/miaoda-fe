---
description: 刷新当前项目的 Design Token、布局证据和页面模板规范
argument-hint: [补充要求]
---

请刷新当前项目的 Design Token 设计系统：

$ARGUMENTS

先运行项目根目录的 `npm run project:init` 刷新 `design-system/audit/`，再读取源码上下文，沉淀正式 Token、组件 Recipe、中文设计规范、页面模板登记和可编译模板代码。不要复制完整业务页面；明确记录来源、插槽、适用范围和未验证缺口，完成后运行 `npm --prefix design-system run check`。
