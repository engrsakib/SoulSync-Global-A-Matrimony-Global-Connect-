'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  BIODATA_GALLERY_MAX,
  BIODATA_GALLERY_MIN,
  type BiodataGalleryPhotoDto,
} from '@soulsync/shared-types/biodata-gallery';
import { cn } from '@soulsync/ui/lib/utils';
import { ImagePlus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { BiodataPhotoGalleryGrid } from '@/components/biodata/biodata-photo-gallery-grid';
import { deleteGalleryPhoto, reorderGalleryPhotos } from '@/lib/biodata-gallery-api';
import { ProfileImageUploadDialog } from '@/components/dashboard/profile-image-upload-dialog';
import { btnPrimaryMd } from '@/lib/ui-classes';
import { uploadBiodataGalleryPhotoWithProgress } from '@/lib/upload-with-progress';

type BiodataPhotoGallerySectionProps = {
  galleryPhotos: BiodataGalleryPhotoDto[];
  onChanged: () => void | Promise<void>;
};

function isPendingPhotoId(id: string): boolean {
  return id.startsWith('pending-');
}

function draftSignature(photos: BiodataGalleryPhotoDto[]): string {
  return photos.map((photo) => photo.id).join(',');
}

export function BiodataPhotoGallerySection({
  galleryPhotos,
  onChanged,
}: BiodataPhotoGallerySectionProps) {
  const [editing, setEditing] = React.useState(false);
  const [baselinePhotos, setBaselinePhotos] = React.useState<BiodataGalleryPhotoDto[]>([]);
  const [draftPhotos, setDraftPhotos] = React.useState<BiodataGalleryPhotoDto[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<string[]>([]);
  const [pendingFilesByClientId, setPendingFilesByClientId] = React.useState<Record<string, File>>(
    {},
  );
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [savePending, setSavePending] = React.useState(false);

  const dirty = editing && draftSignature(draftPhotos) !== draftSignature(baselinePhotos);

  const photos = editing ? draftPhotos : galleryPhotos;
  const count = photos.length;
  const canAdd = count < BIODATA_GALLERY_MAX;

  const revokePendingPreviews = React.useCallback((items: BiodataGalleryPhotoDto[]) => {
    for (const photo of items) {
      if (isPendingPhotoId(photo.id) && photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url);
      }
    }
  }, []);

  const enterEdit = () => {
    setBaselinePhotos([...galleryPhotos]);
    setDraftPhotos([...galleryPhotos]);
    setPendingDeleteIds([]);
    setPendingFilesByClientId({});
    setEditing(true);
  };

  const exitEditWithoutSave = () => {
    revokePendingPreviews(draftPhotos);
    setDraftPhotos([]);
    setBaselinePhotos([]);
    setPendingDeleteIds([]);
    setPendingFilesByClientId({});
    setEditing(false);
  };

  const handleCancelEdit = () => {
    if (dirty) {
      const discard = window.confirm('Discard unsaved gallery changes?');
      if (!discard) {
        return;
      }
    }
    exitEditWithoutSave();
  };

  const stagePendingFile = React.useCallback((file: File) => {
    const clientId = `pending-${crypto.randomUUID()}`;
    const previewUrl = URL.createObjectURL(file);
    const row: BiodataGalleryPhotoDto = {
      id: clientId,
      url: previewUrl,
      sortOrder: 0,
    };
    setPendingFilesByClientId((current) => ({ ...current, [clientId]: file }));
    setDraftPhotos((current) => [...current, row]);
  }, []);

  const handleDelete = (photoId: string) => {
    if (isPendingPhotoId(photoId)) {
      setDraftPhotos((current) => {
        const removed = current.find((photo) => photo.id === photoId);
        if (removed?.url.startsWith('blob:')) {
          URL.revokeObjectURL(removed.url);
        }
        return current.filter((photo) => photo.id !== photoId);
      });
      setPendingFilesByClientId((current) => {
        const next = { ...current };
        delete next[photoId];
        return next;
      });
      return;
    }

    setPendingDeleteIds((current) => (current.includes(photoId) ? current : [...current, photoId]));
    setDraftPhotos((current) => current.filter((photo) => photo.id !== photoId));
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draftPhotos.length) {
      return;
    }
    setDraftPhotos((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const handleSave = async () => {
    if (draftPhotos.length > BIODATA_GALLERY_MAX) {
      toast.error(`You can have at most ${BIODATA_GALLERY_MAX} photos`);
      return;
    }
    if (draftPhotos.length < BIODATA_GALLERY_MIN) {
      toast.error(`Add at least ${BIODATA_GALLERY_MIN} photos before saving`);
      return;
    }

    setSavePending(true);
    try {
      for (const photoId of pendingDeleteIds) {
        await deleteGalleryPhoto(photoId);
      }

      const idByClientId = new Map<string, string>();
      for (const photo of draftPhotos) {
        if (!isPendingPhotoId(photo.id)) {
          continue;
        }
        const file = pendingFilesByClientId[photo.id];
        if (!file) {
          continue;
        }
        const uploaded = await uploadBiodataGalleryPhotoWithProgress(file);
        idByClientId.set(photo.id, uploaded.id);
      }

      const finalIds = draftPhotos.map((photo) => {
        if (isPendingPhotoId(photo.id)) {
          const serverId = idByClientId.get(photo.id);
          if (!serverId) {
            throw new Error('Could not upload a staged photo');
          }
          return serverId;
        }
        return photo.id;
      });

      await reorderGalleryPhotos(finalIds);
      await onChanged();
      revokePendingPreviews(draftPhotos);
      setEditing(false);
      setDraftPhotos([]);
      setBaselinePhotos([]);
      setPendingDeleteIds([]);
      setPendingFilesByClientId({});
      toast.success('Gallery saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSavePending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Photo gallery</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Add {BIODATA_GALLERY_MIN}–{BIODATA_GALLERY_MAX} professional photos (JPEG/PNG, max 5MB
            each). Members need your permission to view this section.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold',
            editing
              ? 'border border-[var(--border)] text-[var(--foreground)]'
              : 'bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)]',
          )}
          onClick={() => {
            if (editing) {
              handleCancelEdit();
            } else {
              enterEdit();
            }
          }}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      <p className="mb-4 text-xs font-medium text-[var(--muted-foreground)]">
        {count} / {BIODATA_GALLERY_MAX} photos
        {count > 0 && count < BIODATA_GALLERY_MIN ? (
          <span className="text-amber-700">
            {' '}
            · Add at least {BIODATA_GALLERY_MIN} for a complete gallery
          </span>
        ) : null}
        {editing && dirty ? (
          <span className="text-[var(--color-brand-700)]"> · Unsaved changes</span>
        ) : null}
      </p>

      {!editing ? (
        count === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No photos yet. Choose Edit to upload at least {BIODATA_GALLERY_MIN} photos.
          </p>
        ) : (
          <BiodataPhotoGalleryGrid photos={photos} />
        )
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/30"
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="240px"
                  unoptimized={isPendingPhotoId(photo.id)}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Move earlier"
                      className="rounded-md bg-white/90 p-1 text-[var(--foreground)] disabled:opacity-40"
                      disabled={index === 0}
                      onClick={() => movePhoto(index, -1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move later"
                      className="rounded-md bg-white/90 p-1 text-[var(--foreground)] disabled:opacity-40"
                      disabled={index === photos.length - 1}
                      onClick={() => movePhoto(index, 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove photo"
                    className="rounded-md bg-white/90 p-1 text-red-700"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {canAdd ? (
              <button
                type="button"
                onClick={() => setUploadDialogOpen(true)}
                className={cn(
                  'flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed',
                  'border-[var(--border)] bg-[var(--muted)]/20 text-sm text-[var(--muted-foreground)]',
                  'transition hover:border-[var(--color-brand-700)]/40 hover:bg-[var(--color-brand-50)]/50',
                )}
              >
                <ImagePlus className="h-8 w-8" />
                Add photo
              </button>
            ) : null}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className={btnPrimaryMd}
              disabled={!dirty || savePending}
              onClick={() => void handleSave()}
            >
              {savePending ? 'Saving…' : 'Save section'}
            </button>
          </div>
        </div>
      )}

      <ProfileImageUploadDialog
        open={uploadDialogOpen}
        multiple
        maxFiles={Math.max(0, BIODATA_GALLERY_MAX - count)}
        title="Upload photos"
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={() => {
          toast.message('Photos added to your draft — click Save section when ready');
        }}
        uploadFile={(file) => {
          stagePendingFile(file);
          return Promise.resolve();
        }}
      />
    </section>
  );
}
