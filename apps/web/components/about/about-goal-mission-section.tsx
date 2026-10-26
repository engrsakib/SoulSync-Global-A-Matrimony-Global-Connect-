import { Target, Compass } from 'lucide-react';
import type { AboutPageTextBlockDto } from '@soulsync/shared-types/about-page';
import { AboutSectionFrame } from '@/components/about/about-section-frame';
import { PublicFeatureCard } from '@/components/public/public-feature-card';

type AboutGoalMissionSectionProps = {
  goal: AboutPageTextBlockDto;
  mission: AboutPageTextBlockDto;
};

export function AboutGoalMissionSection({ goal, mission }: AboutGoalMissionSectionProps) {
  return (
    <AboutSectionFrame
      borderTop={false}
      badge="Purpose"
      title="What drives SoulSync Global"
      description="Our goal and mission keep product decisions aligned with members, guardians, and community leaders."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <PublicFeatureCard title={goal.title} icon={Target}>
          {goal.body}
        </PublicFeatureCard>
        <PublicFeatureCard title={mission.title} icon={Compass}>
          {mission.body}
        </PublicFeatureCard>
      </div>
    </AboutSectionFrame>
  );
}
