'use client';

import { MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import {
  COMMUNITY_REACTION_KINDS,
  type CommunityReactionKindDto,
  type ReactionSummaryDto,
} from '@soulsync/shared-types/communities';
import { clearPostReaction, setPostReaction } from '@/lib/communities-client';
import { copyCommunityPostShareLink } from '@/lib/communities-format';
import { toast } from 'sonner';
import { useState } from 'react';

const REACTION_EMOJI: Record<CommunityReactionKindDto, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  CARE: '🤗',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

type PostEngagementBarProps = {
  slug: string;
  postId: string;
  shareToken: string;
  reactionSummary: ReactionSummaryDto[];
  viewerReaction: CommunityReactionKindDto | null;
  onCommentClick: () => void;
  disabled?: boolean;
};

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

export function PostEngagementBar({
  slug,
  postId,
  shareToken,
  reactionSummary,
  viewerReaction,
  onCommentClick,
  disabled,
}: PostEngagementBarProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localSummary, setLocalSummary] = useState(reactionSummary);
  const [localViewer, setLocalViewer] = useState(viewerReaction);

  const total = localSummary.reduce((acc, row) => acc + row.count, 0);

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
    try {
      if (nextViewer) {
        await setPostReaction(slug, postId, { kind: nextViewer });
      } else {
        await clearPostReaction(slug, postId);
      }
    } catch {
      setLocalViewer(viewerReaction);
      setLocalSummary(reactionSummary);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    try {
      await copyCommunityPostShareLink(shareToken);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <div className="space-y-1 border-t border-[var(--border)]/60 pt-2">
      {total > 0 ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          {localSummary
            .slice(0, 3)
            .map((r) => REACTION_EMOJI[r.kind])
            .join(' ')}{' '}
          {total}
        </p>
      ) : null}
      <div className="relative flex border-t border-[var(--border)]/60">
        <div className="relative flex-1">
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
              'flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium hover:bg-[var(--muted)]/50',
              localViewer && 'text-[var(--color-brand-700)]',
            )}
          >
            {localViewer ? (
              <span aria-hidden>{REACTION_EMOJI[localViewer]}</span>
            ) : (
              <ThumbsUp className="h-4 w-4" aria-hidden />
            )}
            Like
          </button>
          {open && !disabled ? (
            <div
              className="absolute bottom-full left-1/2 z-10 mb-1 flex -translate-x-1/2 gap-0.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1 shadow-lg"
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
        <button
          type="button"
          disabled={disabled}
          onClick={onCommentClick}
          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium hover:bg-[var(--muted)]/50"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Comment
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void handleShare()}
          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium hover:bg-[var(--muted)]/50"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Share
        </button>
      </div>
    </div>
  );
}
