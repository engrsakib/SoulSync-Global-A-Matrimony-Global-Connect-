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
  normalizeGuardianContactMessagingForSave,
  normalizeMessagingUsername,
  resolveGuardianRelationshipValue,
  validateGuardianContactSection,
  type GuardianRelationship,
  type MarriagePledgeKey,
  type MarriagePledgeState,
} from '@soulsync/shared-types/guardian-contact';
import { isCountryCode, type CountryCode } from '@soulsync/shared-types/phone';
import type { Religion } from '@soulsync/shared-types/partner-preference';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { Lock } from 'lucide-react';
import { FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { InternationalPhoneField } from '@/components/dashboard/international-phone-field';
import { fetchCountries } from '@/lib/geo/client';
import { btnPrimaryMd } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const readOnlyClass = cn(inputClass, 'bg-[var(--muted)]/40 text-[var(--muted-foreground)]');

function MessagingField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
        {label}
      </Label>
      <input
        id={id}
        className={cn(inputClass, 'mt-1.5')}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

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
  const [guardianTelegram, setGuardianTelegram] = React.useState(
    profile.guardianTelegram ? `@${normalizeMessagingUsername(profile.guardianTelegram)}` : '',
  );
  const [guardianWhatsApp, setGuardianWhatsApp] = React.useState(
    profile.guardianWhatsApp ? `@${normalizeMessagingUsername(profile.guardianWhatsApp)}` : '',
  );
  const [candidateTelegram, setCandidateTelegram] = React.useState(
    profile.candidateTelegram ? `@${normalizeMessagingUsername(profile.candidateTelegram)}` : '',
  );
  const [candidateWhatsApp, setCandidateWhatsApp] = React.useState(
    profile.candidateWhatsApp ? `@${normalizeMessagingUsername(profile.candidateWhatsApp)}` : '',
  );
  const [defaultPhoneCountry, setDefaultPhoneCountry] = React.useState<CountryCode>('BD');
  const [pledges, setPledges] = React.useState<MarriagePledgeState>(() =>
    marriagePledgesFromProfile(profile),
  );

  React.useEffect(() => {
    let cancelled = false;
    void fetchCountries().then((list) => {
      if (cancelled || !profile.country?.trim()) {
        return;
      }
      const countryName = profile.country?.trim();
      if (!countryName) {
        return;
      }
      const match = list.find((c) => c.name.toLowerCase() === countryName.toLowerCase());
      if (match?.alpha2 && isCountryCode(match.alpha2)) {
        setDefaultPhoneCountry(match.alpha2);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile.country]);

  const religion: Religion = profile.religion;
  const pledgeItems = getMarriagePledgeItemsForReligion(religion);
  const introId = 'marriage-pledge-intro';

  const togglePledge = (key: MarriagePledgeKey, checked: boolean) => {
    setPledges((prev) => ({ ...prev, [key]: checked }));
  };

  const guardianRelationshipLabel = guardianRelationship
    ? GUARDIAN_RELATIONSHIP_LABELS[guardianRelationship]
    : '';

  const contactFields = {
    guardianName,
    guardianRelationship: guardianRelationshipLabel,
    guardianMobile,
    candidateMobile,
    guardianTelegram,
    guardianWhatsApp,
    candidateTelegram,
    candidateWhatsApp,
  };

  const validationError = validateGuardianContactSection(religion, contactFields, pledges, {
    defaultPhoneCountry,
  });

  const handleSave = () => {
    if (validationError) {
      return;
    }
    const messaging = normalizeGuardianContactMessagingForSave(contactFields);
    onSave({
      guardianName: guardianName.trim(),
      guardianRelationship: guardianRelationshipLabel,
      guardianMobile: guardianMobile.trim(),
      candidateMobile: candidateMobile.trim(),
      guardianTelegram: messaging.guardianTelegram,
      guardianWhatsApp: messaging.guardianWhatsApp,
      candidateTelegram: messaging.candidateTelegram,
      candidateWhatsApp: messaging.candidateWhatsApp,
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
          <InternationalPhoneField
            key={`guardian-mobile-${defaultPhoneCountry}`}
            id="guardianMobile"
            label="Guardian's mobile number"
            valueE164={guardianMobile}
            defaultCountry={defaultPhoneCountry}
            onChange={setGuardianMobile}
          />
          <InternationalPhoneField
            key={`candidate-mobile-${defaultPhoneCountry}`}
            id="candidateMobile"
            label="Candidate's contact number"
            valueE164={candidateMobile}
            defaultCountry={defaultPhoneCountry}
            onChange={setCandidateMobile}
          />
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

        <div className="mt-6 border-t border-emerald-200/50 pt-5">
          <h4 className="text-sm font-medium text-[var(--foreground)]">Messaging (optional)</h4>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Add Telegram or WhatsApp usernames if you prefer chat over calls. The @ symbol is
            optional. If WhatsApp uses the same number as above, you can leave it blank.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-4">
              <MessagingField
                id="guardianWhatsApp"
                label="Guardian WhatsApp"
                icon={FaWhatsapp}
                value={guardianWhatsApp}
                placeholder="@username"
                onChange={setGuardianWhatsApp}
              />
              <MessagingField
                id="guardianTelegram"
                label="Guardian Telegram"
                icon={FaTelegram}
                value={guardianTelegram}
                placeholder="@username"
                onChange={setGuardianTelegram}
              />
            </div>
            <div className="grid gap-4">
              <MessagingField
                id="candidateWhatsApp"
                label="Candidate WhatsApp"
                icon={FaWhatsapp}
                value={candidateWhatsApp}
                placeholder="@username"
                onChange={setCandidateWhatsApp}
              />
              <MessagingField
                id="candidateTelegram"
                label="Candidate Telegram"
                icon={FaTelegram}
                value={candidateTelegram}
                placeholder="@username"
                onChange={setCandidateTelegram}
              />
            </div>
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
