import { cn } from '@soulsync/ui/lib/utils';

export type MarriageStatusBadgeVariant =
  | 'confirmed'
  | 'divorce_pending'
  | 'divorced'
  | 'deceased'
  | 'pending'
  | 'cancelled'
  | 'declined'
  | 'muted';

const variantClasses: Record<MarriageStatusBadgeVariant, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-800',
  divorce_pending: 'bg-amber-500/15 text-amber-900',
  divorced: 'bg-orange-500/15 text-orange-900',
  deceased: 'bg-red-500/15 text-red-900',
  pending: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  cancelled: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  declined: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  muted: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
};

export function marriageStatusBadgeVariantFromConfirmation(
  status: string,
  divorcePending: boolean,
): MarriageStatusBadgeVariant {
  if (status === 'CONFIRMED' && divorcePending) {
    return 'divorce_pending';
  }
  if (status === 'CONFIRMED') {
    return 'confirmed';
  }
  if (status === 'DIVORCED') {
    return 'divorced';
  }
  if (status === 'DECEASED') {
    return 'deceased';
  }
  if (status === 'PENDING') {
    return 'pending';
  }
  if (status === 'CANCELLED') {
    return 'cancelled';
  }
  if (status === 'DECLINED') {
    return 'declined';
  }
  return 'muted';
}

export function marriageStatusBadgeVariantFromRecordStatus(
  status: string,
): MarriageStatusBadgeVariant {
  if (status === 'CONFIRMED') {
    return 'confirmed';
  }
  if (status === 'DIVORCED') {
    return 'divorced';
  }
  if (status === 'DECEASED') {
    return 'deceased';
  }
  if (status === 'DRAFT') {
    return 'pending';
  }
  return 'muted';
}

export function MarriageStatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: MarriageStatusBadgeVariant;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
        variantClasses[variant],
      )}
    >
      {label}
    </span>
  );
}
