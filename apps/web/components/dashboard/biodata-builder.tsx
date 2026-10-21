'use client';

import * as React from 'react';
import {
  GENDER_VALUES,
  MARITAL_STATUS_VALUES,
  RELIGION_VALUES,
} from '@soulsync/shared-types/partner-preference';
import { BIODATA_SECTION_IDS, PHOTO_VISIBILITY_VALUES } from '@soulsync/shared-types/biodata';
import type { BiodataMeDto, BiodataSectionId } from '@soulsync/shared-types/biodata';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { fetchMyBiodata, patchBiodataSection } from '@/lib/biodata-api';
import { useGeoLocation } from '@/lib/geo/use-geo-location';
import { btnPrimaryMd, dashboardPageTitle } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const SECTION_TITLES: Record<BiodataSectionId, string> = {
  basic: 'Personal details',
  location: 'Location',
  education_career: 'Education & career',
  faith: 'Faith & community',
  privacy: 'Privacy & discovery',
  my_attributes: 'About me (for matching)',
  partner: 'Partner preferences',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || '—'}</p>
    </div>
  );
}

function isoDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

type BiodataBuilderProps = {
  initialBiodata: BiodataMeDto;
};

export function BiodataBuilder({ initialBiodata }: BiodataBuilderProps) {
  const [data, setData] = React.useState(initialBiodata);
  const [editing, setEditing] = React.useState<BiodataSectionId | null>(null);
  const [pending, setPending] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const next = await fetchMyBiodata();
    setData(next);
  }, []);

  const saveSection = async (sectionId: BiodataSectionId, body: Record<string, unknown>) => {
    setPending(true);
    try {
      const next = await patchBiodataSection(sectionId, body);
      setData(next);
      setEditing(null);
      toast.success('Biodata saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setPending(false);
    }
  };

  const p = data.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className={dashboardPageTitle}>Biodata</h1>
        <div className="text-sm text-[var(--muted-foreground)]">
          Completeness:{' '}
          <span className="font-semibold text-[var(--color-brand-700)]">
            {p.completenessScore}%
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm">
        <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--color-brand-700)] transition-all"
            style={{ width: `${Math.min(100, p.completenessScore)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          Complete each section to improve discoverability. Sensitive fields are encrypted on the
          server.
        </p>
      </section>

      {BIODATA_SECTION_IDS.map((sectionId) => (
        <DashboardCard
          key={sectionId}
          title={SECTION_TITLES[sectionId]}
          editLabel={editing === sectionId ? 'Cancel' : 'Edit'}
          editHref={undefined}
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className={cn(
                'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold',
                editing === sectionId
                  ? 'border border-[var(--border)] text-[var(--foreground)]'
                  : 'bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)]',
              )}
              onClick={() => setEditing((current) => (current === sectionId ? null : sectionId))}
            >
              {editing === sectionId ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {sectionId === 'basic' && editing !== 'basic' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Display name" value={p.displayName} />
              <Field label="Gender" value={p.gender} />
              <Field label="Date of birth" value={isoDateInputValue(p.dateOfBirth)} />
              <Field label="Height (cm)" value={p.heightCm != null ? String(p.heightCm) : '—'} />
              <Field label="Marital status" value={p.maritalStatus} />
            </div>
          ) : null}

          {sectionId === 'basic' && editing === 'basic' ? (
            <BasicForm
              profile={p}
              pending={pending}
              onSave={(body) => void saveSection('basic', body)}
            />
          ) : null}

          {sectionId === 'location' && editing !== 'location' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Country" value={p.country} />
              <Field label="State / province" value={p.stateRegion ?? '—'} />
              <Field label="City" value={p.city} />
              <Field label="Postal code" value={p.postalCode ?? '—'} />
              <Field label="Mother tongue" value={p.motherTongue ?? '—'} />
            </div>
          ) : null}

          {sectionId === 'location' && editing === 'location' ? (
            <LocationForm
              profile={p}
              pending={pending}
              onSave={(body) => void saveSection('location', body)}
            />
          ) : null}

          {sectionId === 'education_career' && editing !== 'education_career' ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Education" value={p.education ?? '—'} />
              <Field label="Occupation" value={p.occupation ?? '—'} />
              <div className="sm:col-span-2">
                <Field label="Bio" value={p.bio ?? '—'} />
              </div>
            </div>
          ) : null}

          {sectionId === 'education_career' && editing === 'education_career' ? (
            <EducationForm
              profile={p}
              pending={pending}
              onSave={(body) => void saveSection('education_career', body)}
            />
          ) : null}

          {sectionId === 'faith' && editing !== 'faith' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Religion" value={p.religion} />
              <Field label="Denomination" value={p.denomination ?? '—'} />
              <Field label="Community" value={p.community ?? '—'} />
              <Field label="Religious practice" value={p.religiousPractice ?? '—'} />
            </div>
          ) : null}

          {sectionId === 'faith' && editing === 'faith' ? (
            <FaithForm
              profile={p}
              pending={pending}
              onSave={(body) => void saveSection('faith', body)}
            />
          ) : null}

          {sectionId === 'privacy' && editing !== 'privacy' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Photo visibility" value={p.photoVisibility} />
              <Field label="Discoverable" value={p.isDiscoverable ? 'Yes' : 'No'} />
              <Field
                label="Contact after accept only"
                value={p.showContactOnlyToAccepted ? 'Yes' : 'No'}
              />
              <Field label="Hide from contacts" value={p.hideFromContacts ? 'Yes' : 'No'} />
              <Field label="Guardian managed" value={p.guardianManaged ? 'Yes' : 'No'} />
            </div>
          ) : null}

          {sectionId === 'privacy' && editing === 'privacy' ? (
            <PrivacyForm
              profile={p}
              pending={pending}
              onSave={(body) => void saveSection('privacy', body)}
            />
          ) : null}

          {sectionId === 'my_attributes' && editing !== 'my_attributes' ? (
            data.myPreference ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Gender" value={data.myPreference.gender} />
                <Field label="District" value={data.myPreference.district ?? '—'} />
                <Field label="Country" value={data.myPreference.country ?? '—'} />
                <Field
                  label="Willing to relocate"
                  value={data.myPreference.willingToRelocate ? 'Yes' : 'No'}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                Not started — click Edit to add.
              </p>
            )
          ) : null}

          {sectionId === 'my_attributes' && editing === 'my_attributes' ? (
            <MyAttributesForm
              myPreference={data.myPreference}
              profileGender={p.gender}
              pending={pending}
              onSave={(body) => void saveSection('my_attributes', body)}
            />
          ) : null}

          {sectionId === 'partner' && editing !== 'partner' ? (
            data.partnerPreference ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Age range"
                  value={`${data.partnerPreference.minAge} – ${data.partnerPreference.maxAge}`}
                />
                <Field
                  label="Preferred countries"
                  value={data.partnerPreference.preferredCountries.join(', ') || '—'}
                />
                <Field
                  label="Preferred religions"
                  value={data.partnerPreference.preferredReligions.join(', ') || '—'}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                Not started — click Edit to add.
              </p>
            )
          ) : null}

          {sectionId === 'partner' && editing === 'partner' ? (
            <PartnerForm
              partnerPreference={data.partnerPreference}
              pending={pending}
              onSave={(body) => void saveSection('partner', body)}
            />
          ) : null}
        </DashboardCard>
      ))}

      <button
        type="button"
        className="text-sm text-[var(--color-brand-700)] underline-offset-2 hover:underline"
        onClick={() => void refresh()}
      >
        Refresh biodata
      </button>
    </div>
  );
}

function SaveRow({ pending, onSave }: { pending: boolean; onSave: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <button type="button" className={btnPrimaryMd} disabled={pending} onClick={onSave}>
        {pending ? 'Saving…' : 'Save section'}
      </button>
    </div>
  );
}

function BasicForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [displayName, setDisplayName] = React.useState(profile.displayName);
  const [gender, setGender] = React.useState(profile.gender);
  const [dateOfBirth, setDateOfBirth] = React.useState(isoDateInputValue(profile.dateOfBirth));
  const [heightCm, setHeightCm] = React.useState(profile.heightCm?.toString() ?? '');
  const [maritalStatus, setMaritalStatus] = React.useState(profile.maritalStatus);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="displayName">Display name</Label>
        <input
          id="displayName"
          className={inputClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          className={inputClass}
          value={gender}
          onChange={(e) => setGender(e.target.value as typeof gender)}
        >
          {GENDER_VALUES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="dob">Date of birth</Label>
        <input
          id="dob"
          type="date"
          className={inputClass}
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="height">Height (cm)</Label>
        <input
          id="height"
          type="number"
          className={inputClass}
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="marital">Marital status</Label>
        <select
          id="marital"
          className={inputClass}
          value={maritalStatus}
          onChange={(e) => setMaritalStatus(e.target.value as typeof maritalStatus)}
        >
          {MARITAL_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            displayName,
            gender,
            dateOfBirth,
            heightCm: heightCm ? Number(heightCm) : null,
            maritalStatus,
          })
        }
      />
    </div>
  );
}

function LocationForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [country, setCountry] = React.useState(profile.country);
  const [stateRegion, setStateRegion] = React.useState(profile.stateRegion ?? '');
  const [stateIso, setStateIso] = React.useState('');
  const [city, setCity] = React.useState(profile.city);
  const [postalCode, setPostalCode] = React.useState(profile.postalCode ?? '');
  const [motherTongue, setMotherTongue] = React.useState(profile.motherTongue ?? '');
  const [countryFilter, setCountryFilter] = React.useState('');
  const [postalHint, setPostalHint] = React.useState<string | null>(null);

  const geo = useGeoLocation({
    countryName: profile.country,
    stateRegion: profile.stateRegion,
  });
  const { loadCountries, selectCountry, selectState } = geo;
  const languageOptions = geo.countryDetail?.languages ?? [];

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadCountries(countryFilter.trim() || undefined);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [countryFilter, loadCountries]);

  const activeStateIso = React.useMemo(() => {
    if (stateIso) {
      return stateIso;
    }
    if (!stateRegion.trim()) {
      return '';
    }
    return (
      geo.states.find((s) => s.name.toLowerCase() === stateRegion.trim().toLowerCase())?.isoCode ??
      ''
    );
  }, [stateIso, stateRegion, geo.states]);

  const countryOptions = React.useMemo(() => {
    const list = [...geo.countries];
    if (country.trim() && !list.some((c) => c.name === country)) {
      list.unshift({ name: country, alpha2: '' });
    }
    return list;
  }, [geo.countries, country]);

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAlpha2 = event.target.selectedOptions[0]?.dataset.alpha2 ?? '';
    const selectedName = event.target.value;
    setCountry(selectedName);
    setStateRegion('');
    setStateIso('');
    setCity('');
    setPostalCode('');
    setPostalHint(null);
    if (!selectedAlpha2) {
      return;
    }
    void selectCountry(selectedAlpha2, selectedName).then((result) => {
      if (result?.defaultMotherTongue) {
        setMotherTongue(result.defaultMotherTongue);
      }
    });
  };

  const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const iso = event.target.selectedOptions[0]?.dataset.iso ?? '';
    const name = event.target.value;
    setStateRegion(name);
    setStateIso(iso);
    setCity('');
    if (iso) {
      void selectState(iso);
    }
  };

  const validatePostal = () => {
    const regex = geo.countryDetail?.postalRegex;
    if (!postalCode.trim() || !regex) {
      setPostalHint(null);
      return;
    }
    try {
      const ok = new RegExp(regex).test(postalCode.trim());
      setPostalHint(ok ? null : 'Postal code does not match the format for this country.');
    } catch {
      setPostalHint(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="countryFilter">Search country</Label>
        <input
          id="countryFilter"
          className={inputClass}
          value={countryFilter}
          placeholder="Type to filter countries…"
          onChange={(e) => setCountryFilter(e.target.value)}
          onFocus={() => void loadCountries(countryFilter.trim() || undefined)}
        />
      </div>
      <div>
        <Label htmlFor="country">Country</Label>
        <select
          id="country"
          className={inputClass}
          value={country}
          disabled={geo.countriesLoading}
          onChange={handleCountryChange}
        >
          <option value="">Select country</option>
          {countryOptions.map((c) => (
            <option
              key={`${c.name}-${c.alpha2}`}
              value={c.name}
              data-alpha2={c.alpha2 || undefined}
            >
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="stateRegion">State / province</Label>
        <select
          id="stateRegion"
          className={inputClass}
          value={stateRegion}
          disabled={!geo.alpha2 || geo.statesLoading || geo.states.length === 0}
          onChange={handleStateChange}
        >
          <option value="">
            {geo.alpha2
              ? geo.states.length
                ? 'Select state'
                : 'No states for this country'
              : 'Select country first'}
          </option>
          {geo.states.map((s) => (
            <option key={s.isoCode} value={s.name} data-iso={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <select
          id="city"
          className={inputClass}
          value={city}
          disabled={!activeStateIso || geo.citiesLoading || geo.cities.length === 0}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">
            {activeStateIso
              ? geo.cities.length
                ? 'Select city'
                : geo.citiesLoading
                  ? 'Loading cities…'
                  : 'No cities listed — type below'
              : 'Select state first'}
          </option>
          {geo.cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {activeStateIso && !geo.citiesLoading && geo.cities.length === 0 ? (
          <input
            className={cn(inputClass, 'mt-2')}
            value={city}
            placeholder="Enter city name"
            onChange={(e) => setCity(e.target.value)}
          />
        ) : null}
      </div>
      <div>
        <Label htmlFor="postalCode">Postal code</Label>
        <input
          id="postalCode"
          className={inputClass}
          value={postalCode}
          placeholder={geo.countryDetail?.postalFormat ?? 'Postal / ZIP code'}
          onChange={(e) => setPostalCode(e.target.value)}
          onBlur={validatePostal}
        />
        {postalHint ? <p className="text-destructive mt-1 text-xs">{postalHint}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="motherTongue">Mother tongue</Label>
        {languageOptions.length > 0 ? (
          <select
            id="motherTongue"
            className={inputClass}
            value={motherTongue}
            onChange={(e) => setMotherTongue(e.target.value)}
          >
            <option value="">Select language</option>
            {languageOptions.map((lang) => (
              <option key={lang.code} value={lang.name}>
                {lang.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="motherTongue"
            className={inputClass}
            value={motherTongue}
            onChange={(e) => setMotherTongue(e.target.value)}
          />
        )}
      </div>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            country,
            stateRegion: stateRegion || null,
            city,
            postalCode: postalCode || null,
            motherTongue: motherTongue || null,
          })
        }
      />
    </div>
  );
}

function EducationForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [education, setEducation] = React.useState(profile.education ?? '');
  const [occupation, setOccupation] = React.useState(profile.occupation ?? '');
  const [bio, setBio] = React.useState(profile.bio ?? '');

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="education">Education</Label>
        <input
          id="education"
          className={inputClass}
          value={education}
          onChange={(e) => setEducation(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="occupation">Occupation</Label>
        <input
          id="occupation"
          className={inputClass}
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={4}
          className={cn(inputClass, 'h-auto py-2')}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            education: education || null,
            occupation: occupation || null,
            bio: bio || null,
          })
        }
      />
    </div>
  );
}

function FaithForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [religion, setReligion] = React.useState(profile.religion);
  const [denomination, setDenomination] = React.useState(profile.denomination ?? '');
  const [community, setCommunity] = React.useState(profile.community ?? '');
  const [religiousPractice, setReligiousPractice] = React.useState(profile.religiousPractice ?? '');

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="religion">Religion</Label>
        <select
          id="religion"
          className={inputClass}
          value={religion}
          onChange={(e) => setReligion(e.target.value as typeof religion)}
        >
          {RELIGION_VALUES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="denomination">Denomination</Label>
        <input
          id="denomination"
          className={inputClass}
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="community">Community</Label>
        <input
          id="community"
          className={inputClass}
          value={community}
          onChange={(e) => setCommunity(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="religiousPractice">Religious practice</Label>
        <input
          id="religiousPractice"
          className={inputClass}
          value={religiousPractice}
          onChange={(e) => setReligiousPractice(e.target.value)}
        />
      </div>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            religion,
            denomination: denomination || null,
            community: community || null,
            religiousPractice: religiousPractice || null,
          })
        }
      />
    </div>
  );
}

function PrivacyForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [photoVisibility, setPhotoVisibility] = React.useState(profile.photoVisibility);
  const [isDiscoverable, setIsDiscoverable] = React.useState(profile.isDiscoverable);
  const [showContactOnlyToAccepted, setShowContactOnlyToAccepted] = React.useState(
    profile.showContactOnlyToAccepted,
  );
  const [hideFromContacts, setHideFromContacts] = React.useState(profile.hideFromContacts);
  const [guardianManaged, setGuardianManaged] = React.useState(profile.guardianManaged);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="photoVisibility">Photo visibility</Label>
        <select
          id="photoVisibility"
          className={inputClass}
          value={photoVisibility}
          onChange={(e) => setPhotoVisibility(e.target.value as typeof photoVisibility)}
        >
          {PHOTO_VISIBILITY_VALUES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isDiscoverable}
          onChange={(e) => setIsDiscoverable(e.target.checked)}
        />
        Discoverable in search
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showContactOnlyToAccepted}
          onChange={(e) => setShowContactOnlyToAccepted(e.target.checked)}
        />
        Show contact only after accept
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hideFromContacts}
          onChange={(e) => setHideFromContacts(e.target.checked)}
        />
        Hide from contacts
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={guardianManaged}
          onChange={(e) => setGuardianManaged(e.target.checked)}
        />
        Guardian managed
      </label>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            photoVisibility,
            isDiscoverable,
            showContactOnlyToAccepted,
            hideFromContacts,
            guardianManaged,
          })
        }
      />
    </div>
  );
}

function MyAttributesForm({
  myPreference,
  profileGender,
  pending,
  onSave,
}: {
  myPreference: BiodataMeDto['myPreference'];
  profileGender: BiodataMeDto['profile']['gender'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [gender, setGender] = React.useState(myPreference?.gender ?? profileGender);
  const [district, setDistrict] = React.useState(myPreference?.district ?? '');
  const [country, setCountry] = React.useState(myPreference?.country ?? '');
  const [willingToRelocate, setWillingToRelocate] = React.useState(
    myPreference?.willingToRelocate ?? false,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="myGender">Gender</Label>
        <select
          id="myGender"
          className={inputClass}
          value={gender}
          onChange={(e) => setGender(e.target.value as typeof gender)}
        >
          {GENDER_VALUES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="district">District</Label>
        <input
          id="district"
          className={inputClass}
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="myCountry">Country</Label>
        <input
          id="myCountry"
          className={inputClass}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={willingToRelocate}
          onChange={(e) => setWillingToRelocate(e.target.checked)}
        />
        Willing to relocate
      </label>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            gender,
            district: district || null,
            country: country || null,
            willingToRelocate,
          })
        }
      />
    </div>
  );
}

function PartnerForm({
  partnerPreference,
  pending,
  onSave,
}: {
  partnerPreference: BiodataMeDto['partnerPreference'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [minAge, setMinAge] = React.useState(String(partnerPreference?.minAge ?? 21));
  const [maxAge, setMaxAge] = React.useState(String(partnerPreference?.maxAge ?? 35));
  const [preferredCountries, setPreferredCountries] = React.useState(
    partnerPreference?.preferredCountries.join(', ') ?? '',
  );
  const [preferredReligions, setPreferredReligions] = React.useState(
    partnerPreference?.preferredReligions.join(', ') ?? '',
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="minAge">Minimum age</Label>
        <input
          id="minAge"
          type="number"
          className={inputClass}
          value={minAge}
          onChange={(e) => setMinAge(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="maxAge">Maximum age</Label>
        <input
          id="maxAge"
          type="number"
          className={inputClass}
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="prefCountries">Preferred countries (comma-separated)</Label>
        <input
          id="prefCountries"
          className={inputClass}
          value={preferredCountries}
          onChange={(e) => setPreferredCountries(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="prefReligions">Preferred religions (comma-separated)</Label>
        <input
          id="prefReligions"
          className={inputClass}
          value={preferredReligions}
          onChange={(e) => setPreferredReligions(e.target.value)}
        />
      </div>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            minAge: Number(minAge),
            maxAge: Number(maxAge),
            preferredCountries: preferredCountries
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            preferredReligions: preferredReligions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      />
    </div>
  );
}
