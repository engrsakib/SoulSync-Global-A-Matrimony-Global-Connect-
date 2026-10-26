'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import type { ScrollStackLayer } from './scroll-stack.types';

const TOP_H = 'h-[3.5rem] sm:h-[3.75rem]';
const FRONT_MIN = 'min-h-[3rem] sm:min-h-[3.25rem]';

function LayerTopFaceIcons({ Icon, isActive, ghost }: { Icon?: LucideIcon; isActive: boolean; ghost?: boolean }) {
  if (!Icon || ghost) {
    if (ghost && Icon) {
      return (
        <div className="flex h-full w-full items-center justify-center opacity-50">
          <Icon className="h-6 w-6 text-[var(--muted-foreground)]" aria-hidden />
        </div>
      );
    }
    return null;
  }

  if (!isActive) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Icon className="h-7 w-7 text-[var(--foreground)]/[0.12]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-2.5 opacity-20">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" aria-hidden />
          </div>
        ))}
      </div>
      <Icon className="relative h-9 w-9 text-white drop-shadow-sm" aria-hidden />
    </div>
  );
}

export type ScrollStackBlock3DProps = {
  layer: ScrollStackLayer;
  isActive: boolean;
  Icon?: LucideIcon;
  iconNode?: ReactNode;
  ghost?: boolean;
};

export function ScrollStackBlock3D({
  layer,
  isActive,
  Icon,
  iconNode,
  ghost = false,
}: ScrollStackBlock3DProps) {
  return (
    <div
      className={cn(
        'relative w-full transform-gpu',
        ghost && 'pointer-events-none opacity-[0.22]',
        !ghost && isActive && 'drop-shadow-2xl',
        !ghost && !isActive && 'drop-shadow-md',
      )}
      data-active={!ghost && isActive ? 'true' : undefined}
    >
      {/* Side extrusion (depth under isometric scene) */}
      {!ghost ? (
        <div
          className={cn(
            'pointer-events-none absolute -bottom-1 -left-2 z-0 w-[calc(100%+0.5rem)] rounded-sm',
            TOP_H,
            FRONT_MIN,
            'origin-bottom-left -skew-y-[7deg]',
            isActive ? 'bg-[var(--foreground)]/18' : 'bg-[var(--foreground)]/10',
          )}
          style={{ height: 'calc(100% + 4px)' }}
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          'relative z-[1] overflow-hidden rounded-lg border',
          ghost && 'border-[var(--border)]/40',
          !ghost && isActive && 'border-[var(--color-brand-400)]/55 ring-1 ring-[var(--color-brand-500)]/30',
          !ghost && !isActive && 'border-[var(--border)] bg-[var(--card)]',
        )}
      >
        {/* Top slab */}
        <div
          className={cn(
            'relative flex items-stretch overflow-hidden',
            TOP_H,
            ghost && 'bg-[var(--muted)]/25',
            !ghost && isActive &&
              'bg-gradient-to-br from-[var(--color-brand-500)] via-[var(--color-brand-600)] to-violet-700',
            !ghost && !isActive &&
              'bg-gradient-to-b from-[var(--muted)] to-[var(--muted)]/75 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),inset_0_-8px_16px_-8px_rgba(0,0,0,0.08)]',
          )}
        >
          {!ghost && isActive ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25"
              aria-hidden
            />
          ) : null}
          {!ghost && !isActive ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-[var(--foreground)]/[0.06]"
              aria-hidden
            />
          ) : null}
          {iconNode ?? <LayerTopFaceIcons Icon={Icon} isActive={isActive} ghost={ghost} />}
        </div>

        {/* Front slab — title */}
        <div
          className={cn(
            'flex items-center border-t px-4 py-2.5',
            FRONT_MIN,
            ghost && 'border-[var(--border)]/30 bg-[var(--muted)]/15',
            !ghost && isActive && 'border-[var(--color-brand-800)]/45 bg-[var(--color-brand-950)]/95',
            !ghost && !isActive && 'border-[var(--border)] bg-[var(--muted)]/40',
          )}
        >
          <span
            className={cn(
              'line-clamp-2 text-left text-[11px] font-bold tracking-[0.12em] uppercase sm:text-xs',
              ghost && 'text-[var(--muted-foreground)]',
              !ghost && isActive && 'text-white',
              !ghost && !isActive && 'text-[var(--foreground)]/80',
            )}
          >
            {layer.stackLabel}
          </span>
        </div>

        {/* Right depth edge */}
        {!ghost ? (
          <div
            className={cn(
              'pointer-events-none absolute top-0 right-0 bottom-0 w-2 bg-gradient-to-l from-[var(--foreground)]/14 to-transparent',
            )}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
