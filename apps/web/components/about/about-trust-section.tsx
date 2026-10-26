import { CheckCircle2 } from 'lucide-react';
import type { AboutPageTrustPillarDto } from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';

type AboutTrustSectionProps = {
  pillars: AboutPageTrustPillarDto[];
};

export function AboutTrustSection({ pillars }: AboutTrustSectionProps) {
  return (
    <PublicSectionShell
      borderTop
      className="pb-16 md:pb-20"
      background={<PublicBokehBackground variant="default" />}
    >
      <div className="space-y-10">
        <PublicSectionHeader
          badge="Trust"
          title="How we earn your confidence"
          description="Beyond policy documents—these principles show up in product flows every day."
        />
        <ul className="grid gap-6 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <li
              key={pillar.id}
              className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/90 p-5 shadow-sm backdrop-blur-sm"
            >
              <CheckCircle2
                className="mt-0.5 h-6 w-6 shrink-0 text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]"
                aria-hidden
              />
              <div className="space-y-1.5">
                <h3 className="font-semibold text-[var(--foreground)]">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {pillar.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PublicSectionShell>
  );
}
