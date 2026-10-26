import type { AboutPageAchievementsSectionDto } from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { AboutAchievementsRoadmapClient } from '@/components/about/about-achievements-roadmap.client';

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
      className="bg-[var(--muted)]/20"
      background={<PublicBokehBackground variant="faq" />}
      innerClassName="max-w-[80rem] lg:w-[80%]"
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
