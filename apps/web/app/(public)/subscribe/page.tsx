import type { Metadata } from 'next';
import { SubscribePricingSection } from '@/components/subscribe/subscribe-pricing-section';
import { getSubscriptionCatalog } from '@/lib/subscription/get-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getSubscriptionCatalog();
  return {
    title: `${catalog.page.title} | SoulSync Global`,
    description: catalog.page.description,
  };
}

export default async function SubscribePage() {
  const catalog = await getSubscriptionCatalog();

  return (
    <main className="min-h-screen pt-28 md:pt-32">
      <SubscribePricingSection catalog={catalog} />
    </main>
  );
}
