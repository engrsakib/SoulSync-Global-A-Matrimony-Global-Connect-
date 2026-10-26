'use client';

import { PublicFeatureCard } from '@/components/public/public-feature-card';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { SCROLL_STACK_HIGHLIGHT_TONE_CLASS } from './scroll-stack-highlight-styles';
import { ScrollStackMobileDeck } from './scroll-stack-mobile-deck';
import { resolveScrollStackLayerIcon } from './scroll-stack-layer-icons';
import { useIsLargeViewport } from './scroll-stack-use-viewport';
import type { ScrollStackFeatureProps } from './scroll-stack.types';

function ScrollStackFallbackGrid({
  layers,
  layerIconSet,
}: Pick<ScrollStackFeatureProps, 'layers' | 'layerIconSet'>) {
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {layers.map((layer) => {
        const Icon = resolveScrollStackLayerIcon(layerIconSet, layer.id);
        const highlightFooter =
          layer.highlights && layer.highlights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {layer.highlights.map((pill) => {
                const toneClass =
                  SCROLL_STACK_HIGHLIGHT_TONE_CLASS[pill.tone ?? 'brand'];
                return (
                  <li key={pill.id}>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneClass}`}
                    >
                      {pill.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : undefined;

        return (
          <li key={layer.id}>
            <PublicFeatureCard
              title={layer.title}
              icon={Icon ?? undefined}
              footer={highlightFooter}
            >
              {layer.body}
            </PublicFeatureCard>
          </li>
        );
      })}
    </ul>
  );
}

export function ScrollStackFallback({
  badge,
  title,
  description,
  layers,
  layerIconSet,
  omitHeader = false,
}: ScrollStackFeatureProps & { omitHeader?: boolean }) {
  const isLarge = useIsLargeViewport();

  if (layers.length === 0) {
    return null;
  }

  /** Below `lg`, or scroll disabled on large viewports only when reduced motion (grid). */
  const useMobileDeck = !isLarge;

  return (
    <div className={omitHeader ? '' : 'space-y-10 md:space-y-14'}>
      {omitHeader ? null : (
        <PublicSectionHeader
          badge={badge}
          title={title}
          description={description}
          titleGradient
          align="left"
        />
      )}
      {useMobileDeck ? (
        <ScrollStackMobileDeck layers={layers} layerIconSet={layerIconSet} />
      ) : (
        <ScrollStackFallbackGrid layers={layers} layerIconSet={layerIconSet} />
      )}
    </div>
  );
}
