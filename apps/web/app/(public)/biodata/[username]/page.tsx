import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { memberRoutes } from '@/lib/member-routes';
import { getServerMemberBiodataView } from '@/lib/biodata-view-server';
import { BioProtectionWrapper } from '@/components/biodata/bio-protection-wrapper';
import { MemberBiodataView } from '@/components/biodata/member-biodata-view';
import { getViewerTraceContext } from '@/lib/viewer-trace-server';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} biodata | SoulSync` };
}

export default async function MemberBiodataPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  const { username } = await params;
  const normalized = username.trim().toLowerCase();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(memberRoutes.memberBiodata(normalized))}`);
  }

  if (user.username?.toLowerCase() === normalized) {
    redirect(dashboardRoutes.biodata);
  }

  const result = await getServerMemberBiodataView(normalized);

  if (!result.ok) {
    if (result.status === 404) {
      notFound();
    }
    if (result.status === 403) {
      return (
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-lg font-semibold">Biodata not available</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{result.message}</p>
        </div>
      );
    }
    notFound();
  }

  const viewerTrace = await getViewerTraceContext(user.id);

  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 pt-20 pb-10 sm:px-6 sm:pt-24">
      <BioProtectionWrapper trace={viewerTrace}>
        <MemberBiodataView initialView={result.data} username={normalized} />
      </BioProtectionWrapper>
    </div>
  );
}
