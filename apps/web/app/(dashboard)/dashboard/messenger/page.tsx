import { MessengerAppClient } from '@/components/messenger/messenger-app.client';
import { getServerSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function MessengerPage() {
  const user = await getServerSessionUser();
  if (!user) {
    return null;
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Messenger</h1>
        <p className="text-sm text-slate-300">Private chats encrypted on your device.</p>
      </div>
      <MessengerAppClient currentUserId={user.id} />
    </div>
  );
}
