import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { redirectIfLoggedIn } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Forgot password | SoulSync Global',
};

export default async function ForgotPasswordPage() {
  await redirectIfLoggedIn();

  return (
    <AuthPageShell
      title="Reset password"
      subtitle="We'll email you a verification code, then you can choose a new password."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
