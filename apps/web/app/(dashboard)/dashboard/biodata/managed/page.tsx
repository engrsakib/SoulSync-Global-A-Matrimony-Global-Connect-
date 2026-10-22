import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BiodataManagedHub } from '@/components/dashboard/biodata-managed-hub';
import { loginRedirectPath } from '@/lib/auth-cookie';
import { getServerSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Biodata I manage | SoulSync Global',
};

export default async function BiodataManagedPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(loginRedirectPath('/dashboard/biodata/managed'));
  }

  return <BiodataManagedHub />;
}
