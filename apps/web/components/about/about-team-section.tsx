import Image from 'next/image';
import type {
  AboutPageFounderDto,
  AboutPageTeamMemberDto,
} from '@soulsync/shared-types/about-page';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import { TeamMemberFlipCard } from '@/components/about/team-member-flip-card';

type AboutTeamSectionProps = {
  founder: AboutPageFounderDto;
  team: AboutPageTeamMemberDto[];
};

export function AboutTeamSection({ founder, team }: AboutTeamSectionProps) {
  return (
    <PublicSectionShell borderTop>
      <div className="space-y-12">
        <PublicSectionHeader
          badge="Team"
          title="People behind the platform"
          description="A small team focused on trust, design, and community operations—led by our founder."
        />

        <div className="grid items-center gap-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm md:grid-cols-2 md:gap-10 md:p-8">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
            <Image
              src={founder.imageSrc}
              alt={founder.imageAlt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 320px, 380px"
              priority
            />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <p className="text-xs font-semibold tracking-wider text-[var(--color-brand-600)] uppercase dark:text-[var(--color-brand-400)]">
              Founder
            </p>
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{founder.name}</h3>
            <p className="text-lg font-medium text-[var(--muted-foreground)]">
              {founder.designation}
            </p>
            {founder.location ? (
              <p className="text-sm text-[var(--muted-foreground)]">{founder.location}</p>
            ) : null}
            <p className="leading-relaxed text-[var(--muted-foreground)]">{founder.bio}</p>
          </div>
        </div>

        <div className="grid justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <TeamMemberFlipCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </PublicSectionShell>
  );
}
