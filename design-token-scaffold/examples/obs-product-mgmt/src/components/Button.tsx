import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib';

type Variant = 'primary' | 'outlined' | 'ghost' | 'danger' | 'dangerFill';

const styles: Record<Variant, string> = {
  primary:
    'bg-action-default text-ink-inverse hover:bg-action-hover active:bg-action-hover',
  outlined:
    'border border-line-default text-ink-primary hover:bg-surface-hover hover:border-line-strong',
  ghost:
    'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover border border-transparent',
  danger: 'text-err border border-line-default hover:border-err/60 hover:bg-err/10',
  dangerFill: 'bg-err text-ink-primary hover:bg-err/85',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({ variant = 'outlined', icon, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-[30px] min-w-0 items-center justify-center gap-1.5 rounded-[4px]',
        'px-3 text-[13px] font-medium leading-none transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-action-default/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
