'use client';

type SessionExpiredBannerProps = {
  show: boolean;
};

export function SessionExpiredBanner({ show }: SessionExpiredBannerProps) {
  if (!show) {
    return null;
  }
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      Your session expired. Please sign in again.
    </div>
  );
}
