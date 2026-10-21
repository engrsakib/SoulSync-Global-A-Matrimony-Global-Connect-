'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import {
  COMMUNITY_REACTION_KINDS,
  type CommunityReactionKindDto,
  type ReactionSummaryDto,
} from '@soulsync/shared-types/communities';
import { clearPostReaction, setPostReaction } from '@/lib/communities-client';

const REACTION_EMOJI: Record<CommunityReactionKindDto, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  CARE: '🤗',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

type ReactionBarProps = {
  slug: string;
  postId: string;
  reactionSummary: ReactionSummaryDto[];
  viewerReaction: CommunityReactionKindDto | null;
  onChange?: (viewerReaction: CommunityReactionKindDto | null, summary: ReactionSummaryDto[]) => void;
  disabled?: boolean;
};

function totalReactions(summary: ReactionSummaryDto[]): number {
  return summary.reduce((acc, row) => acc + row.count, 0);
}

function applyLocalReaction(
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

export function ReactionBar({
  slug,
  postId,
  reactionSummary,
  viewerReaction,
  onChange,
  disabled,
}: ReactionBarProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localSummary, setLocalSummary] = useState(reactionSummary);
  const [localViewer, setLocalViewer] = useState(viewerReaction);

  const total = totalReactions(localSummary);

  async function pick(kind: CommunityReactionKindDto) {
    if (disabled || busy) {
      return;
    }
    setBusy(true);
    setOpen(false);
    const nextViewer = localViewer === kind ? null : kind;
    const nextSummary = applyLocalReaction(localSummary, localViewer, nextViewer);
    setLocalViewer(nextViewer);
    setLocalSummary(nextSummary);
    onChange?.(nextViewer, nextSummary);
    try {
      if (nextViewer) {
        await setPostReaction(slug, postId, { kind: nextViewer });
      } else {
        await clearPostReaction(slug, postId);
      }
    } catch {
      setLocalViewer(viewerReaction);
      setLocalSummary(reactionSummary);
      onChange?.(viewerReaction, reactionSummary);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex items-center gap-2 border-t border-[var(--border)]/60 pt-2">
      <div className="relative">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            if (localViewer) {
              void pick(localViewer);
            } else {
              void pick('LIKE');
            }
          }}
          onMouseEnter={() => setOpen(true)}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-[var(--muted)]',
            localViewer && 'text-[var(--color-brand-700)]',
          )}
        >
          {localViewer ? (
            <span aria-hidden>{REACTION_EMOJI[localViewer]}</span>
          ) : (
            <ThumbsUp className="h-4 w-4" aria-hidden />
          )}
          {localViewer ? 'Reacted' : 'Like'}
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
                {REACTION_EMOJI[kind]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {total > 0 ? (
        <span className="text-xs text-[var(--muted-foreground)]">
          {localSummary
            .slice(0, 3)
            .map((r) => REACTION_EMOJI[r.kind])
            .join(' ')}{' '}
          {total}
        </span>
      ) : null}
    </div>
  );
}
