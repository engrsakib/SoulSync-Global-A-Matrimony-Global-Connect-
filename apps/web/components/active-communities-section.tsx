import Image from 'next/image';
import { HeartHandshake } from 'lucide-react';
import { Badge } from '@soulsync/ui/badge';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import type { Tenant } from '@/lib/api';
import { CommunitySearchForm } from '@/components/community-search-form';

const PROFILE_PREVIEWS = [
  { initials: 'SR', age: '22', height: "5' 4\"", profession: 'Teacher' },
  { initials: 'AR', age: '27', height: "5' 9\"", profession: 'Engineer' },
  { initials: 'FM', age: '18', height: "5' 2\"", profession: 'Student' },
  { initials: 'NK', age: '24', height: "5' 6\"", profession: 'Doctor' },
] as const;

const SECTION_PATTERN =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Cg fill=\'none\' stroke=\'%23c4b5fd\' stroke-opacity=\'0.15\' stroke-width=\'1\'%3E%3Cpath d=\'M40 8c6 12 14 20 26 26-12 6-20 14-26 26-6-12-14-20-26-26 12-6 20-14 26-26z\'/%3E%3C/g%3E%3C/svg%3E")';

function FloralAccent() {
  return (
    <svg
      className="mx-auto h-8 w-40 text-[var(--color-brand-500)]"
      viewBox="0 0 160 32"
      fill="none"
      aria-hidden
    >
      <path
        d="M80 16c-8-6-14-6-22 0 8 6 14 6 22 0z"
        fill="currentColor"
        opacity="0.35"
      />
      <circle cx="48" cy="16" r="5" fill="#a855f7" opacity="0.7" />
      <circle cx="80" cy="14" r="6" fill="#9333ea" />
      <circle cx="112" cy="16" r="5" fill="#a855f7" opacity="0.7" />
      <path
        d="M20 20c8-4 16-4 24 0M116 20c8-4 16-4 24 0"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function ProfilePreviewCard({
  initials,
  age,
  height,
  profession,
  className,
}: (typeof PROFILE_PREVIEWS)[number] & { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-w-[168px] items-center gap-2 rounded-xl border border-[var(--border)] bg-white/95 p-2 shadow-md backdrop-blur-sm',
        className,
      )}
    >
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-[var(--muted)] text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 grid-cols-3 gap-1 text-center text-[10px] leading-tight sm:text-xs">
        <div>
          <p className="text-[var(--muted-foreground)]">Age</p>
          <p className="font-semibold">{age}</p>
        </div>
        <div>
          <p className="text-[var(--muted-foreground)]">Height</p>
          <p className="font-semibold">{height}</p>
        </div>
        <div>
          <p className="text-[var(--muted-foreground)]">Job</p>
          <p className="font-semibold">{profession}</p>
        </div>
      </div>
    </div>
  );
}

function formatReligion(value: string): string {
  return value.replace(/_/g, ' ');
}

type ActiveCommunitiesSectionProps = {
  tenants: Tenant[];
};

export function ActiveCommunitiesSection({ tenants }: ActiveCommunitiesSectionProps) {
  const religionBadges = tenants.flatMap((tenant) =>
    tenant.supportedReligions.map((religion) => ({
      key: `${tenant.id}-${religion}`,
      label: formatReligion(religion),
    })),
  );

  return (
    <section
      id="communities"
      className="scroll-mt-20 bg-[var(--background)] py-12 md:py-16"
      style={{ backgroundImage: SECTION_PATTERN }}
    >
      <div className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:w-[80%]">
        <div className="relative mx-auto mb-8 max-w-4xl md:mb-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-3">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl shadow-lg md:max-w-none md:justify-self-end">
              <Image
                src="/second1.jpg"
                alt="Member browsing profiles on mobile"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 280px, 35vw"
              />
              <ProfilePreviewCard
                {...PROFILE_PREVIEWS[0]}
                className="absolute -left-2 top-6 z-10 hidden md:flex lg:-left-10"
              />
              <ProfilePreviewCard
                {...PROFILE_PREVIEWS[1]}
                className="absolute -left-4 bottom-16 z-10 hidden md:flex lg:-left-12"
              />
            </div>

            <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl shadow-lg md:max-w-none md:justify-self-start">
              <Image
                src="/secon2.png"
                alt="Community member reviewing biodata"
                fill
                className="object-cover object-left"
                sizes="(max-width: 768px) 280px, 35vw"
              />
              <ProfilePreviewCard
                {...PROFILE_PREVIEWS[2]}
                className="absolute -right-2 top-10 z-10 hidden md:flex lg:-right-8"
              />
            </div>
          </div>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-600)] to-blue-600 text-white shadow-lg ring-4 ring-white md:h-16 md:w-16"
            aria-hidden
          >
            <HeartHandshake className="h-7 w-7 md:h-8 md:w-8" />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:hidden">
          {PROFILE_PREVIEWS.map((preview) => (
            <ProfilePreviewCard key={preview.initials} {...preview} className="min-w-0 w-full" />
          ))}
        </div>

        <div className="mb-6 space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Active communities
          </p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-blue-600 bg-clip-text text-transparent">
              Find a suitable match
            </span>
          </h2>
          <FloralAccent />
          {tenants.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-sm text-[var(--muted-foreground)]">Live on SoulSync:</span>
              {tenants.map((tenant) => (
                <Badge key={tenant.id} variant="outline" className="bg-white/80">
                  {tenant.name}
                </Badge>
              ))}
              {religionBadges.map((badge) => (
                <Badge key={badge.key} variant="secondary">
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <CommunitySearchForm tenants={tenants} />
      </div>
    </section>
  );
}
