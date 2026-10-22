import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { readApiErrorMessage } from '@soulsync/shared-types';
import { unwrapBffPayload } from '@/lib/bff-unwrap';

async function parseBffJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export async function fetchMyGalleryPhotos(): Promise<BiodataGalleryPhotoDto[]> {
  const response = await fetch('/api/biodata/gallery', { cache: 'no-store' });
  const raw = await parseBffJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not load gallery'));
  }
  return unwrapBffPayload<BiodataGalleryPhotoDto[]>(raw);
}

export async function deleteGalleryPhoto(photoId: string): Promise<BiodataGalleryPhotoDto[]> {
  const response = await fetch(`/api/biodata/gallery/photos/${encodeURIComponent(photoId)}`, {
    method: 'DELETE',
  });
  const raw = await parseBffJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Delete failed'));
  }
  return unwrapBffPayload<BiodataGalleryPhotoDto[]>(raw);
}

export async function reorderGalleryPhotos(photoIds: string[]): Promise<BiodataGalleryPhotoDto[]> {
  const response = await fetch('/api/biodata/gallery/reorder', {
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
