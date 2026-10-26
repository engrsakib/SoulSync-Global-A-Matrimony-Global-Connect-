'use client';

import { cn } from '@soulsync/ui/lib/utils';

type ScrollStackStepIndicatorProps = {
  activeIndex: number;
  total: number;
  onStepSelect?: (index: number) => void;
  className?: string;
};

export function ScrollStackStepIndicator({
  activeIndex,
  total,
  onStepSelect,
  className,
}: ScrollStackStepIndicatorProps) {
  if (total <= 1) {
    return null;
  }

  const stepLabel = String(activeIndex + 1).padStart(2, '0');
  const totalLabel = String(total).padStart(2, '0');

  return (
    <div className={cn('flex flex-wrap items-center gap-4 pt-2', className)}>
      <p
        className="text-sm font-semibold tabular-nums tracking-wide text-[var(--muted-foreground)]"
        aria-live="polite"
      >
        <span className="text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]">
          {stepLabel}
        </span>
        <span className="mx-1.5 text-[var(--border)]">/</span>
        <span>{totalLabel}</span>
      </p>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Core values">
        {Array.from({ length: total }, (_, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Value ${index + 1} of ${total}`}
              disabled={!onStepSelect}
              onClick={() => onStepSelect?.(index)}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300 motion-reduce:transition-none',
                onStepSelect ? 'cursor-pointer' : 'cursor-default',
                isActive
                  ? 'w-8 bg-[var(--color-brand-600)]'
                  : 'w-2.5 bg-[var(--color-brand-500)]/25 hover:bg-[var(--color-brand-500)]/45',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
