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
import { applyLocalReactionSummary, COMMUNITY_REACTION_EMOJI } from './community-reaction-picker';
import { toast } from 'sonner';
import { useState } from 'react';

type PostEngagementBarProps = {
  slug: string;
  postId: string;
  shareToken: string;
  reactionSummary: ReactionSummaryDto[];
  viewerReaction: CommunityReactionKindDto | null;
  onCommentClick: () => void;
  onReactionChange?: (next: {
    reactionSummary: ReactionSummaryDto[];
    viewerReaction: CommunityReactionKindDto | null;
  }) => void;
  disabled?: boolean;
};

export function PostEngagementBar({
  slug,
  postId,
  shareToken,
  reactionSummary,
  viewerReaction,
  onCommentClick,
  onReactionChange,
  disabled,
}: PostEngagementBarProps) {
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
    onReactionChange?.({ reactionSummary: nextSummary, viewerReaction: nextViewer });
    try {
      if (nextViewer) {
        await setPostReaction(slug, postId, { kind: nextViewer });
      } else {
        await clearPostReaction(slug, postId);
      }
    } catch {
      onReactionChange?.({ reactionSummary, viewerReaction });
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
          {reactionSummary
            .slice(0, 3)
            .map((r) => COMMUNITY_REACTION_EMOJI[r.kind])
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
              if (viewerReaction) {
                void pick(viewerReaction);
              } else {
                void pick('LIKE');
              }
            }}
            onMouseEnter={() => setOpen(true)}
            className={cn(
              'flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium hover:bg-[var(--muted)]/50',
              viewerReaction && 'text-[var(--color-brand-700)]',
            )}
          >
            {viewerReaction ? (
              <span aria-hidden>{COMMUNITY_REACTION_EMOJI[viewerReaction]}</span>
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
                  {COMMUNITY_REACTION_EMOJI[kind]}
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
