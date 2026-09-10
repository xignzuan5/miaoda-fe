import { useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib';
import { TextInput } from '../components/Field';
import {
  IconActivity,
  IconBell,
  IconChevron,
  IconPanel,
  IconRefresh,
  IconSun,
} from '../components/icons';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  section?: string;
}

// 由 obs_theme/src/layout/AppShell.tsx 适配而来：壳层固定，业务页面只进入 children。
// 原项目有真实 AppShell 时应直接复用原实现，不要把这个演示适配版复制回原项目。
export function AdminShell({
  children,
  navigation,
  activeId,
  onNavigate,
  pageLabel,
}: {
  children: ReactNode;
  navigation: NavigationItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  pageLabel: string;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? '56px' : 'var(--layout-sidebar-width)';
  const sections = navigation.reduce<Array<{ label: string; items: NavigationItem[] }>>((groups, item) => {
    const label = item.section ?? '工作台';
    const group = groups.find((candidate) => candidate.label === label);
    if (group) group.items.push(item);
    else groups.push({ label, items: [item] });
    return groups;
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-canvas" style={{ '--shell-sidebar-width': sidebarWidth } as CSSProperties}>
      {/* 与原 Topbar 对齐：48px、全宽固定、中央 480px 搜索、右侧时间范围/刷新/主题/通知/用户。 */}
      <header className="dt-topbar fixed inset-x-0 top-0 z-[1100] flex items-center gap-2 border-b border-line-subtle bg-surface-default px-2">
        <div className="flex min-w-fit items-center gap-1">
          <IconActivity className="size-[18px] text-action-default" />
          <span className="text-[15px] font-semibold text-action-default">obsAdmin</span>
        </div>

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="relative w-full max-w-[480px]">
            <TextInput search inputClassName="bg-canvas" placeholder="Search services, logs, traces..." />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-[3px] border border-line-default px-1.5 py-0.5 text-[11px] leading-none text-ink-disabled">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <label className="relative">
            <select className="h-[30px] w-[168px] appearance-none rounded-[4px] border border-line-default bg-surface-default px-3 pr-7 text-[13px] text-ink-primary outline-none hover:border-line-strong focus:border-action-default">
              <option>Last 15 minutes</option>
              <option>Last 1 hour</option>
              <option>Last 6 hours</option>
              <option>Last 24 hours</option>
            </select>
            <IconChevron className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-ink-secondary" />
          </label>
          <button type="button" className="inline-flex h-[30px] items-center gap-1.5 rounded-[4px] border border-action-default px-3 text-[13px] font-medium text-action-default hover:bg-action-default/10">
            <IconRefresh className="size-3.5" />
            Refresh
          </button>
          <button type="button" aria-label="切换主题" className="flex size-8 items-center justify-center rounded-[4px] text-ink-secondary hover:bg-surface-hover hover:text-ink-primary">
            <IconSun className="size-4" />
          </button>
          <button type="button" aria-label="通知" className="relative flex size-8 items-center justify-center rounded-[4px] text-ink-secondary hover:bg-surface-hover hover:text-ink-primary">
            <IconBell className="size-4" />
            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-err text-[10px] font-semibold text-white">2</span>
          </button>
          <button type="button" aria-label="用户菜单" className="flex size-7 items-center justify-center rounded-full bg-surface-selected text-[12px] font-medium text-action-default">
            DU
          </button>
        </div>
      </header>

      {/* 原 Sidebar 从顶栏下方开始固定，宽度由 layout.sidebar.width 提供。 */}
      <aside className="dt-sidebar fixed left-0 top-12 z-[1000] flex h-[calc(100vh-48px)] flex-col border-r border-line-subtle bg-surface-default transition-[width] duration-200">
        <nav className="flex-1 overflow-y-auto py-1">
          {sections.map((section) => (
            <section key={section.label}>
              {!sidebarCollapsed && <div className="px-2.5 pt-2 pb-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-disabled">{section.label}</div>}
              <ul className="flex flex-col gap-px px-1">
                {section.items.map((item) => {
                  const active = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                          'mx-1 my-px flex h-[34px] w-[calc(100%_-_8px)] items-center gap-1.5 rounded-[4px] border-l-2 px-1.5 text-left text-[13px] transition-colors',
                          sidebarCollapsed && 'justify-center px-0',
                          active
                            ? 'border-action-default bg-surface-selected font-medium text-ink-primary'
                            : 'border-transparent text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
                        )}
                      >
                        {item.icon ?? (sidebarCollapsed ? <IconActivity className="size-4" /> : null)}
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
        <div className={cn('flex border-t border-line-subtle p-1', sidebarCollapsed ? 'justify-center' : 'justify-end')}>
          <button type="button" aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'} onClick={() => setSidebarCollapsed((value) => !value)} className="flex size-8 items-center justify-center rounded-[4px] text-ink-secondary hover:bg-surface-hover hover:text-ink-primary">
            <IconPanel className="size-[18px]" />
          </button>
        </div>
      </aside>

      {/* AppShell 的内容滚动容器：顶部 48px + 面包屑 32px，内容只挂在 children。 */}
      <div
        className="dt-shell-main overflow-auto bg-canvas"
        style={{
          marginLeft: 'var(--shell-sidebar-width)',
          marginTop: 'calc(var(--layout-topbar-height) + var(--layout-breadcrumb-height))',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        <div
          className="dt-breadcrumb fixed top-12 right-0 z-[900] flex items-center gap-2 border-b border-line-subtle bg-canvas text-[12px]"
          style={{ left: 'var(--shell-sidebar-width)' }}
        >
          <span className="text-ink-secondary">Observability</span>
          <span className="text-ink-disabled">/</span>
          <span className="text-ink-secondary">Infrastructure</span>
          <span className="text-ink-disabled">/</span>
          <span className="text-ink-primary">{pageLabel}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
