'use client';

import { cn } from '@soulsync/ui/lib/utils';
import { Upload } from 'lucide-react';
import type { PublicUser } from '@/lib/auth-api';
import { ProfileAvatar } from './profile-avatar';

type ProfileAvatarUploadTriggerProps = {
  user: PublicUser;
  onClick: () => void;
  className?: string;
};

export function ProfileAvatarUploadTrigger({
  user,
  onClick,
  className,
}: ProfileAvatarUploadTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Upload profile photo"
      className={cn(
        'group relative rounded-full focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
        className,
      )}
    >
      <ProfileAvatar user={user} size="lg" className="transition group-hover:blur-[2px]" />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/25 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        aria-hidden
      >
        <Upload className="h-8 w-8 text-white drop-shadow-md" />
      </span>
    </button>
  );
}
