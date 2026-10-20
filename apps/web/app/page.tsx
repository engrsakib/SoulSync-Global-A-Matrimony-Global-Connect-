import { ActiveCommunitiesSection } from '@/components/active-communities-section';
import { BiodataStatsSection } from '@/components/biodata-stats-section';
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

      <section
        id="contact"
        className="scroll-mt-20 border-t border-[var(--border)] px-6 py-14"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-[var(--muted-foreground)]">
            Questions about a community or partnership? Reach out at{' '}
            <a className="text-[var(--primary)] underline-offset-4 hover:underline" href="mailto:hello@soulsync.global">
              hello@soulsync.global
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
