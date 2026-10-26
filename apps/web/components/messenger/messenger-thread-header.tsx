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

type Props = {
  active: MessengerConversationDto;
  detailsOpen: boolean;
  onBack: () => void;
  onToggleDetails: () => void;
  onAccept?: () => void;
};

function IconAction({
  label,
  disabled,
  active,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={disabled ? 'Coming soon' : label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition',
        disabled && 'cursor-not-allowed opacity-40',
        !disabled && active && 'bg-[var(--muted)] ring-2 ring-[var(--color-brand-600)]',
        !disabled && !active && 'hover:bg-[var(--muted)]',
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
  const subtitle = formatMessengerPeerSubtitle(active.peer);
  const statusLine = active.peer.isOnline ? 'Active now' : 'Offline';

  return (
    <header className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5 sm:px-4 sm:py-3">
      <button
        type="button"
        className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--muted-foreground)] lg:hidden"
        onClick={onBack}
      >
        ← Back
      </button>
      <MessengerPeerAvatar peer={active.peer} className="hidden h-9 w-9 sm:flex" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">
          {formatMessengerPeerLabel(active.peer)}
        </h2>
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
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {active.folder === 'REQUESTS' && onAccept ? (
          <button
            type="button"
            className="mr-1 rounded-lg bg-[var(--color-brand-700)] px-3 py-1.5 text-xs font-semibold text-white"
            onClick={onAccept}
          >
            Accept
          </button>
        ) : null}
        <IconAction label="Audio call" disabled>
          <Phone className="h-[18px] w-[18px] text-[var(--foreground)]" />
        </IconAction>
        <IconAction label="Video call" disabled>
          <Video className="h-[18px] w-[18px] text-[var(--foreground)]" />
        </IconAction>
        <IconAction label="Chat details" active={detailsOpen} onClick={onToggleDetails}>
          <Info className="h-[18px] w-[18px] text-[var(--foreground)]" />
        </IconAction>
      </div>
    </header>
  );
}
