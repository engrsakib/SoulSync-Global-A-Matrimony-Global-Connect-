'use client';

import { useState } from 'react';
import { Card, CardContent } from '@soulsync/ui/card';
import type { CommunityPostDto } from '@soulsync/shared-types/communities';
import { CreatePostModal } from './create-post-modal';

type PostComposerProps = {
  slug: string;
  onCreated: (post: CommunityPostDto) => void;
};

export function PostComposer({ slug, onCreated }: PostComposerProps) {
  const [open, setOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  return (
    <>
      <Card className="border-[var(--border)]/80 shadow-sm">
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => {
              setModalKey((k) => k + 1);
              setOpen(true);
            }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-left text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]/40"
          >
            Write something to the group…
          </button>
        </CardContent>
      </Card>
      <CreatePostModal
        key={modalKey}
        open={open}
        slug={slug}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
}
