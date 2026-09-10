# obsAdmin 设计规范 — 抽取草案

## 抽取摘要

- 源项目：`D:/obs_theme`
- 技术栈：React 19、MUI 9、Emotion、Vite、ECharts
- 扫描源码文件：96
- 唯一原始样式值：102
- 重复原始候选值：68
- 现有权威来源：`src/theme/index.ts`、`src/theme/tokens.ts`、`THEME_GUIDE.md`
- 已排除生成文件或非产品 UI：`.extract-out`、`dist`、`docs`、`design_docs`、`node_modules`

项目已经有明确的主题系统，并非只有互不相关的硬编码值。主题文件中的精确名称被视为高置信证据；从 MUI 覆盖规则推断出的组件 Token，在正式纳入公共契约前仍标记为 `review`。

## 基础设计

### 颜色

默认暗色主题采用蓝黑中性色阶。青色同时承担交互强调色和信息状态色；绿色、琥珀色和红色保留给运行状态；紫色、橙色和粉色扩展图表色板。

| 角色 | 暗色 | 亮色 |
|---|---|---|
| 页面背景 | `#0f1117` | `#f4f5f7` |
| 默认表面 | `#161b27` | `#ffffff` |
| 提升表面 | `#1c2333` | `#f9fafb` |
| 悬停表面 | `#1e2438` | `#f3f4f6` |
| 选中表面 | `#1a2540` | `#eff6ff` |
| 主文字 | `#e8eaf0` | `#111827` |
| 次要文字 | `#8b93a8` | `#6b7280` |
| 禁用文字 | `#4d566b` | `#9ca3af` |
| 主操作色 | `#06b6d4` | `#0891b2` |
| 主操作悬停色 | `#0891b2` | `#0e7490` |

状态色是语义色而非装饰色：成功为 `#10b981`，警告为 `#f59e0b`，错误为 `#ef4444`，信息色随各模式的青色强调色变化。

### 排版

- UI 字体：Inter，并提供系统字体回退。
- 等宽字体：JetBrains Mono、Fira Code、Cascadia Code、monospace。
- 标题字号：24、20、16、14、13、12px，统一使用 600 字重。
- 正文字号：14px 和 13px，使用 400 字重。
- Caption：11px/500，大写，字距 `0.04em`。
- 指标字号：28px 或 20px，使用 600 字重。
- 项目规则：字重不超过 600，界面文字不低于 11px。

### 间距、圆角与层级

- MUI 间距基数为 4px；文档化刻度为 4、8、12、16、20、24、32、40px。
- 圆角刻度为 3、4、6px。除明确的圆形元素外，项目规则禁止使用超过 6px 的圆角。
- 卡片和面板保持扁平，以边框代替层级；MUI 主题阴影均为 `none`。
- 全局搜索是已观察到的例外，使用 `0 20px 60px rgba(0,0,0,0.5)`。

## 密度与布局

| 密度 | 表格行高 | 卡片内边距 | 输入框高度 |
|---|---:|---:|---:|
| 紧凑 | 28px | 12px | 28px |
| 默认 | 36px | 16px | 32px |
| 宽松 | 44px | 24px | 40px |

应用壳层定义了 48px 顶栏、展开时 220px/收起时 56px 的侧栏，以及 32px 面包屑行。

### Users 页面已核对事实

以下规则来自 `src/pages/users/index.tsx`，属于页面级事实，不应只停留在说明文字中：

| 部位 | 已确认规则 |
|---|---|
| 页面容器 | `p:3`，即 12px；不设置最大宽度，也不水平居中 |
| 页面标题 | `h2`，20px/600/1.3 |
| 页面副标题 | `caption2`，11px/400/1.4，使用次要文字色 |
| 表头 | 默认表面色、底边框 1px 默认边框色、11px/500、大写、`0.04em`、`8px 12px` |
| 单元格 | 13px、`7px 12px`、1px 弱边框、默认行高 36px |
| 表格容器 | 透明、无阴影；列表表格不额外包裹卡片边框 |

## 组件契约

机器可读的推断配方位于 `component-recipes.json`。

- Button：默认使用 MUI `small`，最小高度 30px，标签 13px/500，圆角 4px；已定义 contained、outlined、text 三种变体。
- Input：默认总高度 32px，文字 13px，圆角 4px，具备默认/悬停/聚焦语义边框和 2px 聚焦光环。
- Card：默认表面扁平，使用 1px 弱边框、4px 圆角和 16px 内容内边距。
- Table：表头 11px 大写，单元格正文 13px，行高随密度变化，悬停和选中使用语义表面色。
- Chip：高度 20px、圆角 3px、标签 11px/500，并按状态使用对应前景色和背景色。
- Tabs：高度 36px，使用 2px 主色指示条。
- Menu 和 Tooltip：提升表面、默认边框、无阴影。

## 组件消费方式

MUI 组件应通过适配层消费语义 Token，不应内嵌十六进制值：

```ts
const muiTokens = {
  palette: {
    background: {
      default: 'var(--color-background-page)',
      paper: 'var(--color-surface-default)'
    },
    primary: { main: 'var(--color-action-primary-default)' },
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)'
    },
    divider: 'var(--color-border-subtle)'
  }
}
```

组件配方再把 MUI 部件和状态映射到组件 Token。业务页面应使用 MUI 变体和语义调色板路径，不应直接使用原始值。

## 高置信迁移规则

- 将重复出现的中性表面值替换为支持模式切换的表面 Token。
- 按数据含义替换状态色，而不是只按十六进制值替换。
- 使用 `canonical/components.json` 中的组件 Token 替换 MUI 组件覆盖规则。
- `#06b6d4`、`#0891b2`、`#4d566b`、`#9ca3af` 和 `4px` 都具有上下文差异；应查阅 `migration-map.json`，禁止全局查找替换。

## 剩余例外与缺口

- `NotFoundPage.tsx` 使用 700 字重，与文档规定的最大 600 冲突。
- 圆形元素使用 `50%`，这是 6px 圆角上限的合法例外；若重复成为组件规则，应沉淀为 `radius.full`。
- Button 的 focus-visible 和 disabled 行为目前主要依赖 MUI 默认值。
- Input 的 error、success、readonly 状态尚未形成完整组件配方。
- Status Chip 的背景透明度来自 `MuiChip` 组件覆盖，已单独沉淀为 `chip.status.*.background`（0.12）；通用 `color.status.*.background`（0.10）不能替代它，页面不得退回原始 RGBA/八位十六进制值。
- 当前没有明确的高对比度模式。
- 权威主题文件中没有发现清晰的响应式断点契约。
- 静态提取尚未执行视觉检查和 WCAG 对比度检查。
