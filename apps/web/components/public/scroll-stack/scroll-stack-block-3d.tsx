'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { BLOCK_FRONT_PX, BLOCK_TOP_PX } from './scroll-stack.constants';
import type { ScrollStackLayer } from './scroll-stack.types';

function GlassIconTile({ Icon, className }: { Icon: LucideIcon; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-[10px]',
        'bg-white/18 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] ring-1 ring-white/30 backdrop-blur-[3px]',
        className,
      )}
    >
      <Icon className="h-4 w-4 text-white/95" aria-hidden />
    </div>
  );
}

function LayerTopFaceIcons({ Icon, isActive, ghost }: { Icon?: LucideIcon; isActive: boolean; ghost?: boolean }) {
  if (!Icon) {
    return null;
  }

  if (ghost) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2.5 p-3.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-[10px] bg-white/12 ring-1 ring-white/20"
          >
            <Icon className="h-4 w-4 text-slate-400/80" aria-hidden />
          </div>
        ))}
      </div>
    );
  }

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center p-3.5">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2.5 p-3.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-center">
            <GlassIconTile Icon={Icon} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FrontFaceLabel({
  label,
  isActive,
  ghost,
}: {
  label: string;
  isActive: boolean;
  ghost?: boolean;
}) {
  if (ghost) {
    return (
      <div
        className="flex w-full items-center px-4"
        style={{ height: BLOCK_FRONT_PX * 0.85 }}
      >
        <span className="max-w-[55%] truncate text-[10px] font-bold tracking-[0.12em] text-slate-400/50 uppercase">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 px-4" style={{ height: BLOCK_FRONT_PX }}>
      <span
        className={cn(
          'max-w-[58%] text-left font-bold uppercase',
          isActive
            ? 'line-clamp-2 text-[11px] leading-tight tracking-[0.14em] text-white sm:text-xs'
            : 'truncate text-[10px] tracking-[0.12em] text-slate-600 dark:text-[var(--foreground)]/72 sm:text-[11px]',
        )}
      >
        {label}
      </span>
      <span className="min-w-[38%] shrink-0" aria-hidden />
    </div>
  );
}

export type ScrollStackBlock3DProps = {
  layer: ScrollStackLayer;
  isActive: boolean;
  Icon?: LucideIcon;
  iconNode?: ReactNode;
  ghost?: boolean;
  /** 0 = top active tier; higher = deeper in stack (for tier shadows). */
  tierFromTop?: number;
};

export function ScrollStackBlock3D({
  layer,
  isActive,
  Icon,
  iconNode,
  ghost = false,
  tierFromTop = 0,
}: ScrollStackBlock3DProps) {
  const inactiveTierShadow =
    tierFromTop <= 1
      ? 'drop-shadow-[0_10px_18px_-8px_rgba(15,23,42,0.22)]'
      : tierFromTop <= 3
        ? 'drop-shadow-[0_8px_14px_-8px_rgba(15,23,42,0.18)]'
        : 'drop-shadow-[0_6px_12px_-8px_rgba(15,23,42,0.14)]';

  return (
    <div
      className={cn(
        'relative w-full transform-gpu',
        ghost && 'pointer-events-none opacity-[0.16]',
        !ghost && isActive && 'drop-shadow-[0_22px_28px_-12px_rgba(109,40,217,0.42)]',
        !ghost && !isActive && inactiveTierShadow,
      )}
      data-active={!ghost && isActive ? 'true' : undefined}
    >
      {!ghost ? (
        <div
          className="pointer-events-none absolute right-3 -bottom-1 left-3 h-1.5 rounded-[100%] bg-slate-900/10 blur-sm"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          'relative z-[1] overflow-hidden rounded-2xl border',
          ghost && 'border-white/35 bg-white/55 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.2)]',
          !ghost && isActive &&
            'border-purple-400/45 shadow-[0_2px_0_0_rgba(255,255,255,0.4)_inset,0_1px_0_0_rgba(255,255,255,0.15)]',
          !ghost && !isActive &&
            'border-slate-200/90 bg-[#f5f6f8] shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_10px_20px_-12px_rgba(15,23,42,0.28)] dark:border-[var(--border)] dark:bg-[var(--card)]',
        )}
      >
        <div
          className={cn(
            'relative flex shrink-0 items-stretch overflow-hidden',
            ghost && 'bg-white/60',
            !ghost && isActive && 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-800',
            !ghost && !isActive &&
              'bg-gradient-to-b from-[#fafafa] to-[#eceff3] dark:from-[var(--card)] dark:to-[var(--muted)]',
          )}
          style={{ height: ghost ? BLOCK_TOP_PX * 0.9 : BLOCK_TOP_PX }}
        >
          {!ghost && isActive ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" aria-hidden />
          ) : null}
          {!ghost && !isActive ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/90" aria-hidden />
          ) : null}
          {iconNode ?? <LayerTopFaceIcons Icon={Icon} isActive={isActive} ghost={ghost} />}
          {!ghost ? (
            <div
              className={cn(
                'pointer-events-none absolute top-0 right-0 bottom-0 w-4 border-l',
                isActive
                  ? 'border-purple-950/35 bg-purple-950/30'
                  : 'border-slate-300/80 bg-slate-400/10 dark:border-[var(--border)] dark:bg-[var(--foreground)]/[0.05]',
              )}
              aria-hidden
            />
          ) : null}
        </div>

        <div
          className={cn(
            'shrink-0 border-t',
            ghost && 'border-white/40 bg-white/45',
            !ghost && isActive &&
              'border-purple-900/55 bg-gradient-to-r from-purple-950 via-violet-950 to-purple-900',
            !ghost && !isActive &&
              'border-slate-200/90 bg-[#e8ebf0] shadow-[inset_0_3px_6px_-3px_rgba(15,23,42,0.12)] dark:border-[var(--border)] dark:bg-[var(--muted)]/60',
          )}
        >
          <FrontFaceLabel label={layer.stackLabel} isActive={isActive} ghost={ghost} />
        </div>
      </div>
    </div>
  );
}
