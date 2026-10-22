'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import {
  COMMUNITY_REACTION_KINDS,
  type CommunityReactionKindDto,
  type ReactionSummaryDto,
} from '@soulsync/shared-types/communities';

export const COMMUNITY_REACTION_EMOJI: Record<CommunityReactionKindDto, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  CARE: '🤗',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

export function applyLocalReactionSummary(
  summary: ReactionSummaryDto[],
  prev: CommunityReactionKindDto | null,
  next: CommunityReactionKindDto | null,
): ReactionSummaryDto[] {
  const map = new Map(summary.map((r) => [r.kind, r.count]));
  if (prev) {
    map.set(prev, Math.max(0, (map.get(prev) ?? 0) - 1));
  }
  if (next) {
    map.set(next, (map.get(next) ?? 0) + 1);
  }
  return [...map.entries()]
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);
}

type CommunityReactionPickerProps = {
  reactionSummary: ReactionSummaryDto[];
  viewerReaction: CommunityReactionKindDto | null;
  disabled?: boolean;
  compact?: boolean;
  onPick: (next: {
    reactionSummary: ReactionSummaryDto[];
    viewerReaction: CommunityReactionKindDto | null;
  }) => void | Promise<void>;
};

export function CommunityReactionPicker({
  reactionSummary,
  viewerReaction,
  disabled,
  compact,
  onPick,
}: CommunityReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const total = reactionSummary.reduce((acc, row) => acc + row.count, 0);

  async function pick(kind: CommunityReactionKindDto) {
    if (disabled || busy) {
      return;
    }
    setBusy(true);
    setOpen(false);
    const nextViewer = viewerReaction === kind ? null : kind;
    const nextSummary = applyLocalReactionSummary(reactionSummary, viewerReaction, nextViewer);
    try {
      await onPick({ reactionSummary: nextSummary, viewerReaction: nextViewer });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {total > 0 && !compact ? (
        <span className="text-xs text-[var(--muted-foreground)]">
          {reactionSummary
            .slice(0, 3)
            .map((r) => COMMUNITY_REACTION_EMOJI[r.kind])
            .join(' ')}{' '}
          {total}
        </span>
      ) : null}
      <div className="relative">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            if (viewerReaction) {
              void pick(viewerReaction);
            } else {
              void pick('LIKE');
            }
          }}
          onMouseEnter={() => setOpen(true)}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80',
            viewerReaction && 'text-[var(--color-brand-700)]',
          )}
        >
          {viewerReaction ? (
            <span aria-hidden>{COMMUNITY_REACTION_EMOJI[viewerReaction]}</span>
          ) : (
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
          )}
          Like
        </button>
        {open && !disabled ? (
          <div
            className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1 shadow-lg"
            onMouseLeave={() => setOpen(false)}
          >
            {COMMUNITY_REACTION_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className="rounded-full p-1 text-lg transition-transform hover:scale-125"
                title={kind}
                onClick={() => void pick(kind)}
              >
                {COMMUNITY_REACTION_EMOJI[kind]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
