import type { AboutPageWhatWeDoSectionDto } from '@soulsync/shared-types/about-page';
import { AboutSectionFrame } from '@/components/about/about-section-frame';
import { PublicFeatureCard } from '@/components/public/public-feature-card';
import { whatWeDoIcon } from '@/lib/about-page/section-icons';

type AboutWhatWeDoSectionProps = AboutPageWhatWeDoSectionDto;

export function AboutWhatWeDoSection({ badge, title, description, items }: AboutWhatWeDoSectionProps) {
  return (
    <AboutSectionFrame badge={badge} title={title} description={description}>
      <div className="grid gap-8 md:grid-cols-2">
        {items.map((item) => {
          const Icon = whatWeDoIcon(item.id);
          return (
            <PublicFeatureCard key={item.id} title={item.title} icon={Icon}>
              {item.body}
            </PublicFeatureCard>
          );
        })}
      </div>
    </AboutSectionFrame>
  );
}
