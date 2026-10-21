'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type {
  CommunityMemberRoleDto,
  CommunityPostDto,
} from '@soulsync/shared-types/communities';
import {
  canChangeCommunityPostVisibility,
  canDeleteCommunityPost,
  canEditCommunityPost,
} from '@soulsync/shared-types/communities';
import { deleteCommunityPost, patchCommunityPost } from '@/lib/communities-client';
import { CreatePostModal } from './create-post-modal';

type CommunityPostActionsMenuProps = {
  slug: string;
  post: CommunityPostDto;
  viewerUserId: string | null | undefined;
  viewerUsername?: string | null;
  viewerRole: CommunityMemberRoleDto | null | undefined;
  onPostUpdate?: (post: CommunityPostDto) => void;
  onPostRemoved?: (postId: string) => void;
  className?: string;
};

export function CommunityPostActionsMenu({
  slug,
  post,
  viewerUserId,
  viewerUsername,
  viewerRole,
  onPostUpdate,
  onPostRemoved,
  className,
}: CommunityPostActionsMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canEdit = canEditCommunityPost(post, viewerUserId, viewerRole, viewerUsername);
  const canDelete = canDeleteCommunityPost(post, viewerUserId, viewerRole, viewerUsername);
  const canVisibility = canChangeCommunityPostVisibility(post, viewerRole);
  const showPublish = canVisibility && post.status === 'PENDING';
  const showHide = canVisibility && post.status === 'PUBLISHED';

  const hasActions = canEdit || canDelete || showPublish || showHide;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  if (!hasActions) {
    return null;
  }

  async function setVisibility(status: 'PUBLISHED' | 'PENDING') {
    setBusy(true);
    setOpen(false);
    try {
      const updated = await patchCommunityPost(slug, post.id, { status });
      toast.success(status === 'PUBLISHED' ? 'Post is visible in the feed' : 'Post hidden from feed');
      onPostUpdate?.(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update visibility');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!window.confirm('Delete this post? This cannot be undone.')) {
      return;
    }
    setBusy(true);
    setOpen(false);
    try {
      await deleteCommunityPost(slug, post.id);
      toast.success('Post deleted');
      onPostRemoved?.(post.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={rootRef} className={cn('relative shrink-0', className)}>
        <button
          type="button"
          className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Post options"
          disabled={busy}
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg"
          >
            {canEdit ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                onClick={() => {
                  setOpen(false);
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Edit post
              </button>
            ) : null}
            {showPublish ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                onClick={() => void setVisibility('PUBLISHED')}
              >
                <Eye className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Show in feed
              </button>
            ) : null}
            {showHide ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                onClick={() => void setVisibility('PENDING')}
              >
                <EyeOff className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Hide from feed
              </button>
            ) : null}
            {canDelete ? (
              <>
                {canEdit || showPublish || showHide ? (
                  <div className="border-t border-[var(--border)]" role="separator" />
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-[var(--muted)] dark:text-red-400"
                  onClick={() => void confirmDelete()}
                >
                  <Trash2 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  Delete post
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      {canEdit && editOpen ? (
        <CreatePostModal
          key={`edit-${post.id}`}
          open
          slug={slug}
          editPost={post}
          onClose={() => setEditOpen(false)}
          onCreated={(updated) => onPostUpdate?.(updated)}
        />
      ) : null}
    </>
  );
}
