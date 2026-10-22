'use client';

import Image from 'next/image';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { cn } from '@soulsync/ui/lib/utils';

type BiodataPhotoGalleryGridProps = {
  photos: BiodataGalleryPhotoDto[];
  className?: string;
};

export function BiodataPhotoGalleryGrid({ photos, className }: BiodataPhotoGalleryGridProps) {
  if (photos.length === 0) {
    return <p className="text-sm text-[var(--muted-foreground)]">No photos to display.</p>;
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4', className)}>
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/30 shadow-sm"
        >
          <Image
            src={photo.url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 240px"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
