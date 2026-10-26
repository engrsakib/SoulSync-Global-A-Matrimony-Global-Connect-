'use client';

import { cn } from '@soulsync/ui/lib/utils';
import { SCROLL_STACK_HIGHLIGHT_TONE_CLASS } from './scroll-stack-highlight-styles';
import type { ScrollStackLayer } from './scroll-stack.types';

type ScrollStackFeatureRailProps = {
  layers: ScrollStackLayer[];
  activeIndex: number;
  onStepSelect?: (index: number) => void;
  onStepHover?: (index: number) => void;
  className?: string;
};

export function ScrollStackFeatureRail({
  layers,
  activeIndex,
  onStepSelect,
  onStepHover,
  className,
}: ScrollStackFeatureRailProps) {
  if (layers.length === 0) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Feature steps"
      className={cn('space-y-8 overflow-visible', className)}
    >
      {layers.map((layer, index) => {
        const isActive = index === activeIndex;
        const interactive = Boolean(onStepSelect);

        return (
          <div key={layer.id} className="relative overflow-visible">
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={!interactive}
              onClick={() => onStepSelect?.(index)}
              onPointerEnter={() => onStepHover?.(index)}
              className={cn(
                'group w-full text-left outline-none',
                interactive ? 'cursor-pointer' : 'cursor-default',
                'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
              )}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <span
                  className={cn(
                    'mt-1.5 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none',
                    isActive
                      ? 'h-2.5 w-2.5 bg-[var(--primary)] shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_22%,transparent)]'
                      : 'h-2.5 w-2.5 border-2 border-[var(--border)] bg-transparent group-hover:border-[var(--color-brand-500)]/45',
                  )}
                  aria-hidden
                />

                <div className="min-w-0 flex-1 space-y-3">
                  <p
                    className={cn(
                      'text-base leading-snug transition-colors sm:text-lg',
                      isActive
                        ? 'font-semibold text-[var(--foreground)]'
                        : 'font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]/80',
                    )}
                  >
                    {layer.title}
                  </p>

                  {isActive ? (
                    <div
                      aria-live="polite"
                      className={cn(
                        'space-y-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200',
                        'motion-reduce:animate-none',
                      )}
                    >
                      <p className="text-base leading-relaxed text-[var(--foreground)]/88 sm:text-lg sm:leading-relaxed">
                        {layer.body}
                      </p>

                      {layer.highlights && layer.highlights.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {layer.highlights.map((pill) => (
                            <li key={pill.id}>
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                                  SCROLL_STACK_HIGHLIGHT_TONE_CLASS[pill.tone ?? 'brand'],
                                )}
                              >
                                {pill.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </button>

            {isActive ? (
              <div
                className="pointer-events-none mt-3 hidden pl-[calc(0.625rem+1rem)] lg:block lg:pl-[calc(0.625rem+1.25rem)]"
                aria-hidden
              >
                <div className="flex items-center">
                  <div className="h-px flex-1 bg-[var(--primary)]/75" />
                  <span className="ml-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
