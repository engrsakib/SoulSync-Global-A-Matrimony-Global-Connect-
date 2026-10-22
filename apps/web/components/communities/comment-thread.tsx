'use client';

import { useCallback, useLayoutEffect, useState } from 'react';
import { Button } from '@soulsync/ui/button';
import type { CommunityCommentDto } from '@soulsync/shared-types/communities';
import { createPostComment, fetchPostComments } from '@/lib/communities-client';
import { MentionComposer } from './mention-composer';
import { CommentListItem } from './comment-list-item';
import { toast } from 'sonner';

type CommentThreadProps = {
  slug: string;
  postId: string;
  initialCount: number;
  disabled?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  registerExpand?: (openAndLoad: () => void) => void;
  onCommentAdded?: () => void;
};

function sortComments(list: CommunityCommentDto[]): CommunityCommentDto[] {
  return [...list].sort((a, b) => {
    const rankA = a.pinnedRank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.pinnedRank ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function CommentThread({
  slug,
  postId,
  initialCount,
  disabled,
  expanded: expandedProp,
  onExpandedChange,
  registerExpand,
  onCommentAdded,
}: CommentThreadProps) {
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = expandedProp ?? expandedInternal;
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<CommunityCommentDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(
    async (append: boolean) => {
      setLoading(true);
      try {
        const page = await fetchPostComments(
          slug,
          postId,
          append ? (cursor ?? undefined) : undefined,
        );
        const nextItems = page.items ?? [];
        setItems((prev) => sortComments(append ? [...prev, ...nextItems] : nextItems));
        setCursor(page.nextCursor ?? null);
        setLoaded(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load comments');
      } finally {
        setLoading(false);
      }
    },
    [slug, postId, cursor],
  );

  function setExpanded(next: boolean) {
    if (expandedProp === undefined) {
      setExpandedInternal(next);
    }
    onExpandedChange?.(next);
  }

  const openAndLoad = useCallback(() => {
    if (expandedProp === undefined) {
      setExpandedInternal(true);
    }
    onExpandedChange?.(true);
    if (!loaded && !loading) {
      void load(false);
    }
  }, [expandedProp, onExpandedChange, loaded, loading, load]);

  useLayoutEffect(() => {
    registerExpand?.(openAndLoad);
  }, [registerExpand, openAndLoad]);

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded && !loading) {
      void load(false);
    }
  }

  async function handlePost(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body) {
      return;
    }
    setPosting(true);
    try {
      const comment = await createPostComment(slug, postId, { bodyText: body });
      if (comment?.id) {
        setItems((prev) => sortComments([...prev, comment]));
      }
      setText('');
      onCommentAdded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not comment');
    } finally {
      setPosting(false);
    }
  }

  function handleUpdated(updated: CommunityCommentDto) {
    setItems((prev) => sortComments(prev.map((row) => (row.id === updated.id ? updated : row))));
  }

  function handleRemoved(commentId: string) {
    setItems((prev) => prev.filter((row) => row.id !== commentId));
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)]/60 pt-2">
      <button
        type="button"
        className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        onClick={handleToggle}
      >
        {expanded ? 'Hide comments' : `Comment${initialCount > 0 ? ` · ${initialCount}` : ''}`}
      </button>

      {expanded ? (
        <>
          {!disabled ? (
            <form
              onSubmit={(event) => {
                void handlePost(event);
              }}
              className="flex items-end gap-2"
            >
              <MentionComposer
                slug={slug}
                value={text}
                onChange={setText}
                placeholder="Write a comment…"
                rows={1}
                inputClassName="rounded-full"
              />
              <Button type="submit" size="sm" disabled={posting || !text.trim()}>
                Post
              </Button>
            </form>
          ) : null}

          <ul className="space-y-3">
            {(items ?? []).map((comment) => (
              <CommentListItem
                key={comment.id}
                slug={slug}
                postId={postId}
                comment={comment}
                onUpdated={handleUpdated}
                onRemoved={handleRemoved}
              />
            ))}
          </ul>

          {cursor ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => {
                void load(true);
              }}
            >
              {loading ? 'Loading…' : 'Load more comments'}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
