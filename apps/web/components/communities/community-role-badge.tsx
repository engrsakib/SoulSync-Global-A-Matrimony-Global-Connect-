import type { CommunityMemberRoleDto } from '@soulsync/shared-types/communities';
import { cn } from '@soulsync/ui/lib/utils';
import { communityRoleLabel } from '@/lib/communities-format';

type CommunityRoleBadgeProps = {
  role: CommunityMemberRoleDto;
  className?: string;
};

export function CommunityRoleBadge({ role, className }: CommunityRoleBadgeProps) {
  const isLeadership = role !== 'MEMBER';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        isLeadership
          ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-900)]'
          : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
        className,
      )}
    >
      {communityRoleLabel(role)}
    </span>
  );
}
