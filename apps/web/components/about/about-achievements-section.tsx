import type { AboutPageAchievementsSectionDto } from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { AboutAchievementsRoadmapClient } from '@/components/about/about-achievements-roadmap.client';
import { marketingSectionInnerClass, marketingSectionSurfaceClass } from '@/lib/marketing-ui-classes';

type AboutAchievementsSectionProps = AboutPageAchievementsSectionDto;

export function AboutAchievementsSection({
  badge,
  title,
  description,
  items,
}: AboutAchievementsSectionProps) {
  return (
    <PublicSectionShell
      borderTop
      className={marketingSectionSurfaceClass}
      background={<PublicBokehBackground variant="faq" />}
      innerClassName={marketingSectionInnerClass}
    >
      <AboutAchievementsRoadmapClient
        badge={badge}
        title={title}
        description={description}
        items={items}
      />
    </PublicSectionShell>
  );
}
