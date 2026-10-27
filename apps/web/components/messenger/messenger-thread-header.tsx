'use client';

import * as React from 'react';
import { Info, Phone, Video } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import type { MessengerConversationDto } from '@soulsync/shared-types/messenger';
import {
  formatMessengerPeerLabel,
  formatMessengerPeerSubtitle,
} from '@/lib/messenger/format-peer-label';
import { MessengerPeerAvatar } from './messenger-peer-avatar';
import {
  MessengerCallComingSoonDialog,
  type MessengerCallComingSoonKind,
} from './messenger-call-coming-soon-dialog';

type Props = {
  active: MessengerConversationDto;
  detailsOpen: boolean;
  onBack: () => void;
  onToggleDetails: () => void;
  onAccept?: () => void;
};

function IconAction({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--muted)]',
        active && 'bg-[var(--muted)] ring-2 ring-[var(--color-brand-600)]',
      )}
    >
      {children}
    </button>
  );
}

export function MessengerThreadHeader({
  active,
  detailsOpen,
  onBack,
  onToggleDetails,
  onAccept,
}: Props) {
  const [comingSoonKind, setComingSoonKind] = React.useState<MessengerCallComingSoonKind | null>(
    null,
  );
  const subtitle = formatMessengerPeerSubtitle(active.peer);
  const statusLine = active.peer.isOnline ? 'Active now' : 'Offline';
  const peerName = formatMessengerPeerLabel(active.peer);

  return (
    <>
      <header className="flex min-w-0 items-center gap-1 border-b border-[var(--border)] px-2 py-2.5 sm:gap-2 sm:px-4 sm:py-3">
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--muted-foreground)] lg:hidden"
          onClick={onBack}
        >
          ← Back
        </button>
        <MessengerPeerAvatar peer={active.peer} className="hidden h-9 w-9 sm:flex" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">{peerName}</h2>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {subtitle ? (
              <>
                {subtitle}
                <span aria-hidden> · </span>
              </>
            ) : null}
            {statusLine}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap items-center gap-0.5 sm:gap-1">
          {active.folder === 'REQUESTS' && onAccept ? (
            <button
              type="button"
              className="mr-0.5 shrink-0 rounded-lg bg-[var(--color-brand-700)] px-2 py-1 text-xs font-semibold text-white sm:mr-1 sm:px-3 sm:py-1.5"
              onClick={onAccept}
            >
              Accept
            </button>
          ) : null}
          <IconAction label="Audio call" onClick={() => setComingSoonKind('audio')}>
            <Phone className="h-[18px] w-[18px] text-[var(--foreground)]" />
          </IconAction>
          <IconAction label="Video call" onClick={() => setComingSoonKind('video')}>
            <Video className="h-[18px] w-[18px] text-[var(--foreground)]" />
          </IconAction>
          <IconAction label="Chat details" active={detailsOpen} onClick={onToggleDetails}>
            <Info className="h-[18px] w-[18px] text-[var(--foreground)]" />
          </IconAction>
        </div>
      </header>
      {comingSoonKind ? (
        <MessengerCallComingSoonDialog
          kind={comingSoonKind}
          peerName={peerName}
          onClose={() => setComingSoonKind(null)}
        />
      ) : null}
    </>
  );
}
