'use client';

import { uploadAccountAvatarFromUrl } from '@/lib/account-api';
import { uploadAccountAvatarWithProgress } from '@/lib/upload-with-progress';
import { ProfileImageUploadDialog } from './profile-image-upload-dialog';

type AvatarUploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AvatarUploadDialog({ open, onClose, onSuccess }: AvatarUploadDialogProps) {
  return (
    <ProfileImageUploadDialog
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      uploadFile={async (file, options) => {
        await uploadAccountAvatarWithProgress(file, options);
      }}
      uploadFromUrl={uploadAccountAvatarFromUrl}
    />
  );
}
