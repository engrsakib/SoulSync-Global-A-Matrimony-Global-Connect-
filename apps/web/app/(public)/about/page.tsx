import type { Metadata } from 'next';
import { AboutAchievementsSection } from '@/components/about/about-achievements-section';
import { AboutCoreValuesSection } from '@/components/about/about-core-values-section';
import { AboutGoalMissionSection } from '@/components/about/about-goal-mission-section';
import { AboutHeroSection } from '@/components/about/about-hero-section';
import { AboutPolicySection } from '@/components/about/about-policy-section';
import { AboutWhatWeDoSection } from '@/components/about/about-what-we-do-section';
import { AboutTeamSection } from '@/components/about/about-team-section';
import { AboutTrustSection } from '@/components/about/about-trust-section';
import { getAboutPageContent } from '@/lib/about-page/get-content';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutPageContent();
  return {
    title: content.seo.title,
    description: content.seo.description,
  };
}

export default async function AboutPage() {
  const content = await getAboutPageContent();

  return (
    <main className="min-h-screen">
      <AboutHeroSection {...content.hero} />
      <AboutGoalMissionSection goal={content.goal} mission={content.mission} />
      <AboutCoreValuesSection {...content.coreValues} />
      <AboutWhatWeDoSection {...content.whatWeDo} />
      <AboutAchievementsSection {...content.achievements} />
      <AboutPolicySection policies={content.policies} />
      <AboutTeamSection founder={content.founder} team={content.team} />
      <AboutTrustSection pillars={content.trustPillars} />
    </main>
  );
}
