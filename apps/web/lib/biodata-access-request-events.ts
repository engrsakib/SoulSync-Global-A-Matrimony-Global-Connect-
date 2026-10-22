export const BIODATA_ACCESS_REQUESTS_CHANGED = 'ss:biodata-access-requests-changed';

export function notifyBiodataAccessRequestsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BIODATA_ACCESS_REQUESTS_CHANGED));
  }
}
