import { AdminShell } from './templates/AdminShell';
import { PageContent } from './templates/ContentTemplates';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product, ProductStatus } from './types';
import { CATEGORIES } from './types';
import { initialProducts } from './data/products';
import { cn, formatDate, pageWindow } from './lib';
import { Button } from './components/Button';
import { StatusChip } from './components/Chip';
import { Select, TextInput } from './components/Field';
import { Modal } from './components/Modal';
import { ProductEditor, type EditorSubmit } from './components/ProductEditor';
import {
  IconBolt,
  IconChevron,
  IconClose,
  IconEdit,
  IconExport,
  IconPlus,
  IconTrash,
} from './components/icons';

const PAGE_SIZE = 8;

const NAV = [
  { id: 'products', label: '产品管理', icon: <IconBolt className="size-4" /> },
];

const LOGO_ACCENTS = [
  'bg-accent-cyan/15 text-accent-cyan',
  'bg-accent-violet/15 text-accent-violet',
  'bg-accent-amber/15 text-accent-amber',
  'bg-accent-green/15 text-accent-green',
  'bg-accent-pink/15 text-accent-pink',
  'bg-accent-orange/15 text-accent-orange',
];

const hash = (s: string) => [...s].reduce((n, c) => (n + c.charCodeAt(0)) % 997, 0);

const STATUS_OPTIONS: ReadonlyArray<string | { value: string; label: string }> = [
  { value: 'running', label: '运行中' },
  { value: 'maintenance', label: '维护中' },
  { value: 'error', label: '异常' },
  { value: 'disabled', label: '停用' },
];

function ExportButton({ rows }: { rows: Product[] }) {
  const exportCsv = () => {
    const head = '名称,编码,类目,负责人,版本,状态,更新时间,描述';
    const body = rows.map((p) =>
      [p.name, p.code, p.category, p.owner, p.version, p.status, p.updatedAt, p.description ?? '']
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(','),
    );
    const blob = new Blob(['﻿' + [head, ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="outlined" icon={<IconExport className="size-3.5" />} onClick={exportCsv}>
      导出
    </Button>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeNav, setActiveNav] = useState('products');

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (status && p.status !== (status as ProductStatus)) return false;
      if (category && p.category !== category) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !p.owner.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [products, query, status, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setEditorOpen(true);
  };

  const handleSubmit = ({ id, draft }: EditorSubmit) => {
    const now = new Date().toISOString();
    if (id) {
      setProducts((list) =>
        list.map((p) => (p.id === id ? { ...p, ...draft, updatedAt: now } : p)),
      );
    } else {
      const code = draft.code;
      const nextId = `p-${Date.now().toString(36)}`;
      setProducts((list) => [
        { id: nextId, ...draft, code, updatedAt: now, status: draft.status },
        ...list,
      ]);
    }
    setEditorOpen(false);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setProducts((list) => list.filter((p) => p.id !== deleting.id));
    setDeleting(null);
  };

  const resetFilters = () => {
    setQuery('');
    setStatus('');
    setCategory('');
  };

  const hasFilters = query !== '' || status !== '' || category !== '';

  return (
    <AdminShell navigation={NAV} activeId={activeNav} onNavigate={setActiveNav} pageLabel="产品管理">
        {/* Content */}
        <PageContent>
          <div className="flex flex-col">
            <section className="flex flex-col">
              {/* Page header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                <div>
                  <h2 className="dt-page-title text-ink-primary">产品管理</h2>
                  <p className="dt-page-subtitle mt-0.5">
                    共 {products.length} 个产品
                    {hasFilters && <> · 匹配 {filtered.length} 条</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ExportButton rows={filtered} />
                  <Button variant="primary" icon={<IconPlus className="size-3.5" />} onClick={openCreate}>
                    新建产品
                  </Button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pb-4">
                <div className="w-64">
                  <TextInput
                    search
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索名称 / 编码 / 负责人"
                  />
                </div>
                <div className="w-[148px]">
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={STATUS_OPTIONS}
                    placeholder="全部状态"
                  />
                </div>
                <div className="w-[148px]">
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={[...CATEGORIES]}
                    placeholder="全部类目"
                  />
                </div>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="ml-auto inline-flex items-center gap-1 text-[12px] text-ink-secondary hover:text-ink-primary"
                  >
                    <IconClose className="size-3" />
                    清空筛选
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead>
                    <tr className="dt-table-head h-8">
                      <Th>产品</Th>
                      <Th className="w-[120px]">类目</Th>
                      <Th className="w-[150px]">负责人</Th>
                      <Th className="w-[100px]">版本</Th>
                      <Th className="w-[110px]">状态</Th>
                      <Th className="w-[150px]">更新时间</Th>
                      <Th className="w-[92px] text-right">操作</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="h-28 text-center">
                          <p className="text-[13px] text-ink-secondary">未找到匹配的产品</p>
                          {hasFilters && (
                            <button
                              type="button"
                              onClick={resetFilters}
                              className="mt-1 text-[12px] text-info hover:underline"
                            >
                              清空筛选条件
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((p) => {
                        const accent = LOGO_ACCENTS[hash(p.code) % LOGO_ACCENTS.length];
                        return (
                          <tr
                            key={p.id}
                            className="h-9 text-[13px] transition-colors hover:bg-surface-hover"
                          >
                            <Td>
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-[4px]',
                                    accent,
                                  )}
                                >
                                  <IconBolt className="size-3.5" />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium text-ink-primary">{p.name}</span>
                                  <span className="font-mono text-[11px] leading-4 text-ink-disabled">
                                    {p.code}
                                  </span>
                                </span>
                              </div>
                            </Td>
                            <Td className="text-ink-secondary">{p.category}</Td>
                            <Td>
                              <span className="inline-flex items-center gap-2 text-ink-secondary">
                                <span className="flex size-5 items-center justify-center rounded-full border border-line-default bg-surface-hover text-[10px] text-ink-secondary">
                                  {p.owner.slice(0, 1)}
                                </span>
                                {p.owner}
                              </span>
                            </Td>
                            <Td className="font-mono text-[12px] text-ink-secondary">{p.version}</Td>
                            <Td>
                              <StatusChip status={p.status} />
                            </Td>
                            <Td className="text-ink-secondary">{formatDate(p.updatedAt)}</Td>
                            <Td className="text-right">
                              <span className="inline-flex gap-0.5">
                                <IconAction
                                  label={`编辑 ${p.name}`}
                                  onClick={() => openEdit(p)}
                                >
                                  <IconEdit className="size-3.5" />
                                </IconAction>
                                <IconAction
                                  label={`删除 ${p.name}`}
                                  onClick={() => setDeleting(p)}
                                  danger
                                >
                                  <IconTrash className="size-3.5" />
                                </IconAction>
                              </span>
                            </Td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer / pagination */}
              <div className="flex items-center justify-between gap-3 py-3 text-[12px] text-ink-secondary">
                <span>
                  共 {filtered.length} 条 · 每页 {PAGE_SIZE} 条
                </span>
                <div className="flex items-center gap-1">
                  <PagerButton
                    label="上一页"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    <IconChevron className="size-3.5 rotate-90" />
                  </PagerButton>
                  {pageWindow(safePage, totalPages).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        'flex h-7 min-w-7 items-center justify-center rounded-[4px] px-2 text-[12px] transition-colors',
                        n === safePage
                          ? 'bg-action-default/15 font-medium text-action-default'
                          : 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <PagerButton
                    label="下一页"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(safePage + 1)}
                  >
                    <IconChevron className="size-3.5 -rotate-90" />
                  </PagerButton>
                </div>
              </div>
            </section>
          </div>
        </PageContent>

      <ProductEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="删除产品"
        width="w-[380px]"
        footer={
          <>
            <Button variant="outlined" onClick={() => setDeleting(null)}>
              取消
            </Button>
            <Button variant="dangerFill" onClick={confirmDelete}>
              删除
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-5 text-ink-secondary">
          确定删除产品
          <span className="mx-1 font-medium text-ink-primary">{deleting?.name}</span>吗？
          <br />
          此操作不可恢复。
        </p>
      </Modal>
    </AdminShell>
  );
}

/* --- small presentational helpers --- */

function Th({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <th className={cn('dt-table-head-cell whitespace-nowrap', className)}>
      <span className="inline-flex items-center">{children}</span>
    </th>
  );
}

function Td({ className, children }: { className?: string; children: ReactNode }) {
  return <td className={cn('dt-table-cell align-middle', className)}>{children}</td>;
}

function IconAction({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded-[4px] text-ink-secondary transition-colors',
        danger
          ? 'hover:bg-err/10 hover:text-err'
          : 'hover:bg-surface-hover hover:text-ink-primary',
      )}
    >
      {children}
    </button>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
