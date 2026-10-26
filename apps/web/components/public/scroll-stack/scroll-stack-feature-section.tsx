import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { ScrollStackFeatureClient } from './scroll-stack-feature-client';
import type { ScrollStackFeatureProps } from './scroll-stack.types';

export function ScrollStackFeatureSection({ borderTop = false, ...props }: ScrollStackFeatureProps) {
  return (
    <PublicSectionShell
      borderTop={borderTop}
      className="bg-[var(--muted)]/30"
      background={<PublicBokehBackground variant="faq" />}
      innerClassName="max-w-none lg:w-full lg:max-w-[80rem]"
    >
      <ScrollStackFeatureClient {...props} />
    </PublicSectionShell>
  );
}
