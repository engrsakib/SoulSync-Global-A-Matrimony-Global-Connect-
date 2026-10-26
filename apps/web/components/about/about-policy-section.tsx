import { Lock, Shield, FileText } from 'lucide-react';
import type { AboutPagePolicyDto } from '@soulsync/shared-types/about-page';
import { AboutSectionFrame } from '@/components/about/about-section-frame';
import { PublicFeatureCard } from '@/components/public/public-feature-card';

type AboutPolicySectionProps = {
  policies: AboutPagePolicyDto[];
};

const highlightPillClass =
  'inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-500)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]';

export function AboutPolicySection({ policies }: AboutPolicySectionProps) {
  const featured = policies.find((p) => p.featured);
  const others = policies.filter((p) => !p.featured);

  return (
    <AboutSectionFrame
      badge="Policies"
      title="How we protect members"
      description="Clear standards for privacy, consent, and community conduct—with data security at the center."
    >
      <div className="space-y-8">
        {featured ? (
          <PublicFeatureCard
            title={featured.title}
            icon={Shield}
            featured
            titleSize="large"
            badge={
              <span className={highlightPillClass}>
                <Lock className="h-3 w-3" aria-hidden />
                Highlight
              </span>
            }
          >
            {featured.body}
          </PublicFeatureCard>
        ) : null}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((policy) => (
            <PublicFeatureCard
              key={policy.id}
              title={policy.title}
              icon={FileText}
            >
              {policy.body}
            </PublicFeatureCard>
          ))}
        </div>
      </div>
    </AboutSectionFrame>
  );
}
