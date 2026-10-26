import { CheckCircle2 } from 'lucide-react';
import type { AboutPageTrustPillarDto } from '@soulsync/shared-types/about-page';
import { AboutSectionFrame } from '@/components/about/about-section-frame';
import { PublicFeatureCard } from '@/components/public/public-feature-card';

type AboutTrustSectionProps = {
  pillars: AboutPageTrustPillarDto[];
};

export function AboutTrustSection({ pillars }: AboutTrustSectionProps) {
  return (
    <AboutSectionFrame
      badge="Trust"
      title="How we earn your confidence"
      description="Beyond policy documents—these principles show up in product flows every day."
      shellClassName="pb-16 md:pb-20"
    >
      <div className="grid gap-8 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <PublicFeatureCard key={pillar.id} title={pillar.title} icon={CheckCircle2}>
            {pillar.body}
          </PublicFeatureCard>
        ))}
      </div>
    </AboutSectionFrame>
  );
}
