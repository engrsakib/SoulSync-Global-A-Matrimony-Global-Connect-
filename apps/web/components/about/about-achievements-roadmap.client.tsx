'use client';

import type { AboutPageMilestoneItemDto } from '@soulsync/shared-types/about-page';
import { useRef } from 'react';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { MilestoneRoadmap } from '@/components/about/milestone-roadmap';

type AboutAchievementsRoadmapClientProps = {
  badge: string;
  title: string;
  description?: string;
  items: AboutPageMilestoneItemDto[];
};

export function AboutAchievementsRoadmapClient({
  badge,
  title,
  description,
  items,
}: AboutAchievementsRoadmapClientProps) {
  const scrollScopeRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollScopeRef} className="space-y-10 md:space-y-12">
      <PublicSectionHeader badge={badge} title={title} description={description} />
      <MilestoneRoadmap items={items} scrollScopeRef={scrollScopeRef} />
    </div>
  );
}
