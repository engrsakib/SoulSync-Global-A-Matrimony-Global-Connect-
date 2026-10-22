import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { LoginTabs } from '@/components/auth/login-tabs';
import { SessionExpiredBanner } from '@/components/auth/session-expired-banner';
import { redirectIfLoggedIn } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Log in | SoulSync Global',
};

type LoginPageProps = {
  searchParams: Promise<{ reason?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfLoggedIn();
  const params = await searchParams;

  return (
    <AuthPageShell
      title="Log in"
      subtitle="Access your SoulSync account or continue as a guest with your login code."
    >
      <div className="space-y-4">
        <SessionExpiredBanner show={params.reason === 'session_expired'} />
        <LoginTabs />
      </div>
    </AuthPageShell>
  );
}
