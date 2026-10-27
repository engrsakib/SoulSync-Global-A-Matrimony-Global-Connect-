import { MessengerAppClient } from '@/components/messenger/messenger-app.client';
import { getServerSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function MessengerPage() {
  const user = await getServerSessionUser();
  if (!user) {
    return null;
  }
  return (
    <div
      className="flex min-h-0 flex-1 flex-col [--dashboard-messenger-offset:9rem] md:[--dashboard-messenger-offset:10.5rem]"
    >
      <h1 className="sr-only">Messenger</h1>
      <MessengerAppClient currentUserId={user.id} />
    </div>
  );
}
