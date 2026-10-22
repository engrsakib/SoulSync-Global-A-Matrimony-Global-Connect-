import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { readApiErrorMessage } from '@soulsync/shared-types';
import { unwrapBffPayload } from '@/lib/bff-unwrap';
import { bffFetch } from '@/lib/bff-fetch';

async function parseBffJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

function galleryBase(managedOwnerUserId?: string | null): string {
  if (managedOwnerUserId) {
    return `/api/biodata/managed/${encodeURIComponent(managedOwnerUserId)}/gallery`;
  }
  return '/api/biodata/gallery';
}

export async function fetchMyGalleryPhotos(
  managedOwnerUserId?: string | null,
): Promise<BiodataGalleryPhotoDto[]> {
  const response = await bffFetch(galleryBase(managedOwnerUserId), { cache: 'no-store' });
  const raw = await parseBffJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not load gallery'));
  }
  return unwrapBffPayload<BiodataGalleryPhotoDto[]>(raw);
}

export async function deleteGalleryPhoto(
  photoId: string,
  managedOwnerUserId?: string | null,
): Promise<BiodataGalleryPhotoDto[]> {
  const response = await bffFetch(
    `${galleryBase(managedOwnerUserId)}/photos/${encodeURIComponent(photoId)}`,
    {
      method: 'DELETE',
    },
  );
  const raw = await parseBffJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Delete failed'));
  }
  return unwrapBffPayload<BiodataGalleryPhotoDto[]>(raw);
}

export async function reorderGalleryPhotos(
  photoIds: string[],
  managedOwnerUserId?: string | null,
): Promise<BiodataGalleryPhotoDto[]> {
  const response = await bffFetch(`${galleryBase(managedOwnerUserId)}/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoIds }),
  });
  const raw = await parseBffJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Reorder failed'));
  }
  return unwrapBffPayload<BiodataGalleryPhotoDto[]>(raw);
}
