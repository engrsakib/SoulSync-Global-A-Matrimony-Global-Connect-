'use client';

import Link from 'next/link';
import type { MarriageConfirmationDto } from '@soulsync/shared-types/marriage-confirmation';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import { UserRound } from 'lucide-react';
import {
  MarriageStatusBadge,
  marriageStatusBadgeVariantFromConfirmation,
} from '@/components/dashboard/marriage-status-badge';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';
import { memberRoutes } from '@/lib/member-routes';

function partnerLabel(row: MarriageConfirmationDto, ownerUserId: string): string {
  const partner = row.initiatorUserId === ownerUserId ? row.partner : row.initiator;
  if (!partner) {
    return 'Member';
  }
  return (
    formatMemberDisplayName(partner.displayName, partner.username ?? '') ??
    partner.username ??
    'Member'
  );
}

function marriageStatusLabel(row: MarriageConfirmationDto): string {
  if (row.status === 'CONFIRMED') {
    return 'Confirmed';
  }
  if (row.status === 'DIVORCED') {
    return 'Divorced';
  }
  if (row.status === 'DECEASED') {
    return 'Deceased';
  }
  return row.status;
}

export type SoulSyncMarriageReadCardProps = {
  row: MarriageConfirmationDto;
  ownerUserId: string;
  registrySpouseDisplayLabel?: string | null;
};

export function SoulSyncMarriageReadCard({
  row,
  ownerUserId,
  registrySpouseDisplayLabel,
}: SoulSyncMarriageReadCardProps) {
  const isLinked = row.partnerUserId != null;
  const isInitiator = row.initiatorUserId === ownerUserId;
  const linkedPartner = isLinked ? (isInitiator ? row.partner : row.initiator) : null;
  const label = isLinked
    ? partnerLabel(row, ownerUserId)
    : registrySpouseDisplayLabel?.trim() || 'Spouse not on SoulSync';
  const username = linkedPartner?.username?.trim();
  const href = username ? memberRoutes.memberBiodata(username) : null;
  const initial = (username ?? label).slice(0, 1).toUpperCase();

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[var(--border)]/70 bg-[var(--muted)]/15 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        {isLinked ? (
          <Avatar className="h-11 w-11 shrink-0 ring-2 ring-[var(--background)]">
            {linkedPartner?.avatarUrl ? <AvatarImage src={linkedPartner.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-[var(--color-brand-700)]/10 text-sm font-semibold text-[var(--color-brand-800)]">
              {initial}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)]/10 ring-2 ring-[var(--background)]">
            <UserRound className="h-5 w-5 text-[var(--color-brand-800)]" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {href ? (
              <Link
                href={href}
                className="truncate text-sm font-semibold text-[var(--foreground)] hover:underline"
              >
                {label}
              </Link>
            ) : (
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{label}</p>
            )}
            <MarriageStatusBadge
              label={marriageStatusLabel(row)}
              variant={marriageStatusBadgeVariantFromConfirmation(row.status, false)}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Marriage date: {row.marriageDate}
            {!isLinked ? ' · Private registry entry' : ' · SoulSync member linked'}
          </p>
        </div>
      </div>
    </li>
  );
}
