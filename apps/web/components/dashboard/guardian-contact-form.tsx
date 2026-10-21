'use client';

import * as React from 'react';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import {
  GUARDIAN_CONTACT_VIEW_FEE_BDT,
  GUARDIAN_RELATIONSHIP_LABELS,
  GUARDIAN_RELATIONSHIP_VALUES,
  getMarriagePledgeItemsForReligion,
  ISLAM_MARRIAGE_PLEDGE_INTRO,
  marriagePledgesFromProfile,
  resolveGuardianRelationshipValue,
  validateGuardianContactSection,
  type GuardianRelationship,
  type MarriagePledgeKey,
  type MarriagePledgeState,
} from '@soulsync/shared-types/guardian-contact';
import type { Religion } from '@soulsync/shared-types/partner-preference';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { Lock } from 'lucide-react';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { btnPrimaryMd } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const readOnlyClass = cn(inputClass, 'bg-[var(--muted)]/40 text-[var(--muted-foreground)]');

export function GuardianContactForm({
  profile,
  accountEmail,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  accountEmail: string | null;
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [guardianName, setGuardianName] = React.useState(profile.guardianName ?? '');
  const [guardianRelationship, setGuardianRelationship] = React.useState<GuardianRelationship | ''>(
    () => resolveGuardianRelationshipValue(profile.guardianRelationship),
  );
  const [guardianMobile, setGuardianMobile] = React.useState(profile.guardianMobile ?? '');
  const [candidateMobile, setCandidateMobile] = React.useState(profile.candidateMobile ?? '');
  const [pledges, setPledges] = React.useState<MarriagePledgeState>(() =>
    marriagePledgesFromProfile(profile),
  );

  const religion: Religion = profile.religion;
  const pledgeItems = getMarriagePledgeItemsForReligion(religion);
  const introId = 'marriage-pledge-intro';

  const togglePledge = (key: MarriagePledgeKey, checked: boolean) => {
    setPledges((prev) => ({ ...prev, [key]: checked }));
  };

  const guardianRelationshipLabel = guardianRelationship
    ? GUARDIAN_RELATIONSHIP_LABELS[guardianRelationship]
    : '';

  const validationError = validateGuardianContactSection(
    religion,
    {
      guardianName,
      guardianRelationship: guardianRelationshipLabel,
      guardianMobile,
      candidateMobile,
    },
    pledges,
  );

  const handleSave = () => {
    if (validationError) {
      return;
    }
    onSave({
      guardianName: guardianName.trim(),
      guardianRelationship: guardianRelationshipLabel,
      guardianMobile: guardianMobile.trim(),
      candidateMobile: candidateMobile.trim(),
      ...pledges,
    });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-5">
        <div className="mb-4 flex items-start gap-2">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800/80" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Guardian contact information (kept private)
            </h3>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              These details are stored securely and are not shown on your public biodata. Contact
              numbers may only be shared with approved matches according to platform rules. A fee of{' '}
              {GUARDIAN_CONTACT_VIEW_FEE_BDT} BDT may apply when a verified member requests to view
              contact details.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="guardianName">
              Guardian&apos;s name (father / uncle / elder brother)
            </Label>
            <input
              id="guardianName"
              className={cn(inputClass, 'mt-1.5')}
              value={guardianName}
              placeholder="e.g. Md. Abdul Karim"
              onChange={(e) => setGuardianName(e.target.value)}
            />
          </div>
          <SelectWithChevron
            id="guardianRelationship"
            label="Relationship with guardian"
            value={guardianRelationship}
            onChange={(e) => setGuardianRelationship(e.target.value as GuardianRelationship | '')}
          >
            <option value="">Select relationship</option>
            {GUARDIAN_RELATIONSHIP_VALUES.map((value) => (
              <option key={value} value={value}>
                {GUARDIAN_RELATIONSHIP_LABELS[value]}
              </option>
            ))}
          </SelectWithChevron>
          <div>
            <Label htmlFor="guardianMobile">Guardian&apos;s mobile number</Label>
            <input
              id="guardianMobile"
              type="tel"
              className={cn(inputClass, 'mt-1.5')}
              value={guardianMobile}
              placeholder="017xxxxxxxx"
              onChange={(e) => setGuardianMobile(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="candidateMobile">Candidate&apos;s contact number</Label>
            <input
              id="candidateMobile"
              type="tel"
              className={cn(inputClass, 'mt-1.5')}
              value={candidateMobile}
              placeholder="018xxxxxxxx"
              onChange={(e) => setCandidateMobile(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="accountEmailDisplay">Email address</Label>
            <input
              id="accountEmailDisplay"
              className={cn(readOnlyClass, 'mt-1.5')}
              readOnly
              value={accountEmail ?? ''}
              placeholder="Add a verified email in account settings"
            />
            <p className="text-muted-foreground mt-1 text-xs">Account email (used for contact)</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)]/80 pt-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Marriage pledges</h3>
        {religion === 'ISLAM' ? (
          <p id={introId} className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {ISLAM_MARRIAGE_PLEDGE_INTRO}
          </p>
        ) : (
          <p id={introId} className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Please confirm the following commitment before saving this section.
          </p>
        )}

        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">Marriage pledges</legend>
          {pledgeItems.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer gap-3 rounded-lg border border-[var(--border)]/80 bg-white p-3 text-sm leading-snug"
            >
              <input
                type="checkbox"
                className="mt-1 shrink-0"
                checked={pledges[item.key]}
                aria-describedby={introId}
                onChange={(e) => togglePledge(item.key, e.target.checked)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>
      </div>

      {validationError ? (
        <p className="text-destructive text-sm" role="alert">
          {validationError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          className={btnPrimaryMd}
          disabled={pending || Boolean(validationError)}
          onClick={handleSave}
        >
          {pending ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </div>
  );
}
