'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Eye, EyeOff, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import type { CommunityCommentDto } from '@soulsync/shared-types/communities';
import {
  clearCommentReaction,
  createPostComment,
  deletePostComment,
  fetchCommentReplies,
  hidePostComment,
  patchPostComment,
  pinPostComment,
  setCommentReaction,
  unhidePostComment,
} from '@/lib/communities-client';
import { AuthorLine } from './author-line';
import { formatRelativeTime } from '@/lib/communities-format';
import { MentionComposer } from './mention-composer';
import { MentionRichText } from './mention-rich-text';
import { CommentComposer } from './comment-composer';
import { CommunityReactionPicker } from './community-reaction-picker';
import { toast } from 'sonner';

type CommentListItemProps = {
  slug: string;
  postId: string;
  comment: CommunityCommentDto;
  onUpdated: (comment: CommunityCommentDto) => void;
  onRemoved: (commentId: string) => void;
  /** Top-level comment on the post (shows replies thread + pin). */
  isTopLevel?: boolean;
  disabled?: boolean;
  onThreadReplyCreated?: (reply: CommunityCommentDto) => void;
};

export function CommentListItem({
  slug,
  postId,
  comment,
  onUpdated,
  onRemoved,
  isTopLevel = comment.parentCommentId == null,
  disabled,
  onThreadReplyCreated,
}: CommentListItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.bodyText);
  const [busy, setBusy] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyPosting, setReplyPosting] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replies, setReplies] = useState<CommunityCommentDto[]>([]);
  const [replyCount, setReplyCount] = useState(comment.replyCount ?? 0);

  const actions = comment.viewerActions;
  const showModerationMenu =
    isTopLevel &&
    (actions.canEdit ||
      actions.canDelete ||
      actions.canHide ||
      actions.canUnhide ||
      actions.canPin ||
      actions.canUnpin);
  const showReplyMenu =
    !isTopLevel && (actions.canEdit || actions.canDelete || actions.canHide || actions.canUnhide);

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

  async function loadReplies() {
    if (!isTopLevel) {
      return;
    }
    setRepliesLoading(true);
    try {
      const rows = await fetchCommentReplies(slug, postId, comment.id);
      setReplies(rows);
      setRepliesExpanded(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load replies');
    } finally {
      setRepliesLoading(false);
    }
  }

  async function handlePostReply() {
    const body = replyText.trim();
    if (!body) {
      return;
    }
    setReplyPosting(true);
    try {
      const created = await createPostComment(slug, postId, {
        bodyText: body,
        parentCommentId: comment.id,
      });
      setReplyText('');
      setReplyOpen(false);
      if (isTopLevel) {
        setReplies((prev) => [...prev, created]);
        setRepliesExpanded(true);
        setReplyCount((n) => n + 1);
      } else {
        onThreadReplyCreated?.(created);
      }
      toast.success('Reply posted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reply');
    } finally {
      setReplyPosting(false);
    }
  }

  const timestamp = [
    formatRelativeTime(comment.createdAt),
    comment.editedAt ? 'Edited' : null,
    isTopLevel && comment.pinnedRank != null ? 'Pinned' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li
      className={cn(
        'relative rounded-lg bg-[var(--muted)]/40 px-3 py-2',
        !isTopLevel && 'bg-transparent px-0 py-2',
      )}
    >
      <div ref={rootRef} className="relative">
        <AuthorLine
          author={comment.author}
          communitySlug={slug}
          timestamp={timestamp}
          className={showModerationMenu || showReplyMenu ? 'min-w-0 pr-8' : undefined}
        />
        {showModerationMenu || showReplyMenu ? (
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
                {isTopLevel && actions.canPin ? (
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
                {isTopLevel && actions.canUnpin ? (
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

      {isTopLevel && comment.pinnedRank != null ? (
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

      {!editing && !comment.isHidden && !disabled ? (
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <CommunityReactionPicker
            compact
            reactionSummary={comment.reactionSummary}
            viewerReaction={comment.viewerReaction}
            onPick={async (next) => {
              onUpdated({
                ...comment,
                reactionSummary: next.reactionSummary,
                viewerReaction: next.viewerReaction,
              });
              try {
                if (next.viewerReaction) {
                  await setCommentReaction(slug, postId, comment.id, {
                    kind: next.viewerReaction,
                  });
                } else {
                  await clearCommentReaction(slug, postId, comment.id);
                }
              } catch (error) {
                onUpdated({
                  ...comment,
                  reactionSummary: comment.reactionSummary,
                  viewerReaction: comment.viewerReaction,
                });
                toast.error(error instanceof Error ? error.message : 'Could not react');
              }
            }}
          />
          <button
            type="button"
            className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            onClick={() => setReplyOpen((open) => !open)}
          >
            Reply
          </button>
        </div>
      ) : null}

      {replyOpen && !disabled ? (
        <div className="mt-2">
          <CommentComposer
            slug={slug}
            compact
            value={replyText}
            onChange={setReplyText}
            posting={replyPosting}
            placeholder="Write a reply…"
            onSubmit={() => {
              void handlePostReply();
            }}
          />
        </div>
      ) : null}

      {isTopLevel && replyCount > 0 ? (
        <div className="mt-2">
          {!repliesExpanded ? (
            <button
              type="button"
              className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
              disabled={repliesLoading}
              onClick={() => {
                void loadReplies();
              }}
            >
              {repliesLoading
                ? 'Loading replies…'
                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </button>
          ) : (
            <ul className="mt-2 space-y-1 border-l-2 border-[var(--border)]/80 pl-3 sm:pl-4">
              {replies.map((reply) => (
                <CommentListItem
                  key={reply.id}
                  slug={slug}
                  postId={postId}
                  comment={reply}
                  isTopLevel={false}
                  disabled={disabled}
                  onUpdated={(updated) => {
                    setReplies((prev) =>
                      prev.map((row) => (row.id === updated.id ? updated : row)),
                    );
                  }}
                  onRemoved={(id) => {
                    setReplies((prev) => prev.filter((row) => row.id !== id));
                    setReplyCount((n) => Math.max(0, n - 1));
                  }}
                  onThreadReplyCreated={(created) => {
                    setReplies((prev) => [...prev, created]);
                    setReplyCount((n) => n + 1);
                    setRepliesExpanded(true);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
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
