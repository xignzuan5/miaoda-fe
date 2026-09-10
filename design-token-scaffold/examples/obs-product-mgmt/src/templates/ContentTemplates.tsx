import type { CSSProperties, ReactNode } from 'react';

export interface ContentSlots {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

type PageHeaderSlots = Omit<ContentSlots, 'children'>;

// 只负责内容区；不包含顶栏、侧栏、面包屑或鉴权。
export function PageContent({ title, description, actions, children }: ContentSlots) {
  return <main className="dt-content bg-canvas">
    {(title || description || actions) && <header className="flex flex-wrap items-center justify-between gap-3 pb-3">
      <div>{title && <h2 className="dt-page-title">{title}</h2>}
        {description && <div className="dt-page-subtitle">{description}</div>}</div>
      {actions}
    </header>}
    {children}
  </main>;
}

// 来源模式：Users / Alerts。筛选器、表格、分页由业务提供。
export function ListPageTemplate({ filters, pagination, ...props }: ContentSlots & {
  filters?: ReactNode; pagination?: ReactNode;
}) {
  return <PageContent {...props}>
    {filters && <div className="flex flex-wrap items-center gap-2 pb-4">{filters}</div>}
    <div className="overflow-x-auto">{props.children}</div>
    {pagination && <footer className="py-3">{pagination}</footer>}
  </PageContent>;
}

// 来源模式：Alerts / Settings。业务提供可访问的选项卡和活动面板。
export function TabbedPageTemplate({ tabs, ...props }: ContentSlots & { tabs: ReactNode }) {
  return <PageContent {...props}><div className="pb-3">{tabs}</div>{props.children}</PageContent>;
}

// 来源模式：Settings 的 General / Appearance 表单；宽度限制只属于此模板。
export function SettingsPageTemplate({ footer, ...props }: ContentSlots & { footer?: ReactNode }) {
  return <PageContent {...props}><div style={{ maxWidth: 'var(--template-settings-max-width)' }}>
    {props.children}{footer && <footer className="py-3">{footer}</footer>}
  </div></PageContent>;
}

// 来源模式：HostDetailPage（8/4）和 IncidentDetailPage（5/7）。
// 这是页面级两列框架，主区和辅助区的具体内容由调用方提供。
export interface TwoColumnPageSlots extends PageHeaderSlots {
  main: ReactNode;
  aside: ReactNode;
  // 按来源页传入栅格轨道，例如 8fr/4fr 或 5fr/7fr；不在模板中猜业务比例。
  mainTrack?: string;
  asideTrack?: string;
  mainClassName?: string;
  asideClassName?: string;
}

export function TwoColumnPageTemplate({
  main, aside, mainTrack, asideTrack, mainClassName, asideClassName, ...props
}: TwoColumnPageSlots) {
  const gridStyle = {
    ...(mainTrack ? { '--template-two-column-main-track': mainTrack } : {}),
    ...(asideTrack ? { '--template-two-column-aside-track': asideTrack } : {}),
  } as CSSProperties;
  return <PageContent {...props}>
    <div className="dt-two-column-grid" style={gridStyle}>
      <section className={mainClassName}>{main}</section>
      <aside className={asideClassName}>{aside}</aside>
    </div>
  </PageContent>;
}

// 来源模式：APM、Integrations、Settings Data Sources 中反复出现的 md=4 卡片网格。
// 它只抽取列布局和响应式行为，不把任何业务卡片内容固化进来。
export interface ThreeColumnGridSlots extends PageHeaderSlots {
  children: ReactNode;
  itemClassName?: string;
}

export function ThreeColumnGridTemplate({ itemClassName, children, ...props }: ThreeColumnGridSlots) {
  return <PageContent {...props}>
    <div className="dt-three-column-grid">
      {Array.isArray(children)
        ? children.map((child, index) => <div key={index} className={itemClassName}>{child}</div>)
        : <div className={itemClassName}>{children}</div>}
    </div>
  </PageContent>;
}
