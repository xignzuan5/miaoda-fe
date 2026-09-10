export type ProductStatus = 'running' | 'maintenance' | 'error' | 'disabled';

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  owner: string;
  version: string;
  status: ProductStatus;
  updatedAt: string; // ISO date
  description?: string;
}

export const CATEGORIES = ['可观测平台', '监控告警', '日志分析', '链路追踪', '数据报表'] as const;

export type Category = (typeof CATEGORIES)[number];
