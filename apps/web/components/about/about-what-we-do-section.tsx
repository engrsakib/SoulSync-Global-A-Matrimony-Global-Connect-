import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import type { AboutPageWhatWeDoSectionDto } from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { whatWeDoIcon } from '@/lib/about-page/section-icons';

type AboutWhatWeDoSectionProps = AboutPageWhatWeDoSectionDto;

export function AboutWhatWeDoSection({ badge, title, description, items }: AboutWhatWeDoSectionProps) {
  return (
    <PublicSectionShell borderTop background={<PublicBokehBackground variant="faq" />}>
      <div className="space-y-10">
        <PublicSectionHeader badge={badge} title={title} description={description} />
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => {
            const Icon = whatWeDoIcon(item.id);
            return (
              <Card
                key={item.id}
                className="border-[var(--border)] bg-[var(--card)]/95 shadow-sm backdrop-blur-sm"
              >
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] text-white shadow-sm">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg leading-snug">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="leading-relaxed text-[var(--muted-foreground)]">{item.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PublicSectionShell>
  );
}
