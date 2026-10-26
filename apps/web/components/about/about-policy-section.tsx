import { Lock, Shield, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import { cn } from '@soulsync/ui/lib/utils';
import type { AboutPagePolicyDto } from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';

type AboutPolicySectionProps = {
  policies: AboutPagePolicyDto[];
};

function PolicyIcon({ featured }: { featured: boolean }) {
  if (featured) {
    return <Shield className="h-6 w-6" aria-hidden />;
  }
  return <FileText className="h-5 w-5" aria-hidden />;
}

export function AboutPolicySection({ policies }: AboutPolicySectionProps) {
  const featured = policies.find((p) => p.featured);
  const others = policies.filter((p) => !p.featured);

  return (
    <PublicSectionShell borderTop background={<PublicBokehBackground variant="faq" />}>
      <div className="space-y-10">
        <PublicSectionHeader
          badge="Policies"
          title="How we protect members"
          description="Clear standards for privacy, consent, and community conduct—with data security at the center."
        />

        {featured ? (
          <Card
            className={cn(
              'border-2 border-[var(--color-brand-500)]/45 bg-[var(--card)] shadow-md',
              'ring-1 ring-[var(--color-brand-500)]/20',
            )}
          >
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] text-white shadow-sm">
                <Shield className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl sm:text-2xl">{featured.title}</CardTitle>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-500)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]">
                    <Lock className="h-3 w-3" aria-hidden />
                    Highlight
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
                {featured.body}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((policy) => (
            <Card
              key={policy.id}
              className="border-[var(--border)] bg-[var(--card)]/95 shadow-sm backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]">
                  <PolicyIcon featured={false} />
                </div>
                <CardTitle className="text-base">{policy.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {policy.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicSectionShell>
  );
}
