import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../lib';
import { IconChevron, IconSearch } from './icons';

const control =
  'h-8 w-full rounded-[4px] border border-line-default bg-surface-default px-[10px] py-[6px] text-[13px] ' +
  'text-ink-primary placeholder:text-ink-disabled transition-colors ' +
  'focus:border-action-default focus:outline-none focus:ring-2 focus:ring-action-default/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  search?: boolean;
  inputClassName?: string;
}

export function TextInput({ search, className, inputClassName, ...rest }: TextInputProps) {
  if (search) {
    return (
      <label className={cn('relative block w-full', className)}>
        <IconSearch className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ink-disabled" />
        <input type="text" className={cn(control, 'pr-2 pl-7', inputClassName)} {...rest} />
      </label>
    );
  }
  return <input type="text" className={cn(control, className)} {...rest} />;
}

type Option = string | { value: string; label: string };

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: ReadonlyArray<Option>;
  placeholder?: string;
}

export function Select({ options, placeholder, className, ...rest }: SelectProps) {
  return (
    <label className={cn('relative block w-full', className)}>
      <select
        className={cn(control, 'cursor-pointer appearance-none pr-7')}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const item = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
      <IconChevron className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-ink-secondary" />
    </label>
  );
}

export function Field({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-ink-secondary">
        {label}
        {required && <span className="ml-0.5 text-err">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-err">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-ink-disabled">{hint}</span>
      ) : null}
    </label>
  );
}
