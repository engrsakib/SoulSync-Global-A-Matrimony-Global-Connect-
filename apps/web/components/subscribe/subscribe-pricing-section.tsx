import type { SubscriptionCatalogDto } from '@soulsync/shared-types/subscription-catalog';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { SubscribePricingClient } from '@/components/subscribe/subscribe-pricing.client';
import {
  marketingSectionInnerClass,
  marketingSectionSurfaceClass,
} from '@/lib/marketing-ui-classes';

type SubscribePricingSectionProps = {
  catalog: SubscriptionCatalogDto;
};

export function SubscribePricingSection({ catalog }: SubscribePricingSectionProps) {
  return (
    <PublicSectionShell
      className={marketingSectionSurfaceClass}
      background={<PublicBokehBackground variant="faq" />}
      innerClassName={marketingSectionInnerClass}
    >
      <div className="space-y-10 md:space-y-14">
        <PublicSectionHeader
          badge={catalog.page.badge}
          title={catalog.page.title}
          description={catalog.page.description}
          titleGradient
          align="center"
        />
        <SubscribePricingClient catalog={catalog} />
      </div>
    </PublicSectionShell>
  );
}
