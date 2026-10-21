'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';

type MobileMenuSheetProps = {
  onClosed: () => void;
  onRegisterClose?: (requestClose: () => void) => void;
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function MobileMenuSheet({
  onClosed,
  onRegisterClose,
  header,
  children,
  footer,
}: MobileMenuSheetProps) {
  const [visible, setVisible] = React.useState(false);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const closingRef = React.useRef(false);

  const finishClose = React.useCallback(() => {
    closingRef.current = false;
    onClosed();
  }, [onClosed]);

  const requestClose = React.useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    setVisible(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishClose();
    }
  }, [finishClose]);

  React.useEffect(() => {
    onRegisterClose?.(requestClose);
    return () => onRegisterClose?.(() => {});
  }, [onRegisterClose, requestClose]);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  React.useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) {
      return;
    }
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== sheet || event.propertyName !== 'transform') {
        return;
      }
      if (!visible && closingRef.current) {
        finishClose();
      }
    };
    sheet.addEventListener('transitionend', onTransitionEnd);
    return () => sheet.removeEventListener('transitionend', onTransitionEnd);
  }, [visible, finishClose]);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  React.useEffect(() => {
    if (!visible) {
      return;
    }
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, requestClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out motion-reduce:transition-none',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Close menu"
        tabIndex={-1}
        onClick={requestClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'fixed inset-0 flex max-h-[100dvh] flex-col bg-[var(--background)] shadow-xl',
          'transform transition-transform duration-300 ease-out motion-reduce:transition-none',
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex shrink-0 flex-col border-b border-[var(--border)] pt-[env(safe-area-inset-top)]">
          <div className="flex justify-center pt-2 pb-1">
            <span className="h-1 w-10 rounded-full bg-[var(--border)]" aria-hidden />
          </div>
          <div className="flex min-h-14 items-center gap-2 px-3 pb-2">
            <div className="min-w-0 flex-1">{header}</div>
            <button
              ref={closeButtonRef}
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] hover:bg-[var(--muted)]"
              aria-label="Close menu"
              onClick={requestClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer ? (
            <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
