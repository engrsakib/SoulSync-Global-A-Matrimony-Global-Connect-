'use client';

import { useState } from 'react';
import { Button } from '@soulsync/ui/button';
import type { CommunityCommentDto } from '@soulsync/shared-types/communities';
import { createPostComment, fetchPostComments } from '@/lib/communities-client';
import { AuthorLine } from './author-line';
import { formatRelativeTime } from '@/lib/communities-format';
import { toast } from 'sonner';

type CommentThreadProps = {
  slug: string;
  postId: string;
  initialCount: number;
  disabled?: boolean;
};

export function CommentThread({ slug, postId, initialCount, disabled }: CommentThreadProps) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<CommunityCommentDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  async function load(append: boolean) {
    setLoading(true);
    try {
      const page = await fetchPostComments(slug, postId, append ? cursor ?? undefined : undefined);
      setItems((prev) => (append ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
      setLoaded(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load comments');
    } finally {
      setLoading(false);
    }
  }

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
      setItems((prev) => [...prev, comment]);
      setText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not comment');
    } finally {
      setPosting(false);
    }
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
              className="flex gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a comment…"
                className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm" disabled={posting || !text.trim()}>
                Post
              </Button>
            </form>
          ) : null}

          <ul className="space-y-3">
            {items.map((comment) => (
              <li key={comment.id} className="rounded-lg bg-[var(--muted)]/40 px-3 py-2">
                <AuthorLine
                  author={comment.author}
                  communitySlug={slug}
                  timestamp={formatRelativeTime(comment.createdAt)}
                />
                <p className="mt-1 whitespace-pre-wrap text-sm">{comment.bodyText}</p>
              </li>
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
