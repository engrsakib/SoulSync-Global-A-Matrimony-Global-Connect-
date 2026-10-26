import type { AboutPageCoreValuesSectionDto } from '@soulsync/shared-types/about-page';
import { AboutSectionFrame } from '@/components/about/about-section-frame';
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
    <AboutSectionFrame badge={badge} title={title} description={description}>
      <ScrollStackFallback
        omitHeader
        badge={badge}
        title={title}
        description={description}
        layers={toScrollLayers(items)}
        layerIconSet="about-core-values"
      />
    </AboutSectionFrame>
  );
}
