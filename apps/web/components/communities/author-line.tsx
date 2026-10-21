'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import type { CommunityAuthorDto } from '@soulsync/shared-types/communities';
import { formatCommunityAuthorUsername } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';

type AuthorLineProps = {
  author: CommunityAuthorDto;
  communitySlug: string;
  timestamp?: string | null;
  meta?: string;
};

export function AuthorLine({ author, communitySlug, timestamp, meta }: AuthorLineProps) {
  const label = formatCommunityAuthorUsername(author.username);
  const initials = (author.username?.slice(0, 2) ?? 'MB').toUpperCase();
  const profileHref =
    author.username != null
      ? memberRoutes.communityMember(communitySlug, author.username)
      : undefined;

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-10 w-10 shrink-0">
        {author.avatarUrl ? (
          <Image
            src={author.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <AvatarFallback className="bg-[var(--muted)] text-xs">{initials}</AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {profileHref ? (
            <Link href={profileHref} className="font-semibold hover:underline">
              {label}
            </Link>
          ) : (
            <span className="font-semibold">{label}</span>
          )}
          {timestamp ? (
            <span className="text-xs text-[var(--muted-foreground)]">{timestamp}</span>
          ) : null}
          {meta ? (
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{meta}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
