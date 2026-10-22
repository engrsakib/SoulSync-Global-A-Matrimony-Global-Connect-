import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BiodataBuilder } from '@/components/dashboard/biodata-builder';
import { BiodataLoadFallback } from '@/components/dashboard/biodata-load-fallback';
import { getServerBiodata } from '@/lib/biodata-server';
import { loginRedirectPath } from '@/lib/auth-cookie';
import { getServerSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Biodata | SoulSync Global',
};

export default async function BiodataPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(loginRedirectPath('/dashboard/biodata'));
  }

  const biodata = await getServerBiodata();
  if (!biodata) {
    return <BiodataLoadFallback />;
  }

  return <BiodataBuilder initialBiodata={biodata} />;
}
