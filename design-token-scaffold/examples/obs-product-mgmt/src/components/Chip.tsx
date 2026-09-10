import type { ProductStatus } from '../types';
import { cn } from '../lib';

interface Meta {
  label: string;
  cls: string;
}

const STATUS: Record<ProductStatus, Meta> = {
  running: { label: '运行中', cls: 'text-ok bg-ok-bg' },
  maintenance: { label: '维护中', cls: 'text-warn bg-warn-bg' },
  error: { label: '异常', cls: 'text-err bg-err-bg' },
  disabled: { label: '停用', cls: 'text-mute bg-mute-bg' },
};

export function StatusChip({ status }: { status: ProductStatus }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-[3px] px-2 text-[11px] font-medium whitespace-nowrap',
        s.cls,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {s.label}
    </span>
  );
}
