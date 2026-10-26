'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { UsernameMemberSuggestInput } from '@/components/dashboard/username-member-suggest-input';
import { btnPrimaryLg, formControlClass } from '@/lib/ui-classes';

type MessengerNewChatDialogProps = {
  open: boolean;
  onClose: () => void;
  onStart: (username: string) => Promise<void>;
  busy?: boolean;
};

export function MessengerNewChatDialog({
  open,
  onClose,
  onStart,
  busy = false,
}: MessengerNewChatDialogProps) {
  const [username, setUsername] = React.useState('');

  function handleClose() {
    setUsername('');
    onClose();
  }

  if (!open) {
    return null;
  }

  const normalized = username.trim().replace(/^@+/, '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-labelledby="messenger-new-chat-title"
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="messenger-new-chat-title" className="text-base font-semibold text-[var(--foreground)]">
              New message
            </h2>
            <p className="mt-1 text-sm text-slate-400">Search by username to start an encrypted chat.</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <UsernameMemberSuggestInput
          id="messenger-new-chat-username"
          value={username}
          onChange={setUsername}
          placeholder="Search members…"
          className={cn(formControlClass, 'h-11')}
          disabled={busy}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-slate-300"
            onClick={handleClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(btnPrimaryLg, 'px-5 py-2 text-sm')}
            disabled={busy || normalized.length < 2}
            onClick={() => {
              void onStart(normalized).finally(() => setUsername(''));
            }}
          >
            {busy ? 'Opening…' : 'Start conversation'}
          </button>
        </div>
      </div>
    </div>
  );
}
