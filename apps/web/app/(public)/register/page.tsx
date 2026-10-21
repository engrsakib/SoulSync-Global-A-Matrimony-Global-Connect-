import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { redirectIfLoggedIn } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Sign up | SoulSync Global',
};

export default async function RegisterPage() {
  await redirectIfLoggedIn();

  return (
    <AuthPageShell
      title="Create account"
      subtitle="Register with email and a unique username. You will receive a personal login code after sign up."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
