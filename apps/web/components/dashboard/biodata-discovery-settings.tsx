'use client';

import * as React from 'react';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { PHOTO_VISIBILITY_VALUES } from '@soulsync/shared-types/biodata';
import {
  discoverableFromListingVisibility,
  DISCOVERY_RELIGION_MODE_LABELS,
  DISCOVERY_RELIGION_MODES,
  DISCOVERY_RELIGION_PICKER_VALUES,
  listingVisibilityFromDiscoverable,
  PHOTO_VISIBILITY_LABELS,
  type BiodataListingVisibility,
  type DiscoveryReligionMode,
} from '@soulsync/shared-types/biodata-discovery-settings';
import { RELIGION_LABELS } from '@soulsync/shared-types/religion-branches';
import type { Religion } from '@soulsync/shared-types/partner-preference';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { patchBiodataSection } from '@/lib/biodata-api';
import { btnPrimaryMd } from '@/lib/ui-classes';

type BiodataDiscoverySettingsProps = {
  profile: BiodataMeDto['profile'];
};

function SettingToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer gap-3 rounded-xl border border-[var(--border)]/60 p-4">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-700)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
        <span className="text-muted-foreground mt-0.5 block text-xs">{description}</span>
      </span>
    </label>
  );
}

function RadioOption({
  name,
  value,
  checked,
  label,
  description,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
        checked
          ? 'border-[var(--color-brand-700)]/40 bg-[var(--color-brand-700)]/5'
          : 'border-[var(--border)]/60',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-700)]"
      />
      <span>
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
        <span className="text-muted-foreground mt-0.5 block text-xs">{description}</span>
      </span>
    </label>
  );
}

export function BiodataDiscoverySettings({ profile }: BiodataDiscoverySettingsProps) {
  const [listingVisibility, setListingVisibility] = React.useState<BiodataListingVisibility>(() =>
    listingVisibilityFromDiscoverable(profile.isDiscoverable),
  );
  const [religionMode, setReligionMode] = React.useState<DiscoveryReligionMode>(
    () => profile.discoveryReligionMode ?? 'SAME_AS_MINE',
  );
  const [religionAllowList, setReligionAllowList] = React.useState<Religion[]>(
    () => profile.discoveryReligionAllowList ?? [],
  );
  const [photoVisibility, setPhotoVisibility] = React.useState(profile.photoVisibility);
  const [showContactOnlyToAccepted, setShowContactOnlyToAccepted] = React.useState(
    profile.showContactOnlyToAccepted,
  );
  const [hideFromContacts, setHideFromContacts] = React.useState(profile.hideFromContacts);
  const [guardianManaged, setGuardianManaged] = React.useState(profile.guardianManaged);
  const [pending, setPending] = React.useState(false);

  const ownerFaithLabel = RELIGION_LABELS[profile.religion] ?? profile.religion;

  const toggleReligion = (religion: Religion) => {
    setReligionAllowList((prev) =>
      prev.includes(religion) ? prev.filter((r) => r !== religion) : [...prev, religion],
    );
  };

  const save = async () => {
    if (religionMode === 'SELECTED_RELIGIONS' && religionAllowList.length === 0) {
      toast.error('Select at least one religion for your audience.');
      return;
    }
    setPending(true);
    try {
      await patchBiodataSection('privacy', {
        isDiscoverable: discoverableFromListingVisibility(listingVisibility),
        discoveryReligionMode: religionMode,
        discoveryReligionAllowList: religionAllowList,
        photoVisibility,
        showContactOnlyToAccepted,
        hideFromContacts,
        guardianManaged,
      });
      toast.success('Listing and audience settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save settings');
    } finally {
      setPending(false);
    }
  };

  return (
    <DashboardCard title="Listing & audience">
      <div className="space-y-8">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-[var(--foreground)]">Biodata visibility</legend>
          <p className="text-muted-foreground text-xs">
            Controls whether your profile can appear in member search when that feature is available.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <RadioOption
              name="listingVisibility"
              value="PRIVATE"
              checked={listingVisibility === 'PRIVATE'}
              label="Private"
              description="Not listed. Only you manage your biodata."
              onChange={() => setListingVisibility('PRIVATE')}
            />
            <RadioOption
              name="listingVisibility"
              value="PUBLIC"
              checked={listingVisibility === 'PUBLIC'}
              label="Public"
              description="Eligible to appear in member search when launched."
              onChange={() => setListingVisibility('PUBLIC')}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-[var(--foreground)]">Who can view your biodata</legend>
          <p className="text-muted-foreground text-xs">
            Saved for search and discovery. Applies when public listing is enabled.
          </p>
          <div className="grid gap-3">
            {DISCOVERY_RELIGION_MODES.map((mode) => (
              <RadioOption
                key={mode}
                name="religionMode"
                value={mode}
                checked={religionMode === mode}
                label={DISCOVERY_RELIGION_MODE_LABELS[mode]}
                description={
                  mode === 'SAME_AS_MINE'
                    ? `Members who share your faith (${ownerFaithLabel}).`
                    : mode === 'ALL_RELIGIONS'
                      ? 'Members of any religion on SoulSync.'
                      : 'Choose specific faith traditions below.'
                }
                onChange={() => setReligionMode(mode)}
              />
            ))}
          </div>
          {religionMode === 'SELECTED_RELIGIONS' ? (
            <div className="rounded-xl border border-[var(--border)]/60 p-4">
              <Label className="text-xs">Selected religions</Label>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {DISCOVERY_RELIGION_PICKER_VALUES.map((religion) => (
                  <label key={religion} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={religionAllowList.includes(religion)}
                      onChange={() => toggleReligion(religion)}
                      className="h-4 w-4 accent-[var(--color-brand-700)]"
                    />
                    {RELIGION_LABELS[religion]}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectWithChevron
            id="photoVisibility"
            label="Profile photo"
            value={photoVisibility}
            onChange={(event) => setPhotoVisibility(event.target.value as typeof photoVisibility)}
          >
            {PHOTO_VISIBILITY_VALUES.map((value) => (
              <option key={value} value={value}>
                {PHOTO_VISIBILITY_LABELS[value]}
              </option>
            ))}
          </SelectWithChevron>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SettingToggle
            id="showContactOnlyToAccepted"
            label="Contact after mutual accept"
            description="Share contact details only after you accept a proposal."
            checked={showContactOnlyToAccepted}
            onChange={setShowContactOnlyToAccepted}
          />
          <SettingToggle
            id="hideFromContacts"
            label="Hide from people I know"
            description="Reduce visibility to contacts you may already have on the platform."
            checked={hideFromContacts}
            onChange={setHideFromContacts}
          />
          <SettingToggle
            id="guardianManaged"
            label="Guardian-managed profile"
            description="Indicate that a guardian helps manage this biodata."
            checked={guardianManaged}
            onChange={setGuardianManaged}
          />
        </div>

        <div className="flex justify-end border-t border-[var(--border)]/60 pt-4">
          <button type="button" className={btnPrimaryMd} disabled={pending} onClick={() => void save()}>
            {pending ? 'Saving…' : 'Save listing & audience'}
          </button>
        </div>
      </div>
    </DashboardCard>
  );
}
