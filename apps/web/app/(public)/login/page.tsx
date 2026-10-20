import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { LoginTabs } from '@/components/auth/login-tabs';

export const metadata: Metadata = {
  title: 'Log in | SoulSync Global',
};

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Log in"
      subtitle="Access your SoulSync account or continue as a guest with your login code."
    >
      <LoginTabs />
    </AuthPageShell>
  );
}
