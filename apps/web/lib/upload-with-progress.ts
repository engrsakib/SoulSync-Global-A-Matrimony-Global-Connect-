import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import type { PublicUser } from '@/lib/auth-api';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export type UploadWithProgressOptions = {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export function uploadAccountAvatarWithProgress(
  file: File,
  options?: UploadWithProgressOptions,
): Promise<PublicUser> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    const onAbort = () => {
      xhr.abort();
    };
    options?.signal?.addEventListener('abort', onAbort, { once: true });

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      options?.signal?.removeEventListener('abort', onAbort);
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText) as unknown;
      } catch {
        reject(new Error('Upload failed'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as PublicUser);
        return;
      }

      const message = (body as { message?: string | string[] }).message;
      const text = Array.isArray(message) ? message.join(', ') : (message ?? 'Upload failed');
      reject(new Error(text));
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', '/api/account/avatar');
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

export function validateAvatarFile(file: File): string | null {
  if (file.size > AVATAR_MAX_BYTES) {
    return 'File must be 5MB or smaller';
  }
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return 'Allowed types: JPEG and PNG';
  }
  return null;
}

export function uploadBiodataGalleryPhotoWithProgress(
  file: File,
  options?: UploadWithProgressOptions,
): Promise<BiodataGalleryPhotoDto> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    const onAbort = () => {
      xhr.abort();
    };
    options?.signal?.addEventListener('abort', onAbort, { once: true });

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      options?.signal?.removeEventListener('abort', onAbort);
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText) as unknown;
      } catch {
        reject(new Error('Upload failed'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (typeof body === 'object' && body !== null && 'data' in body) {
          const wrapped = body as { data: BiodataGalleryPhotoDto };
          resolve(wrapped.data);
          return;
        }
        resolve(body as BiodataGalleryPhotoDto);
        return;
      }

      const message = (body as { message?: string | string[] }).message;
      const text = Array.isArray(message) ? message.join(', ') : (message ?? 'Upload failed');
      reject(new Error(text));
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', '/api/biodata/gallery/photos');
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

export { AVATAR_MAX_BYTES };
