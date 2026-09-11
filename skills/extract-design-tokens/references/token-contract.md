# 提取结果契约

使用全局唯一的扁平 Token 名称和 DTCG 风格核心字段：

```json
{
  "color.text.primary": {
    "$type": "color",
    "$value": "{color.neutral.900}",
    "$description": "页面主要标题和正文颜色",
    "$extensions": {
      "project": {
        "layer": "semantic",
        "status": "draft",
        "scope": ["text"],
        "platforms": ["web"],
        "source": "src/styles/theme.css:12"
      }
    }
  }
}
```

## 字段

- 必填：`$type`、`$value`、`$description`。
- 治理：`$extensions.project.layer`、`status`、`scope`、`platforms`、`source`。
- 可选：`tags`、`owner`、`accessibility`。
- 弃用：`$deprecated` 和 `$extensions.project.replacement`。
- 机械提取的候选项默认使用 `status: draft`。

支持类型：`boolean`、`color`、`dimension`、`number`、`string`、`fontFamily`、`fontWeight`、`duration`、`cubicBezier`、`shadow`、`strokeStyle`、`border`、`gradient`、`typography`、`transition`。

## 分层

- Primitive 描述视觉材料而不是用途，例如 `color.blue.600`、`spacing.4`。
- Semantic 描述可跨主题保持稳定的用途，例如 `color.text.primary`、`color.border.focus`。
- Component 描述稳定的组件局部决策，例如 `button.primary.background.hover`。
- 主题和模式文件只覆盖映射，不另造一层随意命名。

## 证据规则

- 保留源码位置和出现次数。
- 不合并数值相同但语义不同的值。
- 将近似值标记为待审核聚类，不自动归一化。
- 不根据颜色接近程度推断交互状态。
- 各模式的公共语义键必须一致。
- 组件优先引用 Semantic Token；稳定结构尺寸可以直接引用 Primitive。

中文设计规范应覆盖基础、语义角色、排版、布局与断点、组件变体和状态、主题与密度、动效、无障碍、例外、迁移映射和待决事项。
