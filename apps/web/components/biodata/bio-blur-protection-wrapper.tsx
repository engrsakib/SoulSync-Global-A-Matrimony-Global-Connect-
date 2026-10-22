'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';

type BioBlurProtectionWrapperProps = {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
  /** Screenshot / print / screen-capture deterrent from parent */
  combinedObscured?: boolean;
};

/** Applies capture deterrent blur styling around biodata content (no focus/mouse blur). */
export const BioBlurProtectionWrapper = React.forwardRef<
  HTMLDivElement,
  BioBlurProtectionWrapperProps
>(function BioBlurProtectionWrapper(
  { children, enabled = true, className, combinedObscured = false },
  ref,
) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'bio-protected-content relative',
        className,
        combinedObscured && 'bio-deterrent-obscured',
      )}
    >
      {combinedObscured ? (
        <div className="bio-deterrent-overlay" aria-hidden data-bio-react-overlay />
      ) : null}
      <div
        className={cn(
          combinedObscured && 'pointer-events-none transition-all duration-300 select-none',
        )}
      >
        {children}
      </div>
    </div>
  );
});
