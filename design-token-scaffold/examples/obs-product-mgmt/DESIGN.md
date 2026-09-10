# obs-product-mgmt — Design (approved 2026-09-09)

演示用 `obs-theme-audit`（源项目 `D:/obs_theme` 抽取）主题做一个「产品管理 CRUD 后台」页面。
React + TypeScript + Tailwind，只做深色模式，自包含 Vite 应用，无后端、无路由、无组件库依赖。

## 设计来源

Token 取自 `examples/obs-theme-audit/canonical/{primitives,semantic.dark,components,layout}.json` 与 `obs-theme.css`：
深色语义 = ink(950 page / 900 default / 800 elevated / 750 hover / 850 selected) + 边框 ink(700/600/500)
+ 文本 ink(100/300/400) + 主操作 cyan(500/600) + 状态 green/amber/red/cyan/muted。
圆角 3/4/6px，间距 4px 基数，字重 400/500/600（≤600），字体 Inter。

## Token 落地方式

- `src/index.css` 先引入 `obs-theme.css`，再用 Tailwind `@theme inline` 将其变量映射为语义工具类。
  页面代码只能使用 `bg-surface-default`、`text-ink-primary`、`border-line-subtle` 等语义类，
  不得重新声明与沉淀层重复的颜色值。
- 组件只消费语义类名，不写裸 hex。页面为固定深色，`<html data-theme="dark">`。

## 布局

- 侧栏 220px：logo + 导航（高亮「产品管理」），背景 surface-default，右侧 1px border-subtle 分隔。
- 顶栏 48px：横跨整个应用，结构对齐原 `Topbar`（中央搜索、时间范围、刷新、主题、通知、用户区）；下方独立的面包屑条高 32px，内容为
  `Observability / Infrastructure / 产品管理`，使用原 `AppShell` 的 `px:2`（主题 spacing=4，即 8px）和弱边框。
- 侧栏从顶栏下方开始，宽 220px；内容区使用 page 背景和 12px 内边距，不套居中 max-width，
  本页面的列表表格不包裹卡片边框。

## 产品表（CRUD）

- 页头：标题「产品管理」+ 总数；操作区 = 「新建产品」contained(cyan) + 「导出」outlined。
- 工具条：名称/编码搜索输入(32px) + 状态筛选 + 类目筛选（自定义下拉）。
- 表格（默认 36px 行高，13px 正文 / 11px 大写表头，行 hover=surface.hover）：表头背景为
  `surface.default`，底边框为 `border.default`，文字为 `text.secondary`，字重 500，字距
  `0.04em`，内边距 `8px 12px`；单元格内边距 `7px 12px`，行分隔线为 `border.subtle`。
  产品名称+编码（名称旁色块 logo）、类目、负责人（首字母头像）、版本、状态 Chip、更新时间、操作（编辑/删除）。
- 状态 Chip（20px 高 / 3px 圆角 / 11px 500）语义：运行中=success 绿、维护=warning 琥珀、
  异常=error 红、停用=muted；Chip 为低透明度彩色底 + 语义前景。
- 底部：分页（上一页/页码/下一页），客户端完成。
- 新建/编辑：右侧抽屉（Drawer），字段=名称*、编码*、类目、负责人、版本、状态、描述；名称/编码必填校验。
- 删除：行内确认（Modal/Popconfirm）。

## 组件

按 components.json 配方内建轻量组件（Tailwind 原子类组合，不引第三方库）：
Button(小号 30px/13px 500/4px 圆角)、SearchInput、Select、Table、StatusChip、Drawer、ConfirmModal、Pagination。

## 字体与验收

- 壳层和页面使用原主题声明的 `"Inter", system-ui, -apple-system, sans-serif`；等宽内容使用
  `"JetBrains Mono", "Fira Code", "Cascadia Code", monospace`。
- `index.html` 保留原项目的 Google Fonts 声明；中文字符不在 Inter 字形覆盖范围内，会按浏览器字体回退，这是字体覆盖事实，不应误认为 Inter 字体加载失败。
- 验收时需在浏览器确认字体请求成功和实际渲染字体，不能只检查 CSS 中是否出现 `font-family`。

## 数据与验收

- `src/data/products.ts`：约 14 条本地 mock（含四类状态、多类目/负责人），只读经组件 props 注入。
- 验收：`npm run dev` 可跑；页面含搜索过滤、状态/类目筛选、分页、新建/编辑抽屉校验、删除确认全部可用；
  截图核对深色主题、间距、圆角、状态语义色符合规范；不出现 6px 以上圆角 / 700 以上字重 / 裸 hex 于业务组件。
