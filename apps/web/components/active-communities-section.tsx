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

const HERO_PANEL_CLASS =
  'relative h-[min(240px,42vw)] w-[min(136px,40vw)] overflow-hidden rounded-xl shadow-lg sm:h-[420px] sm:w-[280px] sm:rounded-2xl md:h-[480px] md:w-[300px]';

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
        'flex w-[192px] shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white/95 p-2.5 shadow-md backdrop-blur-sm',
        className,
      )}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-[var(--muted)] text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-0.5 text-center text-[10px] leading-tight sm:text-[11px]">
        <div className="min-w-0 px-0.5">
          <p className="text-[var(--muted-foreground)]">Age</p>
          <p className="font-semibold tabular-nums">{age}</p>
        </div>
        <div className="min-w-0 px-0.5">
          <p className="text-[var(--muted-foreground)]">Height</p>
          <p className="font-semibold">{height}</p>
        </div>
        <div className="min-w-0 px-0.5">
          <p className="text-[var(--muted-foreground)]">Job</p>
          <p className="truncate font-semibold" title={profession}>
            {profession}
          </p>
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
      <div className="mx-auto w-full max-w-[80rem] overflow-visible px-4 sm:px-6 lg:w-[80%]">
        <div className="relative mx-auto mb-8 max-w-5xl overflow-visible px-2 sm:px-6 md:mb-10 md:px-6 lg:px-10">
          <div className="flex flex-row items-end justify-center gap-0">
            <div className="relative shrink-0">
              <div className={HERO_PANEL_CLASS}>
                <Image
                  src="/second1.jpg"
                  alt="Member browsing profiles on mobile"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 136px, (max-width: 768px) 280px, 300px"
                />
              </div>
              <ProfilePreviewCard
                {...PROFILE_PREVIEWS[0]}
                className="absolute left-0 top-3 z-10 hidden md:flex md:-translate-x-[12%] lg:-translate-x-[24%]"
              />
            </div>

            <div
              className="relative z-20 -mx-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-600)] to-blue-600 text-white shadow-lg ring-4 ring-white sm:-mx-3 sm:h-14 sm:w-14 md:-mx-4 md:h-16 md:w-16 lg:-mx-5"
              aria-hidden
            >
              <HeartHandshake className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            </div>

            <div className="relative shrink-0">
              <div className={HERO_PANEL_CLASS}>
                <Image
                  src="/secon2.png"
                  alt="Community member reviewing biodata"
                  fill
                  className="object-cover object-left"
                  sizes="(max-width: 640px) 136px, (max-width: 768px) 280px, 300px"
                />
              </div>
              <ProfilePreviewCard
                {...PROFILE_PREVIEWS[1]}
                className="absolute bottom-4 right-0 z-10 hidden md:flex md:translate-x-[12%] lg:translate-x-[24%]"
              />
            </div>
          </div>
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
