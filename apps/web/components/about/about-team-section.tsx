import Image from 'next/image';
import { MapPin, Quote } from 'lucide-react';
import type {
  AboutPageFounderDto,
  AboutPageTeamMemberDto,
} from '@soulsync/shared-types/about-page';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { TeamMemberFlipCard } from '@/components/about/team-member-flip-card';
import { marketingSectionInnerClass } from '@/lib/marketing-ui-classes';

type AboutTeamSectionProps = {
  founder: AboutPageFounderDto;
  team: AboutPageTeamMemberDto[];
};

function FounderSpotlight({ founder }: { founder: AboutPageFounderDto }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 shadow-[0_20px_50px_-24px_color-mix(in_srgb,var(--color-brand-700)_35%,transparent)] backdrop-blur-sm">
      <div
        className="h-1 bg-gradient-to-r from-[var(--color-brand-500)] via-[var(--color-brand-600)] to-[var(--color-brand-800)]"
        aria-hidden
      />
      <div className="grid items-center gap-8 p-6 md:gap-10 md:p-8 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-12">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-2xl shadow-[0_16px_40px_-20px_color-mix(in_srgb,var(--color-brand-700)_40%,transparent)] lg:mx-0 lg:max-w-none">
          <Image
            src={founder.imageSrc}
            alt={founder.imageAlt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 320px, 380px"
            priority
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[color-mix(in_srgb,var(--foreground)_25%,transparent)] to-transparent"
            aria-hidden
          />
        </div>
        <div className="relative space-y-4 text-center lg:text-left">
          <Quote
            className="mx-auto h-9 w-9 text-[var(--muted-foreground)]/30 lg:mx-0 lg:h-10 lg:w-10"
            aria-hidden
          />
          <p className="text-xs font-semibold tracking-wider text-[var(--color-brand-600)] uppercase dark:text-[var(--color-brand-400)]">
            Founder
          </p>
          <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
            <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] bg-clip-text text-transparent">
              {founder.name}
            </span>
          </h3>
          <p className="text-lg font-medium text-[var(--muted-foreground)]">
            {founder.designation}
          </p>
          {founder.location ? (
            <p className="inline-flex items-center justify-center gap-1.5 text-sm text-[var(--muted-foreground)] lg:justify-start">
              <MapPin className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              {founder.location}
            </p>
          ) : null}
          <p className="mx-auto max-w-xl leading-relaxed text-[var(--muted-foreground)] lg:mx-0">
            {founder.bio}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AboutTeamSection({ founder, team }: AboutTeamSectionProps) {
  return (
    <PublicSectionShell
      borderTop
      className="bg-[var(--muted)]/25"
      background={<PublicBokehBackground variant="faq" />}
      innerClassName={marketingSectionInnerClass}
    >
      <div className="space-y-10 md:space-y-14">
        <PublicSectionHeader
          badge="Team"
          title="People behind the platform"
          description="A small team focused on trust, design, and community operations—led by our founder."
          titleGradient
          align="left"
        />

        <FounderSpotlight founder={founder} />

        <div className="space-y-8">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              Core team
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              Hover or focus a card to read each member&apos;s role and background.
            </p>
          </div>
          <div className="grid justify-items-stretch gap-8 sm:grid-cols-2 lg:gap-10 xl:grid-cols-3">
            {team.map((member) => (
              <TeamMemberFlipCard key={member.id} member={member} className="max-w-none" />
            ))}
          </div>
        </div>
      </div>
    </PublicSectionShell>
  );
}
