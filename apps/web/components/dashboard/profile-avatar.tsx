import { cn } from '@soulsync/ui/lib/utils';
import type { PublicUser } from '@/lib/auth-api';
import { userInitials } from '@/lib/user-display';

const sizeClass = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl sm:h-24 sm:w-24 sm:text-2xl',
} as const;

type ProfileAvatarProps = {
  user: PublicUser;
  size?: keyof typeof sizeClass;
  className?: string;
};

export function ProfileAvatar({ user, size = 'md', className }: ProfileAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] font-semibold text-white shadow-md ring-2 ring-white',
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      {userInitials(user)}
    </div>
  );
}
