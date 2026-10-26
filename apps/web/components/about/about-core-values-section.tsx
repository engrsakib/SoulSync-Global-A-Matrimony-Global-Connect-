import type { AboutPageCoreValuesSectionDto } from '@soulsync/shared-types/about-page';
import { ScrollStackFeatureSection } from '@/components/public/scroll-stack';
import type { ScrollStackLayer } from '@/components/public/scroll-stack';
type AboutCoreValuesSectionProps = AboutPageCoreValuesSectionDto;

/** Front-edge label on each 3D block (uppercase; truncated so slabs stay readable). */
function stackLabelFromTitle(title: string): string {
  const upper = title.trim().toUpperCase();
  if (upper.length <= 22) {
    return upper;
  }
  return `${upper.slice(0, 20).trimEnd()}…`;
}

function toScrollLayers(items: AboutPageCoreValuesSectionDto['items']): ScrollStackLayer[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    stackLabel: stackLabelFromTitle(item.title),
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
    <ScrollStackFeatureSection
      borderTop
      badge={badge}
      title={title}
      description={description}
      layers={toScrollLayers(items)}
      layerIconSet="about-core-values"
    />
  );
}
