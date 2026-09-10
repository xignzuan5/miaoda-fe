import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib';

export function Overlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return <div className="fixed inset-0 z-40 bg-overlay-scrim" onClick={onClose} />;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'w-[400px]',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <Overlay onClose={onClose} />
      <div
        className={cn(
          'relative flex max-h-[80vh] flex-col rounded-[4px] border border-line-default bg-surface-elevated',
          'shadow-overlay',
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
          <h2 className="text-[13px] font-semibold text-ink-primary">{title}</h2>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line-subtle px-4 py-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
