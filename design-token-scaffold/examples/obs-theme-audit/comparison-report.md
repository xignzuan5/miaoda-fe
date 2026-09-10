# obs_theme 与示例页对照修复记录

## 结论

这次不一致由三部分共同造成：抽取产物原先遗漏了页面级和表格级事实；示例页又在缺口处自行加入了经验值；更严重的是，演示壳层曾经是一个近似重写，漏掉原 `Topbar`/`Sidebar` 的定位、控件和层级规则。修复后，示例页直接消费 `obs-theme.css` 中的页面配方，并按 `AppShell` 的结构适配壳层，页面实现不再决定这些值。

## 真实源码证据

证据来源：`D:/obs_theme/src/theme/index.ts`、`D:/obs_theme/src/layout/AppShell.tsx`、`D:/obs_theme/src/pages/users/index.tsx`。

| 规则 | 真实值 | 当前 Token/Recipe |
|---|---|---|
| 表头背景 | `#161b27`，默认表面色 | `table.head.background` |
| 表头底边框 | `1px solid #2a3147` | `table.head.border` |
| 表头文字 | `#8b93a8`，11px/500，大写，`0.04em` | `table.head.text`、`table.head.font.*` |
| 表头内边距 | `8px 12px` | `table.head.padding.*` |
| 单元格 | 13px，`7px 12px`，底边框 `#1f2535` | `table.cell.*` |
| 页面内容区 | `p:3`，即 12px；不设置 max-width | `layout.content.padding` |
| 页面标题 | h2，20px/600/1.3 | `layout.page.title.*` |
| 页面副标题 | caption2，11px/400/1.4，次要文字色 | `layout.page.subtitle.*` |
| 应用壳层 | 顶栏 48px，侧栏 220px，面包屑 32px；面包屑 `px:2` 在 spacing=4 下为 8px | `layout.*` |
| 字体 | `"Inter", system-ui, -apple-system, sans-serif`；等宽 `"JetBrains Mono", "Fira Code", "Cascadia Code", monospace` | `font.family.*`、`font-inventory.json` |
| 列表结构 | TableContainer 透明、无阴影，不套卡片 | 页面 Recipe 与 `App.tsx` 结构 |

## 示例页修复

- 移除 `p-5`、`max-w-[1180px]`、居中布局和整表卡片边框，改为 12px 内容区和透明列表表格。
- 增加横跨应用的 48px 顶栏及其下方 32px 面包屑行。
- 标题从 15px 改为页面 `h2` Token；副标题改为 `caption2` Token。
- 表头从半透明提升表面改为默认表面色，补上默认底边框、字距和 `8px 12px` 内边距。
- 单元格从 `16px` 横向内边距改为 `12px`，上下改为 `7px`，行分隔线使用弱边框 Token。
- 输入框、遮罩、模态阴影和状态 Chip 的透明度也改为对应的语义/组件 Token；Chip 使用 `chip.status.*.background`，不复用通用状态背景。
- `index.html` 加载 Inter 与 JetBrains Mono；无网络时仍保留沉淀层中的系统回退字体。
- 原 `AppShell` 的面包屑是 `px:2`（8px），此前适配层误写为 16px，已修正。
- 中文内容不由 Inter 提供字形，会按系统字体回退；这与英文原页面的字形外观不同，不能仅凭中文截图判断 UI 字体 Token 错误。

## 后续规则

审计报告只负责候选值，`canonical/` 和组件 Recipe 才是可消费的规范。任何示例页与真实主题冲突时，先回到权威源码补 Token 和来源证据，再修改页面；禁止在业务代码中用经验值覆盖规范。

## 本次运行时复核（2026-09-09）

在 1280×720 浏览器视口打开适配示例后，实际计算样式为：顶栏 48px、侧栏 220px、面包屑 32px，内容区左偏移 220px、上偏移 80px；页面标题为 20px/600/1.3，表头为 11px/500/1.5、字距 0.04em、8px 12px，单元格为 13px/400/1.5、7px 12px。浏览器字体状态为 `loaded`，Inter 与 JetBrains Mono 的声明字体检查通过。

复核还发现并修正了一个适配层错误：此前表头的颜色和排版只设置在 `<tr>`，原生 `<th>` 仍会保留浏览器默认 700 字重；现在规则落在实际的 `<th>`/`<td>` 上，并补齐标题字距和表格行高。适配层使用原生 HTML/Tailwind，不能等同于原项目 MUI 组件的完整 DOM 与交互行为；若要求像素级一致，应在原项目中复用 `AppShell`、`Topbar`、`Sidebar` 和 MUI `ThemeProvider`，只新增内容路由。

截图中若出现与 `D:/obs_theme` 不同的品牌、菜单或搜索位置，应先确认是否使用了另一套壳层版本。当前源项目证据是 `obsAdmin` 品牌、顶栏中央搜索及 220px 侧栏；这些结构差异不是字体 Token 可以修复的。
