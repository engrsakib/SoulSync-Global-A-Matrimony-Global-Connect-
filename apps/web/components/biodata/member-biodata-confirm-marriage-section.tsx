'use client';

import type { MemberBiodataConfirmMarriagePanelDto } from '@soulsync/shared-types/biodata-view';
import { ConfirmMarriageReadPanel } from '@/components/biodata/confirm-marriage-read-panel';

export type MemberBiodataConfirmMarriageSectionProps = {
  ownerUserId: string;
  panel: MemberBiodataConfirmMarriagePanelDto;
};

export function MemberBiodataConfirmMarriageSection({
  ownerUserId,
  panel,
}: MemberBiodataConfirmMarriageSectionProps) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Confirm marriage</h2>
      <div className="mt-4">
        <ConfirmMarriageReadPanel panel={panel} ownerUserId={ownerUserId} variant="public" />
      </div>
    </article>
  );
}

export function shouldShowPublicConfirmMarriageSection(
  panel: MemberBiodataConfirmMarriagePanelDto | null,
): boolean {
  return panel != null;
}
