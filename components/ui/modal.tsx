'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useHydrated } from '@/hooks/use-hydrated';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * 轻量 Modal：createPortal + Esc 关闭 + 遮罩点击关闭 + body 滚动锁 + 焦点回收。
 * 只有 open 且完成水合后才挂载面板，避免 SSR 期间访问 document。
 */
export function Modal({ open, ...panelProps }: ModalProps) {
  const hydrated = useHydrated();

  if (!open || !hydrated) return null;

  return createPortal(<ModalPanel {...panelProps} />, document.body);
}

function ModalPanel({ onClose, title, description, className, footer, children }: Omit<ModalProps, 'open'>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // 始终持有最新的 onClose，避免父组件重渲染导致 effect 反复重建、焦点被抢
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = window.requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current;
      target?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'animate-modal-in w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60 focus:outline-none',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-base font-semibold text-slate-100">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-xs text-slate-400">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="关闭弹窗"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="px-5 py-4">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-3.5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
