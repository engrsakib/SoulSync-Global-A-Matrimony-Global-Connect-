export const BIODATA_GALLERY_MIN = 3;
export const BIODATA_GALLERY_MAX = 9;

export type BiodataGalleryPhotoDto = {
  id: string;
  url: string;
  sortOrder: number;
  width?: number | null;
  height?: number | null;
};

export type BiodataGalleryReorderDto = {
  photoIds: string[];
};
