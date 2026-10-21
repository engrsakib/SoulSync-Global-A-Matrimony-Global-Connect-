export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png'] as const;

export const ALLOWED_GENERIC_MIMES = [...ALLOWED_IMAGE_MIMES, 'application/pdf'] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export type AllowedGenericMime = (typeof ALLOWED_GENERIC_MIMES)[number];
