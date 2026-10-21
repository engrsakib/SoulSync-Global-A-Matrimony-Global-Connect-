import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BiodataBuilder } from '@/components/dashboard/biodata-builder';
import { getServerBiodata } from '@/lib/biodata-server';
import { getServerSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Biodata | SoulSync Global',
};

export default async function BiodataPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect('/login?next=/dashboard/biodata');
  }

  const biodata = await getServerBiodata();
  if (!biodata) {
    redirect('/login?next=/dashboard/biodata');
  }

  return <BiodataBuilder initialBiodata={biodata} />;
}
