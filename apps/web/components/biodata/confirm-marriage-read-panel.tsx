'use client';

import * as React from 'react';
import type { MemberBiodataConfirmMarriagePanelDto } from '@soulsync/shared-types/biodata-view';
import { ConfirmMarriageChildrenSummary } from '@/components/dashboard/confirm-marriage-children-summary';
import {
  registrySpouseLabelFromArchive,
  registrySpouseLabelFromMarriageRecord,
} from '@/components/dashboard/marriage-child-row';
import {
  MarriageRegistryLockedRecordView,
  RegistryHistoryEntry,
} from '@/components/dashboard/marriage-registry-section';
import { buildMotherSpouseShortNameBySlot } from '@soulsync/shared-types/marriage-record';
import { SoulSyncMarriageReadCard } from '@/components/biodata/soul-sync-marriage-read-card';

export type ConfirmMarriageReadPanelProps = {
  panel: MemberBiodataConfirmMarriagePanelDto;
  ownerUserId: string;
  variant: 'owner' | 'public';
};

export function ConfirmMarriageReadPanel({
  panel,
  ownerUserId,
  variant,
}: ConfirmMarriageReadPanelProps) {
  const { gender, records, archivedRecords } = panel;

  const activeRecords = React.useMemo(
    () => records.filter((record) => record.status === 'CONFIRMED'),
    [records],
  );
  const registryEndedRecords = React.useMemo(
    () => records.filter((record) => record.status === 'DIVORCED' || record.status === 'DECEASED'),
    [records],
  );

  const wifeNameBySlot = React.useMemo(
    () => buildMotherSpouseShortNameBySlot(records, archivedRecords, gender),
    [archivedRecords, gender, records],
  );

  const registrySpouseLabelByConfirmationId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const record of records) {
      const id = record.marriageConfirmationId?.trim();
      if (!id) {
        continue;
      }
      map.set(id, registrySpouseLabelFromMarriageRecord(gender, record, { includeStatus: false }));
    }
    for (const archive of archivedRecords) {
      const id = archive.marriageConfirmationId?.trim();
      if (!id) {
        continue;
      }
      map.set(id, registrySpouseLabelFromArchive(gender, archive, { includeStatus: false }));
    }
    return map;
  }, [gender, records, archivedRecords]);

  const registrySpouseLabelByMarriageDate = React.useMemo(() => {
    const map = new Map<string, string>();
    const add = (marriageDate: string | null | undefined, label: string) => {
      const date = marriageDate?.trim();
      if (!date || map.has(date)) {
        return;
      }
      map.set(date, label);
    };
    for (const record of registryEndedRecords) {
      add(
        record.marriageDate,
        registrySpouseLabelFromMarriageRecord(gender, record, { includeStatus: false }),
      );
    }
    for (const archive of archivedRecords) {
      add(
        archive.marriageDate,
        registrySpouseLabelFromArchive(gender, archive, { includeStatus: false }),
      );
    }
    return map;
  }, [gender, registryEndedRecords, archivedRecords]);

  const soulSyncRegistryLabel = (row: (typeof panel.unlinkedSoulSyncConfirmed)[number]) =>
    registrySpouseLabelByConfirmationId.get(row.id) ??
    (!row.partnerUserId ? registrySpouseLabelByMarriageDate.get(row.marriageDate) : undefined);

  const showPrivateRegistryNote = variant === 'owner';

  const hasUnifiedHistory =
    panel.soulSyncHistory.length > 0 ||
    registryEndedRecords.length > 0 ||
    archivedRecords.length > 0;

  return (
    <div className="space-y-6">
      {panel.unlinkedSoulSyncConfirmed.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">
            {panel.unlinkedSoulSyncConfirmed.length > 1
              ? 'Current SoulSync marriages'
              : 'Current SoulSync marriage'}
          </h3>
          <ul className="mt-3 space-y-3">
            {panel.unlinkedSoulSyncConfirmed.map((row) => (
              <SoulSyncMarriageReadCard
                key={row.id}
                row={row}
                ownerUserId={ownerUserId}
                registrySpouseDisplayLabel={soulSyncRegistryLabel(row)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {activeRecords.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)]">
            Current marriage{activeRecords.length > 1 ? 's' : ''}
          </h3>
          {activeRecords.map((record) => (
            <MarriageRegistryLockedRecordView
              key={record.id}
              record={record}
              gender={gender}
              wifeNameBySlot={wifeNameBySlot}
              registryRecords={records}
              archivedRecords={archivedRecords}
              readOnly
            />
          ))}
        </div>
      ) : null}

      <ConfirmMarriageChildrenSummary
        gender={gender}
        records={records}
        archives={archivedRecords}
        profileDisplayName={panel.ownerDisplayName}
      />

      {hasUnifiedHistory ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)]">History</h3>
          <ul className="mt-3 space-y-3">
            {panel.soulSyncHistory.map((row) => (
              <SoulSyncMarriageReadCard
                key={row.id}
                row={row}
                ownerUserId={ownerUserId}
                registrySpouseDisplayLabel={soulSyncRegistryLabel(row)}
              />
            ))}
            {registryEndedRecords.map((record) => (
              <RegistryHistoryEntry
                key={record.id}
                displayLabel={registrySpouseLabelFromMarriageRecord(gender, record, {
                  includeStatus: false,
                })}
                marriageDate={record.marriageDate}
                statusEndedDate={record.statusEndedDate}
                endedStatus={record.status === 'DECEASED' ? 'DECEASED' : 'DIVORCED'}
                childRecords={record.children}
                showPrivateRegistryNote={showPrivateRegistryNote}
                gender={gender}
                historyEntrySlotIndex={record.slotIndex}
                historySourceKind="record"
                records={records}
                archivedRecords={archivedRecords}
              />
            ))}
            {archivedRecords.map((record) => (
              <RegistryHistoryEntry
                key={record.id}
                displayLabel={registrySpouseLabelFromArchive(gender, record, {
                  includeStatus: false,
                })}
                marriageDate={record.marriageDate}
                statusEndedDate={record.statusEndedDate}
                endedStatus={record.endedStatus}
                childRecords={record.children}
                showPrivateRegistryNote={showPrivateRegistryNote}
                gender={gender}
                historyEntrySlotIndex={record.originalSlotIndex}
                historySourceKind="archive"
                records={records}
                archivedRecords={archivedRecords}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
