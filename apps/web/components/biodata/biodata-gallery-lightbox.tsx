'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { cn } from '@soulsync/ui/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import '@/styles/bio-protection.css';

type BiodataGalleryLightboxProps = {
  photos: BiodataGalleryPhotoDto[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex?: (index: number) => void;
};

function isBioProtectionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BIO_PROTECTION !== '0';
}

function useGalleryLightboxProtection(
  rootRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  React.useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) {
      return;
    }

    const blockEvent = (event: Event) => {
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'escape' || key === 'arrowleft' || key === 'arrowright' || key === 'tab') {
        return;
      }
      if (key === 'f12') {
        event.preventDefault();
        return;
      }
      const ctrl = event.ctrlKey || event.metaKey;
      if (!ctrl) {
        return;
      }
      if (event.shiftKey && (key === 'i' || key === 'j')) {
        event.preventDefault();
        return;
      }
      if (key === 'u' || key === 's' || key === 'p' || key === 'c') {
        event.preventDefault();
      }
    };

    root.addEventListener('contextmenu', blockEvent, true);
    root.addEventListener('copy', blockEvent, true);
    root.addEventListener('cut', blockEvent, true);
    root.addEventListener('paste', blockEvent, true);
    root.addEventListener('dragstart', blockEvent, true);
    root.addEventListener('selectstart', blockEvent, true);
    root.addEventListener('keydown', onKeyDown, true);

    return () => {
      root.removeEventListener('contextmenu', blockEvent, true);
      root.removeEventListener('copy', blockEvent, true);
      root.removeEventListener('cut', blockEvent, true);
      root.removeEventListener('paste', blockEvent, true);
      root.removeEventListener('dragstart', blockEvent, true);
      root.removeEventListener('selectstart', blockEvent, true);
      root.removeEventListener('keydown', onKeyDown, true);
    };
  }, [enabled, rootRef]);
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, length - 1));
}

export function BiodataGalleryLightbox({
  photos,
  activeIndex,
  onClose,
  onChangeIndex,
}: BiodataGalleryLightboxProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const protectionEnabled = isBioProtectionEnabled();
  useGalleryLightboxProtection(rootRef, protectionEnabled);

  const index = clampIndex(activeIndex, photos.length);
  const photo = photos[index];

  const goPrev = React.useCallback(() => {
    if (photos.length <= 1 || !onChangeIndex) {
      return;
    }
    onChangeIndex((index - 1 + photos.length) % photos.length);
  }, [index, onChangeIndex, photos.length]);

  const goNext = React.useCallback(() => {
    if (photos.length <= 1 || !onChangeIndex) {
      return;
    }
    onChangeIndex((index + 1) % photos.length);
  }, [index, onChangeIndex, photos.length]);

  React.useEffect(() => {
    closeRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  React.useEffect(() => {
    if (!protectionEnabled) {
      return;
    }
    const onBeforePrint = () => {
      onClose();
    };
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, [onClose, protectionEnabled]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose]);

  if (!photo) {
    return null;
  }

  const width = photo.width && photo.width > 0 ? photo.width : 1200;
  const height = photo.height && photo.height > 0 ? photo.height : 1600;
  const unoptimized = photo.url.startsWith('blob:');

  const content = (
    <div
      ref={rootRef}
      className={cn(
        'bio-gallery-lightbox-root fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8',
        protectionEnabled && 'bio-protected-content',
      )}
      role="presentation"
      onClick={onClose}
      onContextMenu={(event) => {
        if (protectionEnabled) {
          event.preventDefault();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" aria-hidden />
      <p className="bio-gallery-lightbox-print-msg" aria-hidden>
        Printing gallery photos is disabled.
      </p>
      <button
        ref={closeRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className={cn(
          'absolute top-4 right-4 z-20 rounded-full bg-black/60 p-2 text-white',
          'transition hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
          'sm:top-6 sm:right-6',
        )}
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gallery photo preview"
        className="bio-gallery-lightbox-media relative z-10 flex max-h-full max-w-full flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        {photos.length > 1 && onChangeIndex ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              className={cn(
                'absolute top-1/2 left-0 z-20 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white',
                'hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                'sm:-left-14',
              )}
              onClick={goPrev}
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              className={cn(
                'absolute top-1/2 right-0 z-20 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white',
                'hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                'sm:-right-14',
              )}
              onClick={goNext}
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        ) : null}

        <div className="relative max-h-[90vh] w-full max-w-[min(100%,56rem)]">
          <Image
            src={photo.url}
            alt=""
            width={width}
            height={height}
            className="pointer-events-none mx-auto max-h-[90vh] w-auto max-w-full object-contain select-none"
            sizes="100vw"
            priority
            draggable={false}
            unoptimized={unoptimized}
          />
        </div>

        {photos.length > 1 ? (
          <p className="mt-3 text-sm text-white/90 tabular-nums select-none">
            {index + 1} / {photos.length}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(content, document.body);
}
