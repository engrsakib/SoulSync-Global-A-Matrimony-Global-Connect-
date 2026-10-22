'use client';

import * as React from 'react';
import Link from 'next/link';
import type {
  BiodataSectionVisibilityMode,
  BiodataSectionVisibilityRowDto,
  BiodataVisibilityPolicyDto,
} from '@soulsync/shared-types/biodata-visibility';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { BiodataDiscoverySettings } from '@/components/dashboard/biodata-discovery-settings';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { patchBiodataVisibilityPolicy } from '@/lib/biodata-visibility-api';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { btnPrimaryMd, dashboardPageTitle } from '@/lib/ui-classes';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';

type BiodataSettingsProps = {
  initialProfile: BiodataMeDto['profile'];
  initialPolicy: BiodataVisibilityPolicyDto;
};

export function BiodataSettings({ initialProfile, initialPolicy }: BiodataSettingsProps) {
  const [sections, setSections] = React.useState(() => initialPolicy.sections);
  const [policyDirty, setPolicyDirty] = React.useState(false);
  const [policyPending, setPolicyPending] = React.useState(false);

  const setSectionMode = (sectionId: string, mode: BiodataSectionVisibilityMode) => {
    setSections((prev) =>
      prev.map((row) => (row.sectionId === sectionId ? { ...row, mode } : row)),
    );
    setPolicyDirty(true);
  };

  const savePolicy = async () => {
    setPolicyPending(true);
    try {
      const configurable = sections.filter((row) => !row.locked);
      const policy = await patchBiodataVisibilityPolicy({
        sections: configurable.map((row) => ({
          sectionId: row.sectionId,
          mode: row.mode,
        })),
      });
      setSections(policy.sections);
      setPolicyDirty(false);
      toast.success('Visibility settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save settings');
    } finally {
      setPolicyPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={dashboardPageTitle}>Biodata settings</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Manage how your biodata is listed, who can discover it, and which sections require your
          approval. Personal details are always visible. Section rules apply when members view
          biodata on the platform.
        </p>
      </div>

      <BiodataDiscoverySettings profile={initialProfile} />

      <DashboardCard title="Who can see each section">
        <ul className="divide-y divide-[var(--border)]/60">
          {sections.map((row) => (
            <SectionVisibilityRow key={row.sectionId} row={row} onModeChange={setSectionMode} />
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={dashboardRoutes.biodataPermissionRequests}
            className="text-sm font-medium text-[var(--color-brand-700)] hover:underline"
          >
            Manage permission requests
          </Link>
          <button
            type="button"
            className={btnPrimaryMd}
            disabled={!policyDirty || policyPending}
            onClick={() => void savePolicy()}
          >
            {policyPending ? 'Saving…' : 'Save section visibility'}
          </button>
        </div>
      </DashboardCard>
    </div>
  );
}

function SectionVisibilityRow({
  row,
  onModeChange,
}: {
  row: BiodataSectionVisibilityRowDto;
  onModeChange: (sectionId: string, mode: BiodataSectionVisibilityMode) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{row.title}</p>
        {row.locked ? (
          <p className="text-muted-foreground text-xs">
            {row.sectionId === 'photo_gallery'
              ? 'Always requires your permission'
              : 'Always public'}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            {row.mode === 'DIRECT'
              ? 'Visible to everyone without your approval'
              : 'Requires your approval before viewing'}
          </p>
        )}
      </div>
      {row.locked ? (
        <span
          className={cn(
            'inline-flex h-9 items-center rounded-full border border-[var(--border)] px-3 text-xs font-medium',
            'text-muted-foreground bg-[var(--muted)]/40',
          )}
        >
          {row.sectionId === 'photo_gallery' ? 'Permission required' : 'Always visible'}
        </span>
      ) : (
        <SelectWithChevron
          label=""
          value={row.mode}
          onChange={(event) =>
            onModeChange(row.sectionId, event.target.value as BiodataSectionVisibilityMode)
          }
          className="w-full min-w-[11rem] sm:w-auto"
          aria-label={`Visibility for ${row.title}`}
        >
          <option value="DIRECT">Visible to everyone</option>
          <option value="REQUEST">Requires my approval</option>
        </SelectWithChevron>
      )}
    </li>
  );
}
