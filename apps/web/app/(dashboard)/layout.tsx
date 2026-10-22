import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerBiodataVisibility } from '@/lib/biodata-visibility-server';
import {
  getServerEditorGrantsAsEditor,
  getServerEditorGrantsAsOwner,
} from '@/lib/biodata-editor-grant-server';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, visibility, editorAsEditor, editorAsOwner] = await Promise.all([
    getServerSessionUser(),
    getServerBiodataVisibility(),
    getServerEditorGrantsAsEditor(),
    getServerEditorGrantsAsOwner(),
  ]);
  if (!user) {
    redirect('/login?next=/dashboard/profile');
  }

  const initialPendingAccessRequestCount = visibility?.accessRequests.pending.length ?? 0;
  const initialPendingEditAccessCount = editorAsOwner?.pendingIncoming.length ?? 0;
  const showBiodataManagedNav =
    (editorAsEditor?.activeManaged.length ?? 0) > 0 ||
    (editorAsEditor?.pendingInvites.length ?? 0) > 0;

  return (
    <DashboardShell
      user={user}
      initialPendingAccessRequestCount={initialPendingAccessRequestCount}
      initialPendingEditAccessCount={initialPendingEditAccessCount}
      showBiodataManagedNav={showBiodataManagedNav}
    >
      {children}
    </DashboardShell>
  );
}
