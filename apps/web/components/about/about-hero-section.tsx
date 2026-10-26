import { Badge } from '@soulsync/ui/badge';
import type { AboutPageHeroDto } from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionShell } from '@/components/public/public-section-shell';

type AboutHeroSectionProps = AboutPageHeroDto;

export function AboutHeroSection({ badge, title, subtitle }: AboutHeroSectionProps) {
  return (
    <PublicSectionShell
      className="border-b border-[var(--border)] pt-20 md:pt-24"
      background={<PublicBokehBackground variant="warm" />}
    >
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        {badge ? (
          <Badge
            variant="outline"
            className="border-[var(--color-brand-500)]/40 bg-[var(--card)]/90 text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]"
          >
            {badge}
          </Badge>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
        <p className="text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
          {subtitle}
        </p>
        <div
          className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-800)]"
          aria-hidden
        />
      </div>
    </PublicSectionShell>
  );
}
