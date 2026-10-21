'use client';

import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@soulsync/ui/button';
import { Label } from '@soulsync/ui/label';
import { MediaUpload } from '@soulsync/ui/media/media-upload';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type { CommunityPostDto } from '@soulsync/shared-types/communities';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createCommunityPost } from '@/lib/communities-client';
import { fetchWalletSummary } from '@/lib/wallet-api';
import { formatCommunityAuthorUsername } from '@/lib/communities-format';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { CreatePostPreview } from './create-post-preview';

type PendingImage = {
  url: string;
  publicId: string | null;
  key: string;
};

type CreatePostModalProps = {
  open: boolean;
  slug: string;
  onClose: () => void;
  onCreated: (post: CommunityPostDto) => void;
};

export function CreatePostModal({ open, slug, onClose, onCreated }: CreatePostModalProps) {
  const titleId = useId();
  const { user } = useCurrentUser();
  const [text, setText] = useState('');
  const [images, setImages] = useState<PendingImage[]>([]);
  const [scheduleLocal, setScheduleLocal] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    void fetchWalletSummary()
      .then((w) => setTimeZone(w.checkInTimeZone))
      .catch(() => setTimeZone(null));
  }, [open]);

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

  const author = user
    ? {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      }
    : null;

  function attachProfilePhoto() {
    const url = user?.avatarUrl?.trim();
    if (!url || !url.startsWith('https://')) {
      toast.error('Upload a profile photo in My Profile first');
      return;
    }
    setImages((prev) => {
      if (prev.some((img) => img.url === url)) {
        return prev;
      }
      return [...prev, { url, publicId: null, key: `profile-${url}` }];
    });
  }

  function buildPayload(scheduled: boolean) {
    const bodyText = text.trim();
    if (!bodyText && images.length === 0) {
      toast.error('Add text or a photo');
      return null;
    }
    let scheduledPublishAt: string | undefined;
    if (scheduled) {
      if (!scheduleLocal) {
        toast.error('Choose a date and time to schedule');
        return null;
      }
      const when = new Date(scheduleLocal);
      if (Number.isNaN(when.getTime())) {
        toast.error('Invalid schedule time');
        return null;
      }
      scheduledPublishAt = when.toISOString();
    }
    return {
      bodyText: bodyText || null,
      scheduledPublishAt: scheduledPublishAt ?? null,
      images: images.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        sortOrder: index,
      })),
    };
  }

  async function submit(scheduled: boolean) {
    const payload = buildPayload(scheduled);
    if (!payload) {
      return;
    }
    setBusy(true);
    try {
      const post = await createCommunityPost(slug, payload);
      if (post.status === 'SCHEDULED') {
        toast.success('Post scheduled');
      } else if (post.status === 'PENDING') {
        toast.success('Post submitted for review');
      } else {
        toast.success('Post published');
      }
      onCreated(post);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create post');
    } finally {
      setBusy(false);
    }
  }

  const displayName = user ? formatCommunityAuthorUsername(user.username) : '@member';

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 p-0 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-[var(--background)] shadow-2xl sm:my-auto sm:max-h-[92vh] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold">
            Create post
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

        <div className="grid min-h-0 flex-1 lg:grid-cols-2">
          <div className="overflow-y-auto border-[var(--border)] p-4 sm:p-6 lg:border-r">
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AvatarFallback>
                    {(user?.username ?? 'MB').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-semibold">{displayName}</span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={
                user?.firstName ? `What's on your mind, ${user.firstName}?` : "What's on your mind?"
              }
              className="w-full resize-none border-0 bg-transparent text-lg focus-visible:outline-none"
            />

            {images.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {images.map((img) => (
                  <div key={img.key} className="relative h-24 w-24 overflow-hidden rounded-lg">
                    <Image src={img.url} alt="" fill className="object-cover" sizes="96px" />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-black/60 px-1.5 text-xs text-white"
                      onClick={() => setImages((prev) => prev.filter((p) => p.key !== img.key))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              className={cn(
                'mt-4 rounded-xl border border-dashed border-[var(--border)] p-4',
                'flex flex-wrap items-center justify-between gap-2',
              )}
            >
              <p className="text-sm text-[var(--muted-foreground)]">Add photos or videos</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={attachProfilePhoto}>
                  Profile photo
                </Button>
                <MediaUpload
                  mode="image"
                  variant="button"
                  uploadUrl="/api/media/upload"
                  label="Upload"
                  onSuccess={(result) => {
                    if (result.url) {
                      const key = result.publicId ?? result.url ?? `img-${Date.now()}`;
                      setImages((prev) => [
                        ...prev,
                        {
                          url: result.url!,
                          publicId: result.publicId ?? null,
                          key,
                        },
                      ]);
                    }
                  }}
                  onError={(message) => toast.error(message)}
                />
              </div>
            </div>

            {showSchedule ? (
              <div className="mt-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                <Label htmlFor="schedule-datetime">Publish at</Label>
                <input
                  id="schedule-datetime"
                  type="datetime-local"
                  value={scheduleLocal}
                  onChange={(e) => setScheduleLocal(e.target.value)}
                  className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                />
                {timeZone ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Times use your device locale; stored in UTC. Check-in timezone: {timeZone}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="hidden overflow-y-auto bg-[var(--muted)]/20 p-6 lg:block">
            <CreatePostPreview
              author={author}
              bodyText={text}
              images={images.map((img) => ({ url: img.url, key: img.key }))}
            />
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--border)] p-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setShowSchedule((v) => !v);
            }}
          >
            {showSchedule ? 'Hide schedule' : 'Schedule'}
          </Button>
          {showSchedule ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void submit(true)}
            >
              {busy ? 'Scheduling…' : 'Schedule post'}
            </Button>
          ) : null}
          <Button type="button" disabled={busy} onClick={() => void submit(false)}>
            {busy ? 'Posting…' : 'Post'}
          </Button>
        </footer>
      </div>
    </div>
  );
}
