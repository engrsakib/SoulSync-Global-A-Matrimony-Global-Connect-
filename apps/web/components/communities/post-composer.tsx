'use client';

import { useState } from 'react';
import { Button } from '@soulsync/ui/button';
import { Card, CardContent } from '@soulsync/ui/card';
import { MediaUpload } from '@soulsync/ui/media/media-upload';
import { toast } from 'sonner';
import type { CommunityPostDto } from '@soulsync/shared-types/communities';
import { createCommunityPost } from '@/lib/communities-client';
import Image from 'next/image';

type PendingImage = {
  url: string;
  publicId: string;
};

type PostComposerProps = {
  slug: string;
  onCreated: (post: CommunityPostDto) => void;
};

export function PostComposer({ slug, onCreated }: PostComposerProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<PendingImage[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const bodyText = text.trim();
    if (!bodyText && images.length === 0) {
      toast.error('Add text or a photo');
      return;
    }
    setBusy(true);
    try {
      const post = await createCommunityPost(slug, {
        bodyText: bodyText || null,
        images: images.map((img, index) => ({
          url: img.url,
          publicId: img.publicId,
          sortOrder: index,
        })),
      });
      toast.success(post.status === 'PENDING' ? 'Post submitted for review' : 'Post published');
      setText('');
      setImages([]);
      onCreated(post);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-[var(--border)]/80 shadow-sm">
      <CardContent className="p-4">
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-3"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Write something to the group…"
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          {images.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.publicId} className="relative h-20 w-20 overflow-hidden rounded-lg">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    className="absolute right-0 top-0 bg-black/60 px-1 text-xs text-white"
                    onClick={() => setImages((prev) => prev.filter((p) => p.publicId !== img.publicId))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MediaUpload
              mode="image"
              variant="button"
              uploadUrl="/api/media/upload"
              label="Add photo"
              onSuccess={(result) => {
                if (result.url && result.publicId) {
                  setImages((prev) => [...prev, { url: result.url!, publicId: result.publicId! }]);
                }
              }}
              onError={(message) => toast.error(message)}
            />
            <Button type="submit" disabled={busy}>
              {busy ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
