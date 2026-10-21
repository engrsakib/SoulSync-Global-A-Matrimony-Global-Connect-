'use client';

import { MediaUpload } from '@soulsync/ui/media/media-upload';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { notifyAuthSessionChanged } from '@/lib/auth-session';

type AccountAvatarUploadProps = {
  className?: string;
};

/** Reusable avatar upload drop zone (settings or admin). */
export function AccountAvatarUpload({ className }: AccountAvatarUploadProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className}>
      <MediaUpload
        mode="image"
        uploadUrl="/api/account/avatar"
        label="Upload profile photo"
        className="max-w-md"
        onError={(message) => setError(message)}
        onSuccess={() => {
          setError(null);
          notifyAuthSessionChanged();
          router.refresh();
        }}
      />
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
