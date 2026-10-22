'use client';

import * as React from 'react';
import Image from 'next/image';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { cn } from '@soulsync/ui/lib/utils';
import { BiodataGalleryLightbox } from '@/components/biodata/biodata-gallery-lightbox';

type BiodataPhotoGalleryGridProps = {
  photos: BiodataGalleryPhotoDto[];
  className?: string;
  zoomable?: boolean;
};

export function BiodataPhotoGalleryGrid({
  photos,
  className,
  zoomable = true,
}: BiodataPhotoGalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  if (photos.length === 0) {
    return <p className="text-sm text-[var(--muted-foreground)]">No photos to display.</p>;
  }

  return (
    <>
      <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4', className)}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/30 shadow-sm"
          >
            {zoomable ? (
              <button
                type="button"
                className="absolute inset-0 cursor-zoom-in"
                aria-label="View full size photo"
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 240px"
                  draggable={false}
                />
              </button>
            ) : (
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 240px"
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {zoomable && lightboxIndex !== null ? (
        <BiodataGalleryLightbox
          photos={photos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      ) : null}
    </>
  );
}
