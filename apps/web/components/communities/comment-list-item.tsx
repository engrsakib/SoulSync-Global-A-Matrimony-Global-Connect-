'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Eye, EyeOff, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import type { CommunityCommentDto } from '@soulsync/shared-types/communities';
import {
  deletePostComment,
  hidePostComment,
  patchPostComment,
  pinPostComment,
  unhidePostComment,
} from '@/lib/communities-client';
import { AuthorLine } from './author-line';
import { formatRelativeTime } from '@/lib/communities-format';
import { MentionComposer } from './mention-composer';
import { MentionRichText } from './mention-rich-text';
import { toast } from 'sonner';

type CommentListItemProps = {
  slug: string;
  postId: string;
  comment: CommunityCommentDto;
  onUpdated: (comment: CommunityCommentDto) => void;
  onRemoved: (commentId: string) => void;
};

export function CommentListItem({
  slug,
  postId,
  comment,
  onUpdated,
  onRemoved,
}: CommentListItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.bodyText);
  const [busy, setBusy] = useState(false);

  const actions = comment.viewerActions;
  const hasMenu =
    actions.canEdit ||
    actions.canDelete ||
    actions.canHide ||
    actions.canUnhide ||
    actions.canPin ||
    actions.canUnpin;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [menuOpen]);

  async function runAction(fn: () => Promise<CommunityCommentDto>, success: string) {
    setBusy(true);
    try {
      const updated = await fn();
      onUpdated(updated);
      toast.success(success);
      setMenuOpen(false);
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  const timestamp = [
    formatRelativeTime(comment.createdAt),
    comment.editedAt ? 'Edited' : null,
    comment.pinnedRank != null ? 'Pinned' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="relative rounded-lg bg-[var(--muted)]/40 px-3 py-2">
      <div ref={rootRef} className="relative">
        <AuthorLine
          author={comment.author}
          communitySlug={slug}
          timestamp={timestamp}
          className={hasMenu ? 'min-w-0 pr-8' : undefined}
        />
        {hasMenu ? (
          <>
            <button
              type="button"
              aria-label="Comment actions"
              disabled={busy}
              className="absolute top-0 right-0 rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div className="absolute top-8 right-0 z-10 min-w-[10rem] rounded-md border border-[var(--border)] bg-[var(--background)] py-1 shadow-md">
                {actions.canEdit ? (
                  <MenuItem
                    icon={Pencil}
                    label="Edit"
                    onClick={() => {
                      setEditText(comment.isHidden ? '' : comment.bodyText);
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  />
                ) : null}
                {actions.canPin ? (
                  <MenuItem
                    icon={Pin}
                    label="Pin"
                    onClick={() => {
                      void runAction(
                        () => pinPostComment(slug, postId, comment.id, { pinned: true }),
                        'Comment pinned',
                      );
                    }}
                  />
                ) : null}
                {actions.canUnpin ? (
                  <MenuItem
                    icon={PinOff}
                    label="Unpin"
                    onClick={() => {
                      void runAction(
                        () => pinPostComment(slug, postId, comment.id, { pinned: false }),
                        'Comment unpinned',
                      );
                    }}
                  />
                ) : null}
                {actions.canHide ? (
                  <MenuItem
                    icon={EyeOff}
                    label="Hide"
                    onClick={() => {
                      void runAction(
                        () => hidePostComment(slug, postId, comment.id),
                        'Comment hidden',
                      );
                    }}
                  />
                ) : null}
                {actions.canUnhide ? (
                  <MenuItem
                    icon={Eye}
                    label="Unhide"
                    onClick={() => {
                      void runAction(
                        () => unhidePostComment(slug, postId, comment.id),
                        'Comment visible again',
                      );
                    }}
                  />
                ) : null}
                {actions.canDelete ? (
                  <MenuItem
                    icon={Trash2}
                    label="Delete"
                    destructive
                    onClick={() => {
                      if (!window.confirm('Delete this comment?')) {
                        return;
                      }
                      void (async () => {
                        setBusy(true);
                        try {
                          await deletePostComment(slug, postId, comment.id);
                          onRemoved(comment.id);
                          toast.success('Comment deleted');
                          setMenuOpen(false);
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : 'Action failed');
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {comment.pinnedRank != null ? (
        <span className="mt-1 inline-block rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
          Pinned
        </span>
      ) : null}

      {editing ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const body = editText.trim();
            if (!body) {
              return;
            }
            void runAction(
              () => patchPostComment(slug, postId, comment.id, { bodyText: body }),
              'Comment updated',
            );
          }}
        >
          <MentionComposer slug={slug} value={editText} onChange={setEditText} rows={3} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || !editText.trim()}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-1 text-sm whitespace-pre-wrap">
          {comment.isHidden ? (
            <span className="text-[var(--muted-foreground)] italic">{comment.bodyText}</span>
          ) : (
            <MentionRichText text={comment.bodyText} communitySlug={slug} />
          )}
        </p>
      )}
    </li>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]',
        destructive && 'text-red-600',
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}
