import type { Product } from '../types';

export const initialProducts: Product[] = [
  { id: 'p-01', name: '统一监控中心', code: 'obs-monitor', category: '监控告警', owner: '林悦', version: 'v3.2.0', status: 'running', updatedAt: '2026-09-08T10:24:00', description: '指标、事件与告警的集中处理与下发。' },
  { id: 'p-02', name: '智能告警引擎', code: 'obs-alert', category: '监控告警', owner: '周航', version: 'v2.8.1', status: 'running', updatedAt: '2026-09-08T09:10:00', description: '基于规则的告警收敛与降噪。' },
  { id: 'p-03', name: '日志检索平台', code: 'obs-log', category: '日志分析', owner: '陈默', version: 'v1.9.3', status: 'running', updatedAt: '2026-09-07T18:45:00', description: '全量日志采集、索引与检索。' },
  { id: 'p-04', name: '链路追踪服务', code: 'obs-trace', category: '链路追踪', owner: '郑桐', version: 'v2.1.0', status: 'maintenance', updatedAt: '2026-09-07T14:02:00', description: '分布式调用链采样与可视化。' },
  { id: 'p-05', name: 'APM 性能分析', code: 'obs-apm', category: '可观测平台', owner: '苏芮', version: 'v1.5.2', status: 'running', updatedAt: '2026-09-06T20:30:00', description: '应用性能与错误堆栈分析。' },
  { id: 'p-06', name: '服务地图', code: 'obs-topology', category: '可观测平台', owner: '沈一', version: 'v0.9.0', status: 'error', updatedAt: '2026-09-06T11:17:00', description: '微服务调用拓扑与依赖关系。' },
  { id: 'p-07', name: '合成拨测', code: 'obs-synthetic', category: '监控告警', owner: '贺鸣', version: 'v1.3.4', status: 'running', updatedAt: '2026-09-05T16:40:00', description: '主动探测用户可达性与链路质量。' },
  { id: 'p-08', name: '报表中心', code: 'obs-report', category: '数据报表', owner: '叶秋', version: 'v2.0.1', status: 'disabled', updatedAt: '2026-09-04T09:05:00', description: '自定义看板与定时报表订阅。' },
  { id: 'p-09', name: '数据大盘', code: 'obs-dashboard', category: '数据报表', owner: '林悦', version: 'v3.0.0', status: 'running', updatedAt: '2026-09-03T15:22:00', description: '高密度可视化运营大盘。' },
  { id: 'p-10', name: 'CMDB 配置管理', code: 'obs-cmdb', category: '可观测平台', owner: '周航', version: 'v1.7.0', status: 'maintenance', updatedAt: '2026-09-03T08:12:00', description: '资产、应用与环境的配置建模。' },
  { id: 'p-11', name: '事件流处理', code: 'obs-stream', category: '日志分析', owner: '陈默', version: 'v0.6.2', status: 'error', updatedAt: '2026-09-02T22:48:00', description: '实时日志流聚合与异常检测。' },
  { id: 'p-12', name: '接入网关', code: 'obs-gateway', category: '可观测平台', owner: '苏芮', version: 'v2.4.0', status: 'running', updatedAt: '2026-09-02T10:33:00', description: '多协议数据接入与鉴权。' },
  { id: 'p-13', name: '告警订阅', code: 'obs-subscribe', category: '监控告警', owner: '郑桐', version: 'v1.2.6', status: 'disabled', updatedAt: '2026-08-31T13:27:00', description: 'IM/邮件渠道的告警订阅通知。' },
  { id: 'p-14', name: '指标仓库', code: 'obs-metric-db', category: '数据报表', owner: '沈一', version: 'v1.1.3', status: 'running', updatedAt: '2026-08-30T19:55:00', description: '时序指标存储与查询接口。' },
];
