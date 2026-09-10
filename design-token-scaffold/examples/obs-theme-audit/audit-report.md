# Design Token 提取审计

本报告是机械扫描清单，不代表已经批准的设计系统。候选名称和语义角色仍需根据源码证据确认。

- 扫描文件：96
- 唯一值：102
- 重复候选：68
- 布局证据：10
- 字体资源声明：1

## 尺寸

| 值 | 次数 | 示例来源 |
|---|---:|---|
| `1px` | 96 | src/layout/AppShell.tsx:112<br>src/layout/Sidebar.tsx:54<br>src/layout/Topbar.tsx:41 |
| `4px` | 63 | src/layout/AppShell.tsx:115<br>src/layout/Sidebar.tsx:54<br>src/pages/alerts/components/AlertDetailDrawer.tsx:146 |
| `0.04em` | 24 | src/pages/alerts/components/AlertDetailDrawer.tsx:79<br>src/pages/alerts/components/AlertDetailDrawer.tsx:82<br>src/pages/alerts/components/AlertRulesTable.tsx:86 |
| `13px` | 19 | src/layout/AppShell.tsx:114<br>src/theme/index.ts:171<br>src/theme/index.ts:174 |
| `3px` | 19 | src/components/common/GlobalSearch.tsx:61<br>src/layout/Topbar.tsx:81<br>src/pages/alerts/components/AlertRulesTable.tsx:46 |
| `12px` | 14 | src/theme/index.ts:172<br>src/theme/index.ts:264<br>src/theme/index.ts:358 |
| `11px` | 12 | src/pages/alerts/components/AlertRulesTable.tsx:86<br>src/pages/alerts/components/FiringAlertsTable.tsx:82<br>src/pages/apm/components/ErrorTracking.tsx:108 |
| `6px` | 12 | src/components/common/GlobalSearch.tsx:45<br>src/layout/Topbar.tsx:109<br>src/pages/alerts/components/CreateAlertModal.tsx:52 |
| `2px` | 10 | src/layout/Sidebar.tsx:57<br>src/layout/Topbar.tsx:104<br>src/pages/synthetics/index.tsx:207 |
| `7px` | 10 | src/pages/alerts/components/AlertRulesTable.tsx:87<br>src/pages/alerts/components/FiringAlertsTable.tsx:83<br>src/pages/apm/components/ErrorTracking.tsx:112 |
| `16px` | 8 | src/theme/index.ts:169<br>src/theme/index.ts:433<br>src/theme/index.ts:434 |
| `100vh` | 7 | src/layout/AppShell.tsx:57<br>src/layout/AppShell.tsx:98<br>src/layout/Sidebar.tsx:26 |
| `20px` | 7 | src/components/common/GlobalSearch.tsx:45<br>src/pages/synthetics/index.tsx:169<br>src/theme/index.ts:168 |
| `36px` | 5 | src/theme/index.ts:411<br>src/theme/index.ts:493<br>src/theme/index.ts:506 |
| `10px` | 4 | src/theme/index.ts:184<br>src/theme/index.ts:317<br>src/theme/index.ts:529 |
| `-0.01em` | 2 | src/theme/index.ts:168<br>src/theme/index.ts:207 |
| `-0.02em` | 2 | src/theme/index.ts:167<br>src/theme/index.ts:200 |
| `0.08em` | 2 | src/layout/Sidebar.tsx:41<br>src/theme/index.ts:186 |
| `14px` | 2 | src/theme/index.ts:170<br>src/theme/index.ts:173 |
| `30px` | 2 | src/theme/index.ts:265<br>src/theme/index.ts:666 |
| `32px` | 2 | src/theme/index.ts:357<br>src/theme/index.ts:698 |
| `5px` | 2 | src/theme/index.ts:264<br>src/theme/index.ts:666 |
| `80px` | 2 | src/layout/AppShell.tsx:96<br>src/layout/AppShell.tsx:98 |
| `8px` | 2 | src/layout/Topbar.tsx:109<br>src/theme/index.ts:386 |
| `24px` | 1 | src/theme/index.ts:167 |
| `28px` | 1 | src/theme/index.ts:197 |
| `48px` | 1 | src/layout/Sidebar.tsx:26 |
| `60px` | 1 | src/components/common/GlobalSearch.tsx:45 |
| `72px` | 1 | src/pages/NotFoundPage.tsx:9 |
| `90vw` | 1 | src/components/common/GlobalSearch.tsx:45 |

## 颜色

| 值 | 次数 | 示例来源 |
|---|---:|---|
| `#ef4444` | 86 | src/components/common/ErrorBoundary.tsx:17<br>src/components/common/GlobalSearch.tsx:82<br>src/components/common/GlobalSearch.tsx:83 |
| `#10b981` | 74 | src/components/common/GlobalSearch.tsx:82<br>src/components/common/GlobalSearch.tsx:83<br>src/pages/alerts/components/AlertDetailDrawer.tsx:110 |
| `#06b6d4` | 68 | src/components/common/NotificationBell.tsx:23<br>src/components/common/NotificationBell.tsx:58<br>src/components/common/NotificationBell.tsx:93 |
| `#f59e0b` | 51 | src/components/common/NotificationBell.tsx:23<br>src/pages/alerts/components/AlertDetailDrawer.tsx:119<br>src/pages/alerts/mockData.ts:61 |
| `#8b93a8` | 48 | src/components/common/NotificationBell.tsx:39<br>src/components/common/ThemeToggle.tsx:11<br>src/pages/alerts/components/AlertsSummaryBar.tsx:23 |
| `#4d566b` | 26 | src/components/common/EmptyState.tsx:26<br>src/layout/AppShell.tsx:80<br>src/layout/Topbar.tsx:71 |
| `#8b5cf6` | 22 | src/pages/auth/components/LoginLeftPanel.tsx:41<br>src/pages/dashboard/mockData.ts:17<br>src/pages/incidents/mockData.ts:23 |
| `#1e2438` | 19 | src/pages/alerts/components/FiringAlertsTable.tsx:61<br>src/pages/auth/components/SSOButtons.tsx:20<br>src/pages/incidents/components/IncidentDetailDrawer.tsx:70 |
| `#e8eaf0` | 17 | src/layout/AppShell.tsx:113<br>src/pages/auth/components/SSOButtons.tsx:47<br>src/pages/dashboard/components/ServiceMap.tsx:26 |
| `#1f2535` | 15 | src/layout/Topbar.tsx:41<br>src/pages/auth/components/LoginLeftPanel.tsx:19<br>src/pages/auth/components/LoginLeftPanel.tsx:34 |
| `#2a3147` | 15 | src/layout/AppShell.tsx:112<br>src/layout/Topbar.tsx:80<br>src/layout/Topbar.tsx:100 |
| `#ffffff` | 15 | src/layout/AppShell.tsx:111<br>src/theme/index.ts:135<br>src/theme/index.ts:147 |
| `#0891b2` | 14 | src/theme/index.ts:98<br>src/theme/index.ts:270<br>src/theme/index.ts:619 |
| `#0f1117` | 13 | src/layout/Topbar.tsx:98<br>src/pages/auth/components/LoginLeftPanel.tsx:10<br>src/pages/auth/components/SSOButtons.tsx:16 |
| `#111827` | 13 | src/layout/AppShell.tsx:113<br>src/pages/auth/components/LoginLeftPanel.tsx:35<br>src/theme/index.ts:632 |
| `#e5e7eb` | 13 | src/layout/AppShell.tsx:112<br>src/pages/auth/components/SSOButtons.tsx:17<br>src/theme/index.ts:633 |
| `#161b27` | 9 | src/layout/Topbar.tsx:40<br>src/pages/auth/components/LoginLeftPanel.tsx:35<br>src/theme/index.ts:81 |
| `#f97316` | 9 | src/pages/alerts/mockData.ts:60<br>src/pages/incidents/mockData.ts:26<br>src/pages/metrics/components/MetricsExplorerChart.tsx:13 |
| `#1c2333` | 8 | src/layout/AppShell.tsx:111<br>src/pages/dashboard/components/ServiceMap.tsx:24<br>src/theme/index.ts:82 |
| `#1a2540` | 7 | src/layout/Topbar.tsx:168<br>src/pages/settings/index.tsx:165<br>src/pages/users/index.tsx:182 |
| `#3d4663` | 7 | src/layout/Topbar.tsx:101<br>src/layout/Topbar.tsx:128<br>src/pages/dashboard/components/ServiceMap.tsx:51 |
| `#6b7280` | 7 | src/theme/index.ts:632<br>src/theme/index.ts:669<br>src/theme/index.ts:672 |
| `#9ca3af` | 7 | src/pages/auth/components/LoginLeftPanel.tsx:36<br>src/pages/auth/components/LoginLeftPanel.tsx:46<br>src/theme/index.ts:632 |
| `#f3f4f6` | 7 | src/pages/auth/components/SSOButtons.tsx:20<br>src/theme/index.ts:615<br>src/theme/index.ts:668 |
| `#374151` | 5 | src/pages/auth/components/LoginLeftPanel.tsx:19<br>src/pages/auth/components/LoginLeftPanel.tsx:34<br>src/pages/auth/components/LoginLeftPanel.tsx:35 |
| `#d1d5db` | 5 | src/pages/auth/components/LoginLeftPanel.tsx:16<br>src/pages/auth/components/LoginLeftPanel.tsx:30<br>src/theme/index.ts:660 |
| `#ec4899` | 5 | src/pages/metrics/components/MetricsExplorerChart.tsx:13<br>src/pages/traces/mockData.ts:44<br>src/theme/index.ts:110 |
| `#eff6ff` | 4 | src/pages/auth/components/DemoCredentials.tsx:13<br>src/theme/index.ts:616<br>src/theme/index.ts:692 |
| `#f9fafb` | 4 | src/pages/auth/components/SSOButtons.tsx:16<br>src/theme/index.ts:614<br>src/theme/index.ts:691 |
| `#06b6d415` | 3 | src/pages/auth/components/DemoCredentials.tsx:13<br>src/theme/tokens.ts:24<br>src/theme/tokens.ts:35 |

## 字重

| 值 | 次数 | 示例来源 |
|---|---:|---|
| `500` | 45 | src/layout/Sidebar.tsx:41<br>src/pages/alerts/components/AlertDetailDrawer.tsx:101<br>src/pages/alerts/components/AlertDetailPage.tsx:94 |
| `600` | 31 | src/layout/Topbar.tsx:56<br>src/layout/Topbar.tsx:174<br>src/pages/alerts/components/AlertDetailDrawer.tsx:54 |
| `400` | 6 | src/theme/index.ts:173<br>src/theme/index.ts:174<br>src/theme/index.ts:192 |
| `700` | 1 | src/pages/NotFoundPage.tsx:9 |

## 阴影

| 值 | 次数 | 示例来源 |
|---|---:|---|
| `none` | 15 | src/pages/alerts/components/AlertRulesTable.tsx:23<br>src/pages/alerts/components/FiringAlertsTable.tsx:17<br>src/pages/apm/components/ErrorTracking.tsx:21 |
| `0 0 0 2px rgba(6,182,212,0.12)` | 1 | src/layout/Topbar.tsx:104 |
| `0 0 0 2px rgba(6,182,212,0.15)` | 1 | src/theme/index.ts:313 |
| `0 0 0 2px rgba(8,145,178,0.12)` | 1 | src/theme/index.ts:680 |
| `0 20px 60px rgba(0,0,0,0.5)` | 1 | src/components/common/GlobalSearch.tsx:45 |

## 语义结构证据

以下证据用于提醒模型检查标题、表格、页面地标和组件的语义上下文，不会自动升级为正式 Token。

| 类型 | 语义 | 次数 | 示例来源 |
|---|---|---:|---|
| 组件使用 | `Button` | 90 | src/components/common/EmptyState.tsx:34<br>src/components/common/ErrorBoundary.tsx:20<br>src/layout/Topbar.tsx:141 |
| 标题语义 | `h4` | 51 | src/components/common/EmptyState.tsx:27<br>src/components/common/NotificationBell.tsx:54<br>src/pages/alerts/components/AlertDetailDrawer.tsx:91 |
| 组件使用 | `TextField` | 37 | src/components/common/GlobalSearch.tsx:46<br>src/components/common/TimezoneSelect.tsx:31<br>src/layout/Topbar.tsx:64 |
| 组件使用 | `Select` | 27 | src/layout/Topbar.tsx:120<br>src/pages/alerts/components/CreateAlertModal.tsx:73<br>src/pages/alerts/components/CreateAlertModal.tsx:83 |
| 组件使用 | `Chip` | 22 | src/pages/alerts/components/AlertDetailDrawer.tsx:53<br>src/pages/alerts/components/AlertDetailPage.tsx:49<br>src/pages/alerts/components/AlertRulesTable.tsx:40 |
| 标题语义 | `h2` | 20 | src/pages/alerts/components/AlertDetailPage.tsx:50<br>src/pages/alerts/index.tsx:35<br>src/pages/apm/index.tsx:24 |
| 标题语义 | `h3` | 13 | src/components/common/ErrorBoundary.tsx:18<br>src/pages/alerts/components/AlertDetailDrawer.tsx:56<br>src/pages/alerts/components/CreateAlertModal.tsx:54 |
| 表格结构 | `Table` | 12 | src/pages/alerts/components/AlertRulesTable.tsx:24<br>src/pages/alerts/components/FiringAlertsTable.tsx:18<br>src/pages/apm/components/ErrorTracking.tsx:22 |
| 表格结构 | `TableBody` | 12 | src/pages/alerts/components/AlertRulesTable.tsx:36<br>src/pages/alerts/components/FiringAlertsTable.tsx:31<br>src/pages/apm/components/ErrorTracking.tsx:33 |
| 表格结构 | `TableContainer` | 12 | src/pages/alerts/components/AlertRulesTable.tsx:23<br>src/pages/alerts/components/FiringAlertsTable.tsx:17<br>src/pages/apm/components/ErrorTracking.tsx:21 |
| 表格结构 | `TableHead` | 12 | src/pages/alerts/components/AlertRulesTable.tsx:25<br>src/pages/alerts/components/FiringAlertsTable.tsx:19<br>src/pages/apm/components/ErrorTracking.tsx:23 |
| 组件使用 | `MuiOutlinedInput` | 12 | src/layout/Topbar.tsx:96<br>src/layout/Topbar.tsx:107<br>src/layout/Topbar.tsx:127 |
| 组件使用 | `Table` | 12 | src/pages/alerts/components/AlertRulesTable.tsx:24<br>src/pages/alerts/components/FiringAlertsTable.tsx:18<br>src/pages/apm/components/ErrorTracking.tsx:22 |
| 组件使用 | `Tabs` | 12 | src/pages/alerts/components/AlertDetailDrawer.tsx:69<br>src/pages/alerts/index.tsx:38<br>src/pages/incidents/components/IncidentDetailDrawer.tsx:57 |
| 组件使用 | `MuiChip` | 8 | src/theme/index.ts:457<br>src/theme/index.ts:466<br>src/theme/index.ts:470 |
| 组件使用 | `Drawer` | 6 | src/pages/alerts/components/AlertDetailDrawer.tsx:46<br>src/pages/apm/components/ErrorTracking.tsx:50<br>src/pages/incidents/components/IncidentDetailDrawer.tsx:26 |
| 组件使用 | `MuiSwitch` | 6 | src/layout/Topbar.tsx:182<br>src/layout/Topbar.tsx:182<br>src/layout/Topbar.tsx:182 |
| 组件使用 | `Dialog` | 5 | src/pages/alerts/components/CreateAlertModal.tsx:51<br>src/pages/synthetics/components/CreateMonitorModal.tsx:56<br>src/pages/users/components/CreateUserModal.tsx:53 |
| 组件使用 | `MuiLinearProgress` | 4 | src/pages/users/components/CreateUserModal.tsx:99<br>src/theme/index.ts:575<br>src/theme/index.ts:703 |
| 组件使用 | `MuiSelect` | 4 | src/layout/Topbar.tsx:129<br>src/theme/index.ts:335<br>src/theme/index.ts:696 |
| 组件使用 | `MuiTableCell` | 4 | src/theme/index.ts:378<br>src/theme/index.ts:404<br>src/theme/index.ts:691 |
| 组件使用 | `MuiSkeleton` | 3 | src/theme/index.ts:588<br>src/theme/index.ts:704<br>src/theme/index.ts:704 |
| 组件使用 | `MuiTable` | 3 | src/theme/index.ts:369<br>src/theme/index.ts:695<br>src/theme/index.ts:695 |
| 组件使用 | `MuiTableRow` | 3 | src/pages/synthetics/index.tsx:150<br>src/theme/index.ts:396<br>src/theme/index.ts:692 |
| 组件使用 | `MuiAppBar` | 2 | src/theme/index.ts:556<br>src/theme/index.ts:690 |
| 组件使用 | `MuiBreadcrumbs` | 2 | src/layout/AppShell.tsx:81<br>src/theme/index.ts:567 |
| 组件使用 | `MuiButton` | 2 | src/theme/index.ts:253<br>src/theme/index.ts:663 |
| 组件使用 | `MuiCard` | 2 | src/theme/index.ts:419<br>src/theme/index.ts:686 |
| 组件使用 | `MuiCardContent` | 2 | src/theme/index.ts:430<br>src/theme/index.ts:687 |
| 组件使用 | `MuiCardHeader` | 2 | src/theme/index.ts:439<br>src/theme/index.ts:688 |
| 组件使用 | `MuiCssBaseline` | 2 | src/theme/index.ts:235<br>src/theme/index.ts:654 |
| 组件使用 | `MuiDivider` | 2 | src/theme/index.ts:538<br>src/theme/index.ts:702 |
| 组件使用 | `MuiDrawer` | 2 | src/theme/index.ts:546<br>src/theme/index.ts:689 |
| 组件使用 | `MuiIconButton` | 2 | src/theme/index.ts:287<br>src/theme/index.ts:672 |
| 组件使用 | `MuiInput` | 2 | src/components/common/GlobalSearch.tsx:58<br>src/components/common/GlobalSearch.tsx:58 |
| 组件使用 | `MuiInputLabel` | 2 | src/theme/index.ts:325<br>src/theme/index.ts:685 |
| 组件使用 | `MuiMenu` | 2 | src/theme/index.ts:342<br>src/theme/index.ts:697 |
| 组件使用 | `MuiMenuItem` | 2 | src/theme/index.ts:353<br>src/theme/index.ts:698 |
| 组件使用 | `MuiTab` | 2 | src/theme/index.ts:503<br>src/theme/index.ts:700 |
| 组件使用 | `MuiTableBody` | 2 | src/theme/index.ts:393<br>src/theme/index.ts:692 |
| 组件使用 | `MuiTableHead` | 2 | src/theme/index.ts:375<br>src/theme/index.ts:691 |
| 组件使用 | `MuiTabs` | 2 | src/theme/index.ts:490<br>src/theme/index.ts:699 |
| 组件使用 | `MuiTooltip` | 2 | src/theme/index.ts:521<br>src/theme/index.ts:701 |
| 组件使用 | `MuiBadge` | 1 | src/components/common/NotificationBell.tsx:40 |

## 布局证据

以下内容来自源码中的栅格/列定义，只用于发现实际存在的布局模式；模型仍需阅读上下文，确认它是页面模板、组件网格还是局部布局。

| 类型 | 定义 | 次数 | 示例来源 |
|---|---|---:|---|
| 响应式栅格 | `MUI Grid xs=12/12（1列）` | 25 | src/components/common/PageSkeleton.tsx:26<br>src/components/common/PageSkeleton.tsx:40<br>src/components/common/PageSkeleton.tsx:43 |
| 响应式栅格 | `MUI Grid md=4/12（3列）` | 11 | src/components/common/PageSkeleton.tsx:26<br>src/components/common/PageSkeleton.tsx:43<br>src/components/common/PageSkeleton.tsx:65 |
| 响应式栅格 | `MUI Grid md=3/12（4列）` | 8 | src/components/common/PageSkeleton.tsx:56<br>src/pages/alerts/components/AlertDetailPage.tsx:70<br>src/pages/dashboard/components/ColorMetricCards.tsx:19 |
| 响应式栅格 | `MUI Grid sm=6/12（2列）` | 8 | src/components/common/PageSkeleton.tsx:26<br>src/components/common/PageSkeleton.tsx:56<br>src/pages/alerts/components/NotificationChannels.tsx:28 |
| 响应式栅格 | `MUI Grid xs=6/12（2列）` | 7 | src/pages/alerts/components/AlertDetailPage.tsx:70<br>src/pages/dashboard/components/StatTiles.tsx:12<br>src/pages/incidents/IncidentDetailPage.tsx:54 |
| 响应式栅格 | `MUI Grid md=8/12` | 5 | src/components/common/PageSkeleton.tsx:40<br>src/components/common/PageSkeleton.tsx:62<br>src/pages/dashboard/index.tsx:45 |
| 响应式栅格 | `MUI Grid md=5/12` | 2 | src/pages/dashboard/index.tsx:48<br>src/pages/incidents/IncidentDetailPage.tsx:64 |
| 响应式栅格 | `MUI Grid md=6/12（2列）` | 2 | src/pages/dashboard/index.tsx:49<br>src/pages/dashboard/index.tsx:50 |
| 响应式栅格 | `MUI Grid md=7/12` | 2 | src/pages/dashboard/index.tsx:47<br>src/pages/incidents/IncidentDetailPage.tsx:70 |
| 响应式栅格 | `MUI Grid md=12/12（1列）` | 1 | src/pages/metrics/components/HostsColorCards.tsx:12 |

## 字体资源证据

以下内容只说明源码声明了哪些字体资源；是否成功下载、浏览器最终使用哪个字体，仍需运行时检查。

| 类型 | 声明 | 示例来源 |
|---|---|---|
| 字体资源声明 | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap` | index.html:9 |

## 待处理事项

- 将稳定且有意图的值分配给基础 Token。
- 分离数值相同但语义不同的使用场景。
- 聚类近似值，并判断它们是历史漂移还是刻意差异。
- 将实际用途映射到语义 Token 和组件 Token。
- 根据语义结构和布局证据补充页面布局、标题层级和组件部件配方。
- 区分页面壳层、页面模板、重复卡片网格和局部栅格，不能把整页源码复制进模板。
- 检查主题、状态、响应式、动效和无障碍完整性。
- 对字体资源执行浏览器运行时验证，确认请求成功、字体族和实际渲染字体，而不是只看 font-family 字符串。
