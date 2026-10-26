'use client';

import { PublicSectionHeader } from '@/components/public/public-section-header';
import { ScrollStackFeatureRail } from './scroll-stack-feature-rail';
import { ScrollStackStepIndicator } from './scroll-stack-step-indicator';
import type { ScrollStackLayer } from './scroll-stack.types';

type ScrollStackContentPanelProps = {
  badge: string;
  sectionTitle: string;
  sectionDescription?: string;
  layers: ScrollStackLayer[];
  showSectionIntro?: boolean;
  titleGradient?: boolean;
  activeIndex?: number;
  onStepSelect?: (index: number) => void;
  onStepHover?: (index: number) => void;
};

/** Left column: section intro + vertical feature rail (Marqeta-style) + step indicator. */
export function ScrollStackContentPanel({
  badge,
  sectionTitle,
  sectionDescription,
  layers,
  showSectionIntro = true,
  titleGradient = true,
  activeIndex = 0,
  onStepSelect,
  onStepHover,
}: ScrollStackContentPanelProps) {
  return (
    <div className="flex min-h-0 flex-col justify-center space-y-8 lg:max-w-xl lg:pr-6">
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

      <ScrollStackFeatureRail
        layers={layers}
        activeIndex={activeIndex}
        onStepSelect={onStepSelect}
        onStepHover={onStepHover}
      />

      <ScrollStackStepIndicator
        activeIndex={activeIndex}
        total={layers.length}
        onStepSelect={onStepSelect}
      />
    </div>
  );
}
