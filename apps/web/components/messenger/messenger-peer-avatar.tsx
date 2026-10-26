'use client';

import { cn } from '@soulsync/ui/lib/utils';
import type { MessengerPeerSummaryDto } from '@soulsync/shared-types/messenger';
import { peerInitials } from '@/lib/messenger/format-peer-label';

type Props = {
  peer: MessengerPeerSummaryDto;
  className?: string;
};

export function MessengerPeerAvatar({ peer, className }: Props) {
  const sizeClass = className ?? 'h-9 w-9';
  if (peer.avatarUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external member avatars
      <img
        src={peer.avatarUrl}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', sizeClass)}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-800)] text-xs font-semibold text-white',
        sizeClass,
      )}
    >
      {peerInitials(peer)}
    </span>
  );
}
