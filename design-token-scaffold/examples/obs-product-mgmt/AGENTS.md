# 页面续写规则

阅读 ../obs-theme-audit/page-templates.json 和 ../../docs/page-template-contract.md。
本演示已挂载 src/templates/AdminShell.tsx，新增内容页复用 src/templates/ContentTemplates.tsx，禁止复制壳层。可复用的内容框架包括 ListPageTemplate、TabbedPageTemplate、SettingsPageTemplate、TwoColumnPageTemplate 和 ThreeColumnGridTemplate；后两者分别对应来源项目已观察到的详情两列与 md=4 重复卡片网格。
导航项通过 navigation、activeId、onNavigate 配置，面包屑末级通过 pageLabel 传入；当前演示没有路由库，不能把点击状态冒充已实现路由。
原 D:/obs_theme 项目有 src/layout/AppShell.tsx 和 src/App.tsx 的嵌套路由，原项目新增页直接接入现有 children，不使用演示壳层替换它。
演示模板为适配版，壳层结构已按原 AppShell/Topbar/Sidebar 的固定定位、尺寸和控件组成对齐；仍需在目标浏览器确认字体请求和最终像素效果。描述、报告和新增代码注释使用中文。

原生表格适配时，表头与单元格 Token 必须落到实际的 `th`/`td`（不能只给 `tr` 设置颜色或字重），并显式设置来源组件的 line-height；否则浏览器默认表头 700 字重会覆盖沉淀规范。
