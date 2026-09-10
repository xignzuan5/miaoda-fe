---
description: 按当前项目的设计系统构建页面，复用公共壳层和页面模板
argument-hint: [页面需求]
---

请在当前项目中按已沉淀的设计系统构建下面的页面：

$ARGUMENTS

执行规则：

1. 先读取项目根目录的 AGENTS.md 或 CLAUDE.md。
2. 读取 design-system/audit、正式 Token、组件 Recipe 和页面模板登记。
3. 如果正式 Token 或页面模板尚未沉淀，先结合源码完成沉淀，再实现页面，不要求用户另跑抽取命令。
4. 已有 AppShell/Layout 时只新增内容区、路由、菜单、权限和面包屑配置，不复制顶栏、侧栏或 Provider。
5. 页面只消费语义 Token 和组件 Token，不新增未经登记的硬编码视觉值。
6. 运行项目规定的类型检查、构建和相关视觉检查，并用中文说明改动和验证结果。
