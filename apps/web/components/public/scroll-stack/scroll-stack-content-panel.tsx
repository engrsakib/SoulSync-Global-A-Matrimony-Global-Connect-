'use client';

import { PublicSectionHeader } from '@/components/public/public-section-header';
import { cn } from '@soulsync/ui/lib/utils';
import { ScrollStackStepIndicator } from './scroll-stack-step-indicator';
import type { ScrollStackHighlight, ScrollStackLayer } from './scroll-stack.types';

const HIGHLIGHT_TONE_CLASS: Record<NonNullable<ScrollStackHighlight['tone']>, string> = {
  brand:
    'border-[var(--color-brand-500)]/35 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]',
  accent:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  muted: 'border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)]',
};

type ScrollStackContentPanelProps = {
  badge: string;
  sectionTitle: string;
  sectionDescription?: string;
  layer: ScrollStackLayer;
  showSectionIntro?: boolean;
  titleGradient?: boolean;
  activeIndex?: number;
  totalLayers?: number;
  onStepSelect?: (index: number) => void;
};

/** Left column: section intro + large body copy only (value titles render on 3D stack). */
export function ScrollStackContentPanel({
  badge,
  sectionTitle,
  sectionDescription,
  layer,
  showSectionIntro = true,
  titleGradient = true,
  activeIndex = 0,
  totalLayers = 1,
  onStepSelect,
}: ScrollStackContentPanelProps) {
  return (
    <div className="flex min-h-0 flex-col justify-center space-y-10 lg:max-w-xl lg:pr-6">
      {showSectionIntro ? (
        <PublicSectionHeader
          align="left"
          badge={badge}
          title={sectionTitle}
          description={sectionDescription}
          titleGradient={titleGradient}
          className="space-y-3"
        />
      ) : null}

      <div
        key={layer.id}
        aria-live="polite"
        className={cn(
          'space-y-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300',
          'motion-reduce:animate-none',
        )}
      >
        <h3 className="sr-only">{layer.title}</h3>
        <p className="text-lg font-medium leading-[1.65] text-[var(--foreground)]/90 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-relaxed">
          {layer.body}
        </p>

        {layer.highlights && layer.highlights.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {layer.highlights.map((pill) => (
              <li key={pill.id}>
                <span
                  className={cn(
                    'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                    HIGHLIGHT_TONE_CLASS[pill.tone ?? 'brand'],
                  )}
                >
                  {pill.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <ScrollStackStepIndicator
          activeIndex={activeIndex}
          total={totalLayers}
          onStepSelect={onStepSelect}
        />
      </div>
    </div>
  );
}
