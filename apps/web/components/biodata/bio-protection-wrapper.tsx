'use client';

import * as React from 'react';
import '@/styles/bio-protection.css';
import { cn } from '@soulsync/ui/lib/utils';
import type { ViewerTraceContext } from '@/lib/viewer-trace-server';
import { useCaptureDeterrent } from '@/lib/use-capture-deterrent';
import { BioTraceWatermark } from '@/components/biodata/bio-trace-watermark';

function isBioProtectionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BIO_PROTECTION !== '0';
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

type BioProtectionWrapperProps = {
  trace: ViewerTraceContext;
  children: React.ReactNode;
  detectDevTools?: boolean;
};

export function BioProtectionWrapper({
  trace,
  children,
  detectDevTools = true,
}: BioProtectionWrapperProps) {
  const enabled = isBioProtectionEnabled();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [devtoolsOpen, setDevtoolsOpen] = React.useState(false);
  const captureSuspected = useCaptureDeterrent(enabled);
  const deterrentActive = captureSuspected || (detectDevTools && devtoolsOpen);

  React.useEffect(() => {
    if (!enabled || !detectDevTools) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        const widthGap = window.outerWidth - window.innerWidth;
        const heightGap = window.outerHeight - window.innerHeight;
        setDevtoolsOpen(widthGap > 160 || heightGap > 160);
      }, 300);
    };
    check();
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('resize', check);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [enabled, detectDevTools]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) {
      return;
    }

    const blockEvent = (event: Event) => {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      if (key === 'f12') {
        event.preventDefault();
        return;
      }
      if (!ctrl) {
        return;
      }
      if (event.shiftKey && (key === 'i' || key === 'j')) {
        event.preventDefault();
        return;
      }
      if (key === 'u' || key === 's' || key === 'p' || key === 'c') {
        event.preventDefault();
      }
    };

    root.addEventListener('contextmenu', blockEvent, true);
    root.addEventListener('copy', blockEvent, true);
    root.addEventListener('cut', blockEvent, true);
    root.addEventListener('paste', blockEvent, true);
    root.addEventListener('dragstart', blockEvent, true);
    root.addEventListener('selectstart', blockEvent, true);
    root.addEventListener('keydown', onKeyDown, true);

    return () => {
      root.removeEventListener('contextmenu', blockEvent, true);
      root.removeEventListener('copy', blockEvent, true);
      root.removeEventListener('cut', blockEvent, true);
      root.removeEventListener('paste', blockEvent, true);
      root.removeEventListener('dragstart', blockEvent, true);
      root.removeEventListener('selectstart', blockEvent, true);
      root.removeEventListener('keydown', onKeyDown, true);
    };
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div ref={rootRef} className="bio-protected-root relative">
      <BioTraceWatermark trace={trace} active={deterrentActive} />
      <div className="bio-print-blocked">Printing is disabled for member biodata.</div>
      <div
        className={cn(
          'bio-protected-content relative',
          deterrentActive && 'bio-deterrent-obscured',
        )}
      >
        {deterrentActive ? <div className="bio-deterrent-overlay" aria-hidden /> : null}
        {children}
      </div>
    </div>
  );
}
