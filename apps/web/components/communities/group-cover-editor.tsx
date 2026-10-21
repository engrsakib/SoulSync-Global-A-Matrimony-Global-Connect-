'use client';

import { useState } from 'react';
import { MediaUpload } from '@soulsync/ui/media/media-upload';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { patchCommunity } from '@/lib/communities-client';

type GroupCoverEditorProps = {
  community: CommunityDto;
  onUpdated: (community: CommunityDto) => void;
  className?: string;
};

export function GroupCoverEditor({ community, onUpdated, className }: GroupCoverEditorProps) {
  const [busy, setBusy] = useState(false);

  async function handleUpload(result: { url?: string; publicId?: string }) {
    if (!result.url) {
      toast.error('Upload did not return a URL');
      return;
    }
    setBusy(true);
    try {
      const updated = await patchCommunity(community.slug, {
        coverImageUrl: result.url,
        coverImagePublicId: result.publicId ?? null,
      });
      toast.success('Cover photo updated');
      onUpdated(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update cover');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity group-hover/cover:pointer-events-auto group-hover/cover:opacity-100 group-focus-within/cover:pointer-events-auto group-focus-within/cover:opacity-100',
        className,
      )}
    >
      <div className="pointer-events-auto rounded-lg bg-black/60 p-1 shadow-lg backdrop-blur-sm">
        <MediaUpload
          mode="image"
          variant="button"
          uploadUrl="/api/media/upload"
          label={busy ? 'Saving…' : 'Edit cover photo'}
          disabled={busy}
          onSuccess={(result) => {
            void handleUpload(result);
          }}
          onError={(message) => toast.error(message)}
        />
      </div>
    </div>
  );
}
