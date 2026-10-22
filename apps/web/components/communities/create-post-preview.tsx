'use client';

import Image from 'next/image';
import { Globe, MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import type { CommunityAuthorDto } from '@soulsync/shared-types/communities';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { formatCommunityAuthorUsername } from '@/lib/communities-format';
import { CommunityPostBody } from './community-post-body';

type PreviewImage = { url: string; key: string };

type CreatePostPreviewProps = {
  author: CommunityAuthorDto | null;
  bodyText: string;
  images: PreviewImage[];
  communitySlug?: string;
};

export function CreatePostPreview({
  author,
  bodyText,
  images,
  communitySlug,
}: CreatePostPreviewProps) {
  const label = author ? formatCommunityAuthorUsername(author.username) : '@you';
  const initials = (author?.username?.slice(0, 2) ?? 'YO').toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <p className="mb-4 text-sm font-medium text-[var(--muted-foreground)]">Preview</p>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border)]/80 bg-[var(--card)] shadow-sm">
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {author?.avatarUrl ? (
                <Image
                  src={author.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-[var(--muted)] text-xs">{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold">{label}</p>
              <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                Just now
                <span aria-hidden>·</span>
                <Globe className="h-3 w-3" aria-hidden />
              </p>
            </div>
          </div>

          {bodyText.trim() ? (
            <CommunityPostBody bodyText={bodyText} communitySlug={communitySlug} />
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] italic">
              Your post text will appear here.
            </p>
          )}

          {images.length > 0 ? (
            <div
              className={
                images.length === 1
                  ? 'relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--muted)]'
                  : 'grid grid-cols-2 gap-1 overflow-hidden rounded-xl'
              }
            >
              {images.map((img) => (
                <div
                  key={img.key}
                  className={
                    images.length === 1
                      ? 'relative h-full w-full'
                      : 'relative aspect-square bg-[var(--muted)]'
                  }
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="320px" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex border-t border-[var(--border)]/60 pt-2">
            <span className="inline-flex flex-1 items-center justify-center gap-1 py-2 text-sm text-[var(--muted-foreground)]">
              <ThumbsUp className="h-4 w-4" aria-hidden />
              Like
            </span>
            <span className="inline-flex flex-1 items-center justify-center gap-1 py-2 text-sm text-[var(--muted-foreground)]">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Comment
            </span>
            <span className="inline-flex flex-1 items-center justify-center gap-1 py-2 text-sm text-[var(--muted-foreground)]">
              <Share2 className="h-4 w-4" aria-hidden />
              Share
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
