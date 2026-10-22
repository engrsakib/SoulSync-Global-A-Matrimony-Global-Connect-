'use client';

import * as React from 'react';
import '@/styles/bio-protection.css';
import type { ViewerTraceContext } from '@/lib/viewer-trace-server';
import { useCaptureDeterrent } from '@/lib/use-capture-deterrent';
import { BioBlurProtectionWrapper } from '@/components/biodata/bio-blur-protection-wrapper';
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
};

export function BioProtectionWrapper({ trace, children }: BioProtectionWrapperProps) {
  const enabled = isBioProtectionEnabled();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const captureSuspected = useCaptureDeterrent(enabled, contentRef);

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
      <BioTraceWatermark trace={trace} active={captureSuspected} />
      <div className="bio-print-blocked">Printing is disabled for member biodata.</div>
      <BioBlurProtectionWrapper
        ref={contentRef}
        enabled={enabled}
        combinedObscured={captureSuspected}
      >
        {children}
      </BioBlurProtectionWrapper>
    </div>
  );
}
