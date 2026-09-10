# Token 数据契约

这份契约回答两个问题：一个视觉决策最少需要哪些字段才能被机器消费，以及还需要哪些信息才能长期治理。命名采用 DTCG 风格字段，项目治理信息统一放在 `$extensions.project`，避免污染通用格式。

## 1. Token 文件字段

| 字段 | 必填 | 作用 |
|---|---:|---|
| `$schema` | 推荐 | 编辑器校验入口 |
| `$description` | 可选 | 文件或 Token 集合的职责 |
| `$extensions` | 可选 | 文件级工具、版本或项目元数据 |
| `<token-name>` | 是 | 扁平的、全局唯一的 Token 名称 |

## 2. 单个 Token 的核心字段

| 字段 | 必填 | 作用 |
|---|---:|---|
| `$type` | 是 | 决定校验和平台转换方式 |
| `$value` | 是 | 原始值、复合值或完整别名 `{token.name}` |
| `$description` | 是 | 描述使用意图，不能只是复述名称或数值 |
| `$deprecated` | 否 | `true` 或弃用原因；正式弃用还应提供 replacement |
| `$extensions` | 否 | 项目治理与工具私有信息 |

支持的类型覆盖样式系统主要表达能力：

```text
boolean, color, dimension, number, string
fontFamily, fontWeight, duration, cubicBezier
shadow, strokeStyle, border, gradient
typography, transition
```

基础值通常使用标量。`shadow`、`border`、`gradient`、`typography` 和 `transition` 可以使用对象或数组表示复合值；是否拆分为细粒度 Token，取决于目标平台能否独立消费其组成部分。

## 3. 项目治理字段

治理字段位于 `$extensions.project`：

| 字段 | 建议 | 作用 |
|---|---:|---|
| `layer` | 推荐 | `primitive`、`semantic`、`component` |
| `status` | 推荐 | `draft`、`review`、`stable`、`deprecated` |
| `scope` | 推荐 | text、background、border、icon、layout 等适用范围 |
| `platforms` | 推荐 | web、ios、android、figma 等目标平台 |
| `tags` | 可选 | 检索和批量治理标签 |
| `owner` | 可选 | 负责团队或维护人，不建议绑定临时个人 |
| `source` | 提取时推荐 | 原设计文件、代码文件或决策记录 |
| `replacement` | 弃用时必填 | 替代 Token 名称 |
| `accessibility` |相关时推荐 | 对比度目标、适用字号、强制色模式说明等 |

示例：

```json
{
  "color.text.primary": {
    "$type": "color",
    "$value": "{color.neutral.900}",
    "$description": "页面主要标题和正文颜色",
    "$extensions": {
      "project": {
        "layer": "semantic",
        "status": "stable",
        "scope": ["text"],
        "platforms": ["web", "ios", "android"],
        "owner": "design-system",
        "source": "src/styles/theme.css",
        "accessibility": { "minimumContrast": "4.5:1" }
      }
    }
  }
}
```

## 4. 命名与分层约束

- Primitive 描述材料：`color.brand.600`、`spacing.4`。
- Semantic 描述用途：`color.text.primary`、`color.border.danger`。
- Component 描述局部决策：`button.primary.background.hover`。
- 主题只覆盖已有 Token，不引入只在单一主题存在、其他主题无法解释的公共语义。
- light、dark、high-contrast 的语义键集合必须一致。
- 组件优先引用 Semantic；仅尺寸等稳定结构值可直接引用 Primitive。
- 状态词统一使用 `default`、`hover`、`pressed`、`focus`、`selected`、`disabled`、`loading`、`readonly`、`error`。

## 5. “提取值”与“建立规范”的区别

代码扫描只能得到候选值和使用证据，不能自动证明某个值应该成为 Token。正式沉淀前至少需要判断：

1. 是否重复出现或表达稳定产品意图；
2. 同值是否承担不同语义，不能仅按数值合并；
3. 近似值是刻意差异还是历史漂移；
4. 主题和状态是否完整；
5. 命名是否在不知道具体数值时仍然成立；
6. 替换后是否破坏视觉、响应式或无障碍行为。

因此提取产物默认处于 `draft`，经设计与工程审核后才能升级为 `stable`。

## 6. 页面与组件不能遗漏的结构字段

仅扫描颜色和尺寸还不足以复现一个页面。抽取应用壳层或数据页时，至少要把以下事实沉淀为 Token 或 Recipe：

- 布局：顶栏高度、侧栏宽度、面包屑高度与内边距、内容区内边距、是否有最大宽度/水平居中。
- 排版：页面标题和副标题的语义级别、字号、字重、行高、字距、大小写规则、字体族和等宽字体。
- 表格：表头背景/文字/底边框、字号/字重/字距、表头内边距、单元格字号与内边距、行分隔线、行高、悬停/选中态。
- 容器：页面是否套卡片、边框宽度/颜色、圆角、阴影，以及透明容器这种“无样式”事实。
- 组件：每个部件的变体、尺寸、部件层级（root/header/content 等）和 default/hover/pressed/focus-visible/disabled/error/readonly 状态。

如果某个值只出现在说明文档而没有机器可消费的字段，模型实现页面时仍可能凭经验猜测；因此应优先补充字段和源码位置，再生成 CSS 或示例页面。
