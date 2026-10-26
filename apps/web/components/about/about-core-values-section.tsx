import type { AboutPageCoreValuesSectionDto } from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { ScrollStackFallback } from '@/components/public/scroll-stack/scroll-stack-fallback';
import type { ScrollStackLayer } from '@/components/public/scroll-stack';

type AboutCoreValuesSectionProps = AboutPageCoreValuesSectionDto;

function toScrollLayers(items: AboutPageCoreValuesSectionDto['items']): ScrollStackLayer[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    stackLabel: item.title,
    highlights: item.highlights?.map((h) => ({
      id: h.id,
      label: h.label,
      tone: h.tone,
    })),
  }));
}

export function AboutCoreValuesSection(props: AboutCoreValuesSectionProps) {
  const { badge, title, description, items } = props;

  return (
    <PublicSectionShell
      borderTop
      className="bg-[var(--muted)]/30"
      background={<PublicBokehBackground variant="faq" />}
      innerClassName="max-w-none lg:w-full lg:max-w-[80rem]"
    >
      <ScrollStackFallback
        badge={badge}
        title={title}
        description={description}
        layers={toScrollLayers(items)}
        layerIconSet="about-core-values"
      />
    </PublicSectionShell>
  );
}
