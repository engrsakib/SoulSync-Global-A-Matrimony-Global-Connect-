import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SystemPageShell } from '@/components/system/system-page-shell';
import { SYSTEM_PAGE_SLUGS } from '@/lib/system-pages/constants';
import { getSystemPage } from '@/lib/system-pages/get-page';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SYSTEM_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSystemPage(slug);
  if (!page) {
    return { title: 'Policy' };
  }
  return {
    title: `${page.title} | SoulSync Global`,
    description: `${page.title} for SoulSync Global.`,
  };
}

export default async function SystemPolicyPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSystemPage(slug);
  if (!page) {
    notFound();
  }
  return (
    <main className="min-h-screen scroll-mt-20 bg-[var(--background)]">
      <SystemPageShell page={page} />
    </main>
  );
}
