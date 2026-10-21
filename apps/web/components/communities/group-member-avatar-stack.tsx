'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { CommunityAuthorDto } from '@soulsync/shared-types/communities';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import { memberRoutes } from '@/lib/member-routes';

type GroupMemberAvatarStackProps = {
  slug: string;
  members: CommunityAuthorDto[];
  className?: string;
};

function initials(username: string | null, id: string): string {
  const source = username?.trim() || id;
  return source.slice(0, 2).toUpperCase();
}

export function GroupMemberAvatarStack({ slug, members, className }: GroupMemberAvatarStackProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <Link
      href={memberRoutes.communityMembers(slug)}
      className={cn('inline-flex items-center hover:opacity-90', className)}
      title="View members"
    >
      <ul className="flex -space-x-2">
        {members.map((member) => (
          <li key={member.id}>
            <Avatar className="h-9 w-9 border-2 border-[var(--background)] bg-[var(--muted)]">
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback className="text-xs">{initials(member.username, member.id)}</AvatarFallback>
              )}
            </Avatar>
          </li>
        ))}
      </ul>
    </Link>
  );
}
