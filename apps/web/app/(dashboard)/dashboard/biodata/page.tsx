import type { Metadata } from 'next';
import { dashboardPageTitle } from '@/lib/ui-classes';

export const metadata: Metadata = {
  title: 'Biodata | SoulSync Global',
};

export default function BiodataPage() {
  return (
    <div className="space-y-6">
      <h1 className={dashboardPageTitle}>Biodata</h1>
      <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-8 text-center shadow-sm">
        <p className="text-sm text-[var(--muted-foreground)]">
          Your matrimony biodata builder is coming soon. You will be able to create and manage your
          profile details here.
        </p>
      </section>
    </div>
  );
}
