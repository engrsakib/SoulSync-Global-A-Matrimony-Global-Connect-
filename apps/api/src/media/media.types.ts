export type UploadResult = {
  url: string;
  publicId: string;
  resourceType: 'image' | 'raw';
  bytes: number;
};

/** In-memory upload from Nest `FileInterceptor` (multer memory storage). */
export type UploadedFilePayload = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};
