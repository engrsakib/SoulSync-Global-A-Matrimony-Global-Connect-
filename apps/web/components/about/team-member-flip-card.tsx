import Image from 'next/image';
import { cn } from '@soulsync/ui/lib/utils';
import type { AboutPageTeamMemberDto } from '@soulsync/shared-types/about-page';

type TeamMemberFlipCardProps = {
  member: AboutPageTeamMemberDto;
  className?: string;
};

export function TeamMemberFlipCard({ member, className }: TeamMemberFlipCardProps) {
  return (
    <article
      className={cn(
        'group h-[min(320px,70vw)] w-full max-w-[280px] perspective-[1200px] sm:h-[340px]',
        className,
      )}
    >
      {/* Reduced motion: stack bio below photo */}
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md motion-safe:hidden">
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={member.imageSrc}
            alt={member.imageAlt}
            fill
            className="object-cover object-top"
            sizes="280px"
          />
        </div>
        <div className="space-y-1 p-4">
          <h3 className="font-semibold text-[var(--foreground)]">{member.name}</h3>
          <p className="text-sm font-medium text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]">
            {member.designation}
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{member.bio}</p>
        </div>
      </div>

      {/* Flip on hover (motion-safe only) */}
      <div
        className={cn(
          'relative hidden h-full w-full motion-safe:block',
          'transition-transform duration-500 [transform-style:preserve-3d]',
          'group-hover:[transform:rotateY(180deg)]',
          'group-focus-within:[transform:rotateY(180deg)]',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md',
            '[backface-visibility:hidden]',
          )}
        >
          <div className="relative h-full w-full">
            <Image
              src={member.imageSrc}
              alt={member.imageAlt}
              fill
              className="object-cover object-top"
              sizes="280px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
              <p className="text-sm font-medium text-white/90">Hover for details</p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-center rounded-2xl border border-[var(--border)]',
            'bg-gradient-to-br from-[var(--color-brand-700)] to-[var(--color-brand-900)] p-5 text-white shadow-md',
            '[transform:rotateY(180deg)] [backface-visibility:hidden]',
          )}
        >
          <h3 className="text-lg font-bold">{member.name}</h3>
          <p className="mt-1 text-sm font-medium text-[var(--color-brand-100)]">
            {member.designation}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/90">{member.bio}</p>
        </div>
      </div>
    </article>
  );
}
