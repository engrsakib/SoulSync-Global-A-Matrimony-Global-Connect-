import { ActiveCommunitiesSection } from '@/components/active-communities-section';
import { HeroCarousel } from '@/components/hero-carousel';
import { getTenants } from '@/lib/api';

export default async function HomePage() {
  const tenants = await getTenants().catch(() => []);

  return (
    <main className="min-h-screen">
      <HeroCarousel />

      <ActiveCommunitiesSection tenants={tenants} />

      <section
        id="privacy"
        className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--muted)]/40 px-6 py-14"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          <h2 className="text-2xl font-semibold">Privacy by design</h2>
          <p className="text-[var(--muted-foreground)]">
            Profiles, photos, and contact details follow tenant rules and your consent choices—so
            discovery stays respectful and under your control.
          </p>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 mx-auto max-w-3xl space-y-3 px-6 py-14">
        <h2 className="text-2xl font-semibold">About SoulSync Global</h2>
        <p className="text-[var(--muted-foreground)]">
          We connect faith-aware communities on one marketplace platform, with guardian workflows
          and multi-tenant isolation built in from day one.
        </p>
      </section>

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
