'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import type { ViewerTraceContext } from '@/lib/viewer-trace-server';

type BioTraceWatermarkProps = {
  trace: ViewerTraceContext;
  active: boolean;
};

export function BioTraceWatermark({ trace, active }: BioTraceWatermarkProps) {
  const patternId = React.useId().replace(/:/g, '');
  const label = `SoulSync · ${trace.viewerUserIdShort} · ${trace.maskedIp} · ${trace.serverTimestampIso}`;

  return (
    <div
      className={cn(
        'bio-trace-watermark pointer-events-none fixed inset-0 z-[30] overflow-hidden',
        active && 'bio-trace-watermark--active',
      )}
      aria-hidden
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="320"
            height="160"
            patternTransform="rotate(-24)"
          >
            <text
              x="0"
              y="48"
              fill="currentColor"
              className="text-[10px] font-medium text-[var(--color-brand-800)]"
            >
              {label}
            </text>
            <text
              x="0"
              y="112"
              fill="currentColor"
              className="text-[10px] font-medium text-[var(--color-brand-800)]"
            >
              {label}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
