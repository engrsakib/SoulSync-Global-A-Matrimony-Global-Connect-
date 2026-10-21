'use client';

import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@soulsync/ui/button';
import { Label } from '@soulsync/ui/label';
import { toast } from 'sonner';
import type { CommunityPostDto } from '@soulsync/shared-types/communities';
import { patchCommunityPost } from '@/lib/communities-client';

type EditCommunityPostDialogProps = {
  open: boolean;
  slug: string;
  post: CommunityPostDto;
  onClose: () => void;
  onSaved: (post: CommunityPostDto) => void;
};

export function EditCommunityPostDialog({
  open,
  slug,
  post,
  onClose,
  onSaved,
}: EditCommunityPostDialogProps) {
  const titleId = useId();
  const [text, setText] = useState(post.bodyText ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const trimmed = text.trim();
  const unchanged = trimmed === (post.bodyText?.trim() ?? '');
  const invalidEmpty = trimmed.length === 0 && post.images.length === 0;

  async function save() {
    if (invalidEmpty) {
      toast.error('Post must include text or at least one image');
      return;
    }
    if (unchanged) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      const updated = await patchCommunityPost(slug, post.id, { bodyText: trimmed || null });
      toast.success('Post updated');
      onSaved(updated);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">
            Edit post
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <Label htmlFor={`${titleId}-body`}>Text</Label>
            <textarea
              id={`${titleId}-body`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="What's on your mind?"
            />
          </div>
          {post.images.length > 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Photos on this post cannot be changed here.
            </p>
          ) : null}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} disabled={busy || invalidEmpty}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </footer>
      </div>
    </div>
  );
}
