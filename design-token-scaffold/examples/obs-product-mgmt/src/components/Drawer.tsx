import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './icons';

export function Drawer({
  open,
  onClose,
  title,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-overlay-scrim" onClick={onClose} />
      <aside className="absolute top-0 right-0 flex h-full w-[480px] flex-col border-l border-line-subtle bg-surface-default">
        <header className="flex shrink-0 items-center justify-between border-b border-line-subtle px-2 py-1.5">
          <h2 className="text-[14px] font-semibold text-ink-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex size-7 items-center justify-center rounded-[4px] text-ink-secondary hover:bg-surface-hover hover:text-ink-primary"
          >
            <IconClose />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-2 py-2">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line-subtle px-2 py-2">
            {footer}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
