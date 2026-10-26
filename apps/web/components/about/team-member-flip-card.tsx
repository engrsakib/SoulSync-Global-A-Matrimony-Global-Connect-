import Image from 'next/image';
import { UserRound } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import type { AboutPageTeamMemberDto } from '@soulsync/shared-types/about-page';

type TeamMemberFlipCardProps = {
  member: AboutPageTeamMemberDto;
  className?: string;
};

const FLIP_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';

function MemberDetailsPanel({
  member,
  className,
}: {
  member: AboutPageTeamMemberDto;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-4 h-1 w-10 rounded-full bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-700)]" />
      <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)] sm:text-xl">
        {member.name}
      </h3>
      <p className="mt-2 inline-flex w-fit max-w-full rounded-full border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-500)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]">
        {member.designation}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">{member.bio}</p>
    </div>
  );
}

export function TeamMemberFlipCard({ member, className }: TeamMemberFlipCardProps) {
  return (
    <article
      tabIndex={0}
      aria-label={`${member.name}, ${member.designation}. Focus or hover to read bio.`}
      className={cn(
        'group/card w-full max-w-[280px] outline-none',
        'h-[min(360px,72vw)] perspective-[1400px] sm:h-[380px]',
        'rounded-2xl transition-[transform,box-shadow] duration-500 motion-safe:group-hover/card:shadow-xl motion-safe:group-focus-visible/card:shadow-xl',
        className,
      )}
    >
      {/* Reduced motion: expanded card */}
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md ring-1 ring-[var(--border)]/60 motion-safe:hidden">
        <div className="relative aspect-[4/5] w-full shrink-0">
          <Image
            src={member.imageSrc}
            alt={member.imageAlt}
            fill
            className="object-cover object-top"
            sizes="280px"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <MemberDetailsPanel member={member} />
        </div>
      </div>

      {/* 3D flip (motion-safe) */}
      <div
        className={cn(
          'relative hidden h-full w-full motion-safe:block',
          '[transform-style:preserve-3d]',
          'transition-[transform] duration-[680ms]',
          `group-hover/card:[transform:rotateY(180deg)] group-focus-visible/card:[transform:rotateY(180deg)]`,
        )}
        style={{ transitionTimingFunction: FLIP_EASE }}
      >
        {/* Front */}
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-2xl',
            'border border-[var(--border)] bg-[var(--card)] shadow-md ring-1 ring-[var(--border)]/60',
            '[backface-visibility:hidden] [transform:translateZ(1px)]',
          )}
        >
          <div className="relative h-full w-full">
            <Image
              src={member.imageSrc}
              alt={member.imageAlt}
              fill
              className="object-cover object-top transition-transform duration-[680ms] group-hover/card:scale-[1.03] group-focus-visible/card:scale-[1.03]"
              sizes="280px"
              style={{ transitionTimingFunction: FLIP_EASE }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 pt-16">
              <p className="text-lg font-bold tracking-tight text-white">{member.name}</p>
              <p className="text-sm font-medium text-white/85">{member.designation}</p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                View profile
              </p>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col rounded-2xl',
            'border border-[var(--border)] bg-[var(--card)] shadow-lg ring-1 ring-[var(--color-brand-500)]/20',
            '[backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(1px)]',
          )}
        >
          <div className="h-1.5 shrink-0 bg-gradient-to-r from-[var(--color-brand-500)] via-[var(--color-brand-600)] to-[var(--color-brand-800)]" />
          <div className="flex flex-1 flex-col justify-center overflow-y-auto p-6">
            <MemberDetailsPanel member={member} />
          </div>
          <div className="border-t border-[var(--border)] px-6 py-3">
            <p className="text-center text-[10px] font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
              SoulSync Global
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
