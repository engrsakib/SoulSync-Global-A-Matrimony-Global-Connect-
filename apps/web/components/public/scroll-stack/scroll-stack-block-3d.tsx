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
        'bg-[var(--stack-active-glass-bg)] shadow-[inset_0_1px_0_0_var(--stack-active-glass-highlight)] ring-1 ring-[var(--stack-active-glass-ring)] backdrop-blur-[3px]',
        className,
      )}
    >
      <Icon className="h-4 w-4 text-[var(--stack-active-icon)]" aria-hidden />
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
            className="flex items-center justify-center rounded-[10px] bg-[color-mix(in_oklch,var(--stack-ghost-icon)_12%,transparent)] ring-1 ring-[var(--stack-ghost-border)]"
          >
            <Icon className="h-4 w-4 text-[var(--stack-ghost-icon)]" aria-hidden />
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
        <span className="max-w-[55%] truncate text-[10px] font-bold tracking-[0.12em] text-[var(--stack-ghost-icon)] uppercase">
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
            ? 'line-clamp-2 text-[11px] leading-tight tracking-[0.14em] text-[var(--primary-foreground)] sm:text-xs'
            : 'truncate text-[10px] tracking-[0.12em] text-[var(--stack-inactive-label)] sm:text-[11px]',
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
      ? 'drop-shadow-[0_10px_18px_-8px_var(--stack-shadow)]'
      : tierFromTop <= 3
        ? 'drop-shadow-[0_8px_14px_-8px_var(--stack-shadow)]'
        : 'drop-shadow-[0_6px_12px_-8px_var(--stack-shadow)]';

  return (
    <div
      className={cn(
        'relative w-full transform-gpu',
        ghost && 'pointer-events-none opacity-[0.16]',
        !ghost && isActive && 'drop-shadow-[0_22px_28px_-12px_var(--stack-active-shadow)]',
        !ghost && !isActive && inactiveTierShadow,
        !ghost &&
          isActive &&
          'motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5',
      )}
      data-active={!ghost && isActive ? 'true' : undefined}
    >
      {!ghost ? (
        <div
          className="pointer-events-none absolute right-3 -bottom-1 left-3 h-1.5 rounded-[100%] bg-[var(--stack-shadow)] blur-sm"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          'relative z-[1] overflow-hidden rounded-2xl border',
          ghost &&
            'border-[var(--stack-ghost-border)] bg-[var(--stack-ghost-surface)] shadow-[0_12px_24px_-16px_var(--stack-shadow)]',
          !ghost &&
            isActive &&
            'border-[var(--stack-active-border)] shadow-[0_2px_0_0_var(--stack-active-glass-highlight)_inset,0_1px_0_0_color-mix(in_oklch,var(--primary-foreground)_15%,transparent)_inset]',
          !ghost &&
            !isActive &&
            'border-[var(--stack-inactive-border)] shadow-[0_1px_0_0_var(--stack-inactive-highlight)_inset,0_10px_20px_-12px_var(--stack-shadow)]',
        )}
      >
        <div
          className={cn(
            'relative flex shrink-0 items-stretch overflow-hidden',
            ghost && 'bg-[var(--stack-ghost-surface)]',
            !ghost &&
              isActive &&
              'bg-gradient-to-br from-[var(--stack-active-top-from)] via-[var(--stack-active-top-via)] to-[var(--stack-active-top-to)]',
            !ghost &&
              !isActive &&
              'bg-gradient-to-b from-[var(--stack-inactive-top-from)] to-[var(--stack-inactive-top-to)]',
          )}
          style={{ height: ghost ? BLOCK_TOP_PX * 0.9 : BLOCK_TOP_PX }}
        >
          {!ghost && isActive ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[color-mix(in_oklch,var(--primary-foreground)_40%,transparent)]"
              aria-hidden
            />
          ) : null}
          {!ghost && !isActive ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--stack-inactive-highlight)]"
              aria-hidden
            />
          ) : null}
          {iconNode ?? <LayerTopFaceIcons Icon={Icon} isActive={isActive} ghost={ghost} />}
          {!ghost ? (
            <div
              className={cn(
                'pointer-events-none absolute top-0 right-0 bottom-0 w-4 border-l',
                isActive
                  ? 'border-[color-mix(in_oklch,var(--stack-active-front)_55%,transparent)] bg-[color-mix(in_oklch,var(--stack-active-front)_30%,transparent)]'
                  : 'border-[var(--stack-inactive-border)] bg-[var(--stack-inactive-lip)]',
              )}
              aria-hidden
            />
          ) : null}
        </div>

        <div
          className={cn(
            'shrink-0 border-t',
            ghost && 'border-[var(--stack-ghost-border)] bg-[color-mix(in_oklch,var(--stack-ghost-surface)_90%,transparent)]',
            !ghost &&
              isActive &&
              'border-[color-mix(in_oklch,var(--stack-active-front)_55%,transparent)] bg-gradient-to-r from-[var(--stack-active-front)] via-[var(--stack-active-front-mid)] to-[var(--stack-active-front)]',
            !ghost &&
              !isActive &&
              'border-[var(--stack-inactive-border)] bg-[var(--stack-inactive-front)] shadow-[inset_0_3px_6px_-3px_var(--stack-shadow)]',
          )}
        >
          <FrontFaceLabel label={layer.stackLabel} isActive={isActive} ghost={ghost} />
        </div>
      </div>
    </div>
  );
}
