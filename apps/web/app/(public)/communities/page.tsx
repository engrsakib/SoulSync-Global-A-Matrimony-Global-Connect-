import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { memberRoutes } from '@/lib/member-routes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Communities | SoulSync Global',
};

export default async function CommunitiesPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(memberRoutes.communities)}`);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--muted)]/30 pt-20 pb-14">
      <div className="mx-auto w-full max-w-[80rem] space-y-6 px-4 sm:px-6 lg:w-[80%]">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Communities</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
            Signed-in space for browsing and connecting—same site header and footer as the public
            site. Discovery flows will be built here next.
          </p>
        </div>
        <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Coming soon</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Tenant lists, search, and member discovery will live on this route.
          </p>
        </section>
      </div>
    </main>
  );
}
