import { useEffect, useState } from 'react';
import type { Product, ProductStatus } from '../types';
import { CATEGORIES } from '../types';
import { cn } from '../lib';
import { Button } from './Button';
import { Drawer } from './Drawer';
import { Field, Select, TextInput } from './Field';

const STATUS_OPTIONS: ReadonlyArray<{ value: ProductStatus; label: string }> = [
  { value: 'running', label: '运行中' },
  { value: 'maintenance', label: '维护中' },
  { value: 'error', label: '异常' },
  { value: 'disabled', label: '停用' },
];

interface Draft {
  name: string;
  code: string;
  category: string;
  owner: string;
  version: string;
  status: ProductStatus;
  description: string;
}

const empty: Draft = {
  name: '',
  code: '',
  category: CATEGORIES[0],
  owner: '',
  version: 'v1.0.0',
  status: 'running',
  description: '',
};

export interface EditorSubmit {
  id?: string;
  draft: Draft;
}

export function ProductEditor({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: Product | null;
  onSubmit: (payload: EditorSubmit) => void;
}) {
  const [draft, setDraft] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setDraft(
      initial
        ? {
            name: initial.name,
            code: initial.code,
            category: initial.category,
            owner: initial.owner,
            version: initial.version,
            status: initial.status,
            description: initial.description ?? '',
          }
        : empty,
    );
    setErrors({});
  }, [open, initial]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const save = () => {
    const next: typeof errors = {};
    if (!draft.name.trim()) next.name = '请输入产品名称';
    const code = draft.code.trim();
    if (!code) next.code = '请输入产品编码';
    else if (!/^[a-z][a-z0-9-]*$/.test(code)) next.code = '小写字母开头，仅含字母/数字/中划线';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    onSubmit({ id: initial?.id, draft: { ...draft, name: draft.name.trim(), code, category: draft.category || CATEGORIES[0] } });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initial ? `编辑产品 · ${initial.name}` : '新建产品'}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={save}>
            保存
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="产品名称" required error={errors.name}>
          <TextInput
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="如：统一监控中心"
            autoFocus
          />
        </Field>

        <Field label="产品编码" required error={errors.code} hint="小写字母开头，如 obs-monitor">
          <TextInput
            value={draft.code}
            onChange={(e) => set('code', e.target.value)}
            placeholder="如：obs-monitor"
            spellCheck={false}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="类目">
            <Select
              value={draft.category}
              onChange={(e) => set('category', e.target.value)}
              options={[...CATEGORIES]}
            />
          </Field>
          <Field label="状态">
            <Select
              value={draft.status}
              onChange={(e) => set('status', e.target.value as ProductStatus)}
              options={STATUS_OPTIONS}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="负责人">
            <TextInput
              value={draft.owner}
              onChange={(e) => set('owner', e.target.value)}
              placeholder="姓名"
            />
          </Field>
          <Field label="版本">
            <TextInput
              value={draft.version}
              onChange={(e) => set('version', e.target.value)}
              placeholder="如 v1.0.0"
              spellCheck={false}
            />
          </Field>
        </div>

        <Field label="描述" hint="简要说明产品定位与能力">
          <textarea
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="选填"
            className={cn(
              'w-full resize-none rounded-[4px] border border-line-default bg-surface-default',
              'px-2 py-2 text-[13px] text-ink-primary placeholder:text-ink-disabled',
              'focus:border-action-default focus:outline-none focus:ring-2 focus:ring-action-default/25',
            )}
          />
        </Field>

        <button type="submit" className="hidden" tabIndex={-1} />
      </form>
    </Drawer>
  );
}
