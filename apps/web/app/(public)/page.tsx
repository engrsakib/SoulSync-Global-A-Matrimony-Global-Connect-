import { ActiveCommunitiesSection } from '@/components/active-communities-section';
import { BiodataStatsSection } from '@/components/biodata-stats-section';
import { ContactFeatureSection } from '@/components/contact-feature-section';
import { FaqSection } from '@/components/faq-section';
import { FounderAboutSection } from '@/components/founder-about-section';
import { HeroCarousel } from '@/components/hero-carousel';
import { getTenants } from '@/lib/api';
import { getPlatformBiodataStats } from '@/lib/platform-stats';

export default async function HomePage() {
  const [tenants, stats] = await Promise.all([
    getTenants().catch(() => []),
    getPlatformBiodataStats(),
  ]);

  return (
    <main className="min-h-screen">
      <HeroCarousel />

      <ActiveCommunitiesSection tenants={tenants} />

      <BiodataStatsSection stats={stats} />

      <FounderAboutSection />

      <FaqSection />

      <ContactFeatureSection />
    </main>
  );
}
