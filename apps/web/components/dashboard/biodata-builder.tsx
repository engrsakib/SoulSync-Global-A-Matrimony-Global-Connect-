'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BLOOD_GROUP_LABELS,
  BLOOD_GROUP_VALUES,
  COMPLEXION_SELF_LABELS,
  COMPLEXION_SELF_VALUES,
  GENDER_VALUES,
  MARITAL_STATUS_LABELS,
  MARITAL_STATUS_VALUES,
  type ComplexionSelf,
} from '@soulsync/shared-types/partner-preference';
import {
  BIODATA_SECTION_IDS,
  LOCATION_DETAILS_MAX_WORDS,
  LOCATION_DETAILS_MIN_WORDS,
  validateProfileLocationDetails,
} from '@soulsync/shared-types/biodata';
import {
  formatDiscoveryReligionAudience,
  listingVisibilityLabel,
  PHOTO_VISIBILITY_LABELS,
} from '@soulsync/shared-types/biodata-discovery-settings';
import type { BiodataMeDto, BiodataSectionId } from '@soulsync/shared-types/biodata';
import {
  normalizeCheckInTimeZone,
  normalizeCheckInTimeZoneList,
} from '@soulsync/shared-types/check-in';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';
import { getBiodataDateOfBirthAgeError } from '@soulsync/shared-types';
import { DateOfBirthPicker } from '@soulsync/ui/date-of-birth-picker';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { FamilyHeritageForm } from '@/components/dashboard/family-heritage-form';
import { GuardianContactForm } from '@/components/dashboard/guardian-contact-form';
import { IslamShariaForm } from '@/components/dashboard/islam-sharia-form';
import { PartnerLocationForm } from '@/components/dashboard/partner-location-form';
import { PartnerPreferencesForm } from '@/components/dashboard/partner-preferences-form';
import { ReligionPracticeForm } from '@/components/dashboard/religion-practice-form';
import {
  FAMILY_ECONOMIC_CLASS_LABELS,
  FAMILY_RELATIVE_RELATIONSHIP_LABELS,
  formatParentAliveDisplay,
} from '@soulsync/shared-types/family-heritage';
import {
  CLOTHING_ABOVE_ANKLES_LABELS,
  formatBooleanYes,
  formatEnumLabel,
  HIJAB_PURDAH_LABELS,
  MAHRAM_COMPLIANCE_LABELS,
  PRAYER_REGULARITY_LABELS,
  QURAN_RECITATION_LEVEL_LABELS,
  shouldShowBeardFields,
  shouldShowHijabField,
  SUNNAH_BEARD_STATUS_LABELS,
} from '@soulsync/shared-types/islam-sharia';
import {
  isGuardianContactSectionStarted,
  messagingTelegramHref,
  messagingWhatsAppHref,
  summarizeGuardianContactRead,
} from '@soulsync/shared-types/guardian-contact';
import {
  getPartnerPreferredLocations,
  summarizePartnerPreferenceRead,
} from '@soulsync/shared-types/partner-preferences-ui';
import {
  formatReligionPracticeRead,
  usesIslamMadhabField,
} from '@soulsync/shared-types/religion-branches';
import { countWords, limitToMaxWords } from '@soulsync/shared-types/word-limit';
import { fetchMyBiodata, patchBiodataSection } from '@/lib/biodata-api';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import {
  inputWithChevronClass,
  SearchableSelectField,
  SelectWithChevron,
} from '@/components/dashboard/searchable-select-field';
import { hasStructuredEducation, initialDegreeName } from '@/lib/education-career-display';
import { useGeoLocation } from '@/lib/geo/use-geo-location';
import { formatDateOfBirthDisplay } from '@/lib/age-from-dob';
import { formatBmiDisplay, formatHealthConditionDisplay } from '@/lib/bmi';
import { cmToFeetInches, formatHeightFromCm, parseFeetInchesFields } from '@/lib/height-units';
import { btnPrimaryMd, dashboardPageTitle } from '@/lib/ui-classes';
import { ChevronDown } from 'lucide-react';
import { BiodataPhotoGallerySection } from '@/components/dashboard/biodata-photo-gallery-section';
import { ConfirmMarriageSection } from '@/components/dashboard/confirm-marriage-section';
import { useManagedBiodata } from '@/lib/managed-biodata-context';
import { ManagedBiodataEditingBanner } from '@/components/dashboard/managed-biodata-editing-banner';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const sectionSubheadingClass = 'text-sm font-semibold tracking-tight text-[var(--foreground)]';

const SECTION_TITLES: Record<BiodataSectionId, string> = {
  basic: 'Personal details',
  location: 'Location',
  education_career: 'Education & career',
  faith: 'Religion & practice',
  islam_sharia: 'Religious Beliefs, Practices, and Sharia Compliance',
  privacy: 'Privacy & discovery',
  family_heritage: 'Family heritage and identity',
  my_attributes: 'About me (for matching)',
  partner: 'Partner preferences',
  partner_location: 'Partner Location',
  guardian_contact: 'Guardian contact & marriage pledges',
};

function Field({ label, value, href }: { label: string; value: string; href?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm font-medium text-[var(--color-brand-700)] underline-offset-2 hover:underline"
        >
          {value || '—'}
        </a>
      ) : (
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || '—'}</p>
      )}
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
  const managed = useManagedBiodata();
  const managedOwnerUserId = managed?.ownerUserId ?? null;
  const [data, setData] = React.useState(initialBiodata);
  const [editing, setEditing] = React.useState<BiodataSectionId | null>(null);
  const [pending, setPending] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const next = await fetchMyBiodata(managedOwnerUserId);
    setData(next);
  }, [managedOwnerUserId]);

  const saveSection = async (sectionId: BiodataSectionId, body: Record<string, unknown>) => {
    setPending(true);
    try {
      const next = await patchBiodataSection(sectionId, body, managedOwnerUserId);
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

  const visibleSectionIds = React.useMemo(
    () => BIODATA_SECTION_IDS.filter((id) => id !== 'islam_sharia' || p.religion === 'ISLAM'),
    [p.religion],
  );

  return (
    <div className="space-y-6">
      {managed ? <ManagedBiodataEditingBanner ownerDisplayName={managed.ownerDisplayName} /> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className={dashboardPageTitle}>{managed ? 'Managed biodata' : 'Biodata'}</h1>
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

      {visibleSectionIds.map((sectionId) => (
        <React.Fragment key={sectionId}>
          <DashboardCard
            title={SECTION_TITLES[sectionId]}
            editLabel={editing === sectionId ? 'Cancel' : 'Edit'}
            editHref={undefined}
          >
            <div className="mb-4 flex justify-end">
              {sectionId === 'privacy' ? (
                <Link
                  href={dashboardRoutes.biodataSettings}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold',
                    'bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)]',
                  )}
                >
                  Manage in settings
                </Link>
              ) : (
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold',
                    editing === sectionId
                      ? 'border border-[var(--border)] text-[var(--foreground)]'
                      : 'bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)]',
                  )}
                  onClick={() =>
                    setEditing((current) => (current === sectionId ? null : sectionId))
                  }
                >
                  {editing === sectionId ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>

            {sectionId === 'basic' && editing !== 'basic' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Display name" value={p.displayName} />
                <Field label="Gender" value={p.gender} />
                <Field label="Age" value={formatDateOfBirthDisplay(p.dateOfBirth)} />
                <Field label="Height" value={formatHeightFromCm(p.heightCm)} />
                <Field
                  label="Marital status"
                  value={MARITAL_STATUS_LABELS[p.maritalStatus] ?? p.maritalStatus}
                />
                <Field
                  label="Skin tone"
                  value={
                    data.myPreference?.complexion &&
                    COMPLEXION_SELF_VALUES.includes(data.myPreference.complexion as ComplexionSelf)
                      ? COMPLEXION_SELF_LABELS[data.myPreference.complexion as ComplexionSelf]
                      : (data.myPreference?.complexion ?? '—')
                  }
                />
                <Field
                  label="Blood group"
                  value={p.bloodGroup ? BLOOD_GROUP_LABELS[p.bloodGroup] : '—'}
                />
                <Field label="Weight (kg)" value={p.weightKg != null ? String(p.weightKg) : '—'} />
                <Field label="BMI" value={formatBmiDisplay(p.heightCm, p.weightKg)} />
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="Health condition" value={formatHealthConditionDisplay(p)} />
                </div>
              </div>
            ) : null}

            {sectionId === 'basic' && editing === 'basic' ? (
              <BasicForm
                profile={p}
                myPreference={data.myPreference}
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
                <Field
                  label="Time zone (daily check-in)"
                  value={p.checkInTimeZone?.trim() || 'UTC (default until set)'}
                />
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="Location details" value={p.locationDetails ?? '—'} />
                </div>
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
              <div className="space-y-6">
                <div>
                  <h3 className={cn(sectionSubheadingClass, 'mb-3')}>Latest qualification</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Degree" value={p.degreeName ?? p.education ?? '—'} />
                    <Field label="Major" value={p.degreeMajor ?? '—'} />
                    <Field label="University / college" value={p.institution ?? '—'} />
                    <Field
                      label="Passing year"
                      value={p.graduationYear != null ? String(p.graduationYear) : '—'}
                    />
                    {!hasStructuredEducation(p) && p.education ? (
                      <Field label="Education (legacy)" value={p.education} />
                    ) : null}
                    <Field
                      label="Monthly income (optional)"
                      value={
                        data.myPreference?.monthlyIncome != null
                          ? `${data.myPreference.monthlyIncome} ${data.myPreference.incomeCurrency}`
                          : '—'
                      }
                    />
                  </div>
                </div>
                <div>
                  <h3 className={cn(sectionSubheadingClass, 'mb-3')}>Career</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Job title" value={p.occupation ?? '—'} />
                    <Field label="Employer" value={p.employer ?? '—'} />
                    <Field
                      label="Years of experience"
                      value={p.yearsExperience != null ? String(p.yearsExperience) : '—'}
                    />
                    <Field label="Work location" value={p.workLocation ?? '—'} />
                  </div>
                </div>
                <div>
                  <h3 className={cn(sectionSubheadingClass, 'mb-3')}>About you</h3>
                  <Field label="Bio" value={p.bio ?? '—'} />
                </div>
              </div>
            ) : null}

            {sectionId === 'education_career' && editing === 'education_career' ? (
              <EducationForm
                profile={p}
                myPreference={data.myPreference}
                pending={pending}
                onSave={(body) => void saveSection('education_career', body)}
              />
            ) : null}

            {sectionId === 'faith' && editing !== 'faith' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  const read = formatReligionPracticeRead(p);
                  return (
                    <>
                      <Field label="Faith tradition" value={read.religion} />
                      <Field label="Branch / tradition" value={read.branch} />
                      <Field
                        label={
                          usesIslamMadhabField(p.religion, p.denomination)
                            ? 'School of jurisprudence (madhab)'
                            : 'Practice / observance'
                        }
                        value={read.madhabOrPractice}
                      />
                      {p.religion === 'ISLAM' ? (
                        <Field label="Maslak (school of thought)" value={read.maslak} />
                      ) : null}
                      <Field label="Community" value={read.community} />
                    </>
                  );
                })()}
              </div>
            ) : null}

            {sectionId === 'faith' && editing === 'faith' ? (
              <ReligionPracticeForm
                profile={p}
                pending={pending}
                onSave={(body) => void saveSection('faith', body)}
              />
            ) : null}

            {sectionId === 'islam_sharia' && editing !== 'islam_sharia' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className={sectionSubheadingClass}>Salah and aqeedah</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field
                      label="Do you pray five times daily or regularly in congregation?"
                      value={formatEnumLabel(p.prayerRegularity, PRAYER_REGULARITY_LABELS)}
                    />
                    <Field
                      label="Approximately how many fard prayers are qada or might be?"
                      value={p.missedFardPrayersNotes ?? ''}
                    />
                    <Field label="Aqeedah and religious orientation" value={p.aqeedahNotes ?? ''} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={sectionSubheadingClass}>Appearance, dress, and boundaries</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {shouldShowBeardFields(p.gender) ? (
                      <>
                        <Field
                          label="Do you keep a Sunnah beard?"
                          value={formatEnumLabel(p.sunnahBeardStatus, SUNNAH_BEARD_STATUS_LABELS)}
                        />
                        <Field label="Beard details" value={p.beardDetails ?? ''} />
                      </>
                    ) : null}
                    <Field
                      label="Usual clothing when going out"
                      value={p.usualOutdoorClothing ?? ''}
                    />
                    <Field
                      label="Can you recite the Quran with tajweed?"
                      value={formatEnumLabel(p.quranRecitationLevel, QURAN_RECITATION_LEVEL_LABELS)}
                    />
                    <Field
                      label="Do you wear clothing above the ankles?"
                      value={formatEnumLabel(p.clothingAboveAnkles, CLOTHING_ABOVE_ANKLES_LABELS)}
                    />
                    <Field
                      label="Mahram / non-mahram boundaries"
                      value={formatEnumLabel(p.mahramCompliance, MAHRAM_COMPLIANCE_LABELS)}
                    />
                    <Field
                      label="Favourite Islamic books and reading"
                      value={p.favoriteIslamicBooks ?? ''}
                    />
                    <Field
                      label="Favourite scholars and authors"
                      value={p.favoriteScholars ?? ''}
                    />
                    <Field
                      label="Entertainment and leisure habits"
                      value={p.entertainmentHabits ?? ''}
                    />
                    <Field
                      label="Dawah or religious community involvement"
                      value={p.dawahInvolvement ?? ''}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={sectionSubheadingClass}>Hifz and halal income</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field
                      label="Quran recitation ability and hifz"
                      value={p.quranHifzNotes ?? ''}
                    />
                    <Field
                      label="Fully halal income (you and family)"
                      value={
                        p.incomeFullyHalal === true
                          ? 'Alhamdulillah — fully halal, free from riba and bribery'
                          : formatBooleanYes(p.incomeFullyHalal)
                      }
                    />
                  </div>
                </div>

                {shouldShowHijabField(p.gender) ? (
                  <div className="space-y-4">
                    <h3 className={sectionSubheadingClass}>Hijab / purdah</h3>
                    <Field
                      label="Hijab / purdah"
                      value={formatEnumLabel(p.hijabPurdah, HIJAB_PURDAH_LABELS)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {sectionId === 'islam_sharia' && editing === 'islam_sharia' ? (
              <IslamShariaForm
                profile={p}
                pending={pending}
                onSave={(body) => void saveSection('islam_sharia', body)}
              />
            ) : null}

            {sectionId === 'privacy' ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-xs">
                  Listing, audience, and contact preferences are managed on the biodata settings
                  page.
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Biodata visibility"
                    value={listingVisibilityLabel(p.isDiscoverable)}
                  />
                  <Field
                    label="Who can view"
                    value={formatDiscoveryReligionAudience(
                      p.discoveryReligionMode ?? 'SAME_AS_MINE',
                      p.religion,
                      p.discoveryReligionAllowList ?? [],
                    )}
                  />
                  <Field
                    label="Profile photo"
                    value={PHOTO_VISIBILITY_LABELS[p.photoVisibility] ?? p.photoVisibility}
                  />
                  <Field
                    label="Contact after mutual accept"
                    value={p.showContactOnlyToAccepted ? 'Yes' : 'No'}
                  />
                  <Field
                    label="Hide from people I know"
                    value={p.hideFromContacts ? 'Yes' : 'No'}
                  />
                  <Field label="Guardian-managed" value={p.guardianManaged ? 'Yes' : 'No'} />
                </div>
              </div>
            ) : null}

            {sectionId === 'family_heritage' && editing !== 'family_heritage' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className={sectionSubheadingClass}>Parents and siblings</h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Field
                      label="Is your father alive?"
                      value={formatParentAliveDisplay(p.fatherIsAlive)}
                    />
                    <Field label="Father's profession (details)" value={p.fatherProfession ?? ''} />
                    <Field
                      label="Is your mother alive?"
                      value={formatParentAliveDisplay(p.motherIsAlive)}
                    />
                    <Field label="Mother's profession (details)" value={p.motherProfession ?? ''} />
                    <Field
                      label="How many brothers?"
                      value={p.brotherCount != null ? String(p.brotherCount) : ''}
                    />
                    <Field
                      label="How many sisters?"
                      value={p.sisterCount != null ? String(p.sisterCount) : ''}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={sectionSubheadingClass}>Siblings and relatives</h3>
                  {p.familyRelatives.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">—</p>
                  ) : (
                    <ul className="space-y-4">
                      {p.familyRelatives.map((member, index) => (
                        <li
                          key={member.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4"
                        >
                          <p className="mb-3 text-xs font-medium text-[var(--muted-foreground)]">
                            Member {index + 1}
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Field
                              label="Relationship"
                              value={FAMILY_RELATIVE_RELATIONSHIP_LABELS[member.relationship]}
                            />
                            <Field label="Name" value={member.name} />
                            <Field label="Education" value={member.education} />
                            <Field label="Profession" value={member.profession} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className={sectionSubheadingClass}>Home and economic background</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field
                      label="Occupations of paternal and maternal uncles"
                      value={p.unclesOccupations ?? ''}
                    />
                    <Field
                      label="Type of residence (describe your home)"
                      value={p.residenceDescription ?? ''}
                    />
                    <Field
                      label="Family economic class"
                      value={
                        p.familyEconomicClass
                          ? FAMILY_ECONOMIC_CLASS_LABELS[p.familyEconomicClass]
                          : ''
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {sectionId === 'family_heritage' && editing === 'family_heritage' ? (
              <FamilyHeritageForm
                profile={p}
                pending={pending}
                onSave={(body) => void saveSection('family_heritage', body)}
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
                (() => {
                  const read = summarizePartnerPreferenceRead(
                    data.partnerPreference,
                    p.gender,
                    p.religion,
                  );
                  return (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label="Age range" value={read.ageRange} />
                      <Field label="Minimum height" value={read.minHeight} />
                      <Field label="Expected religiousness" value={read.religiousness} />
                      <Field label="Preferred skin tone" value={read.complexion} />
                      <Field label="Expected marital status" value={read.marital} />
                      <Field label="Expected education" value={read.education} />
                      <Field label="Expected profession" value={read.profession} />
                      <Field label="Expected family / financial status" value={read.familyStatus} />
                      <Field label="Preferred religions" value={read.religions} />
                      <Field
                        label="Special qualities or conditions"
                        value={read.specialQualities}
                      />
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Not started — click Edit to add.
                </p>
              )
            ) : null}

            {sectionId === 'partner' && editing === 'partner' ? (
              <PartnerPreferencesForm
                profile={p}
                partnerPreference={data.partnerPreference}
                pending={pending}
                onSave={(body) => void saveSection('partner', body)}
              />
            ) : null}

            {sectionId === 'partner_location' && editing !== 'partner_location'
              ? (() => {
                  const entries = getPartnerPreferredLocations(data.partnerPreference);
                  if (entries.length === 0) {
                    return (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Not started — click Edit to add.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-8">
                      {entries.map((entry, index) => (
                        <div key={`partner-loc-${index}`}>
                          <p className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                            {index + 1}. Partner location
                          </p>
                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="Country" value={entry.country?.trim() || '—'} />
                            <Field
                              label="State / province"
                              value={entry.stateRegion?.trim() || '—'}
                            />
                            <Field label="City" value={entry.city?.trim() || '—'} />
                            <Field label="Postal code" value={entry.postalCode?.trim() || '—'} />
                            <div className="sm:col-span-2 lg:col-span-3">
                              <Field
                                label="Location details"
                                value={entry.locationDetails?.trim() || '—'}
                              />
                            </div>
                            <Field
                              label="Mother tongue"
                              value={entry.motherTongue?.trim() || '—'}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              : null}

            {sectionId === 'partner_location' && editing === 'partner_location' ? (
              <PartnerLocationForm
                profile={p}
                myPreference={data.myPreference}
                partnerPreference={data.partnerPreference}
                pending={pending}
                onSave={(body) => void saveSection('partner_location', body)}
              />
            ) : null}

            {sectionId === 'guardian_contact' && editing !== 'guardian_contact' ? (
              isGuardianContactSectionStarted(p) ? (
                (() => {
                  const read = summarizeGuardianContactRead(p, data.accountEmail);
                  return (
                    <div className="space-y-6">
                      <p className="text-muted-foreground text-xs">
                        Contact details are private and encrypted. They are not shown on your public
                        listing.
                      </p>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <Field label="Guardian's name" value={read.guardianName} />
                        <Field label="Relationship" value={read.guardianRelationship} />
                        <Field label="Guardian mobile" value={read.guardianMobile} />
                        <Field label="Candidate contact" value={read.candidateMobile} />
                        <div className="grid gap-6">
                          <Field
                            label="Guardian WhatsApp"
                            value={read.guardianWhatsApp}
                            href={messagingWhatsAppHref(p.guardianWhatsApp)}
                          />
                          <Field
                            label="Guardian Telegram"
                            value={read.guardianTelegram}
                            href={messagingTelegramHref(p.guardianTelegram)}
                          />
                        </div>
                        <div className="grid gap-6">
                          <Field
                            label="Candidate WhatsApp"
                            value={read.candidateWhatsApp}
                            href={messagingWhatsAppHref(p.candidateWhatsApp)}
                          />
                          <Field
                            label="Candidate Telegram"
                            value={read.candidateTelegram}
                            href={messagingTelegramHref(p.candidateTelegram)}
                          />
                        </div>
                        <Field label="Email address" value={read.accountEmail} />
                        <Field label="Marriage pledges" value={read.pledgesSummary} />
                        <Field label="Pledges accepted" value={read.pledgesAcceptedAt} />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Not started — click Edit to add.
                </p>
              )
            ) : null}

            {sectionId === 'guardian_contact' && editing === 'guardian_contact' ? (
              <GuardianContactForm
                profile={p}
                accountEmail={data.accountEmail}
                pending={pending}
                onSave={(body) => void saveSection('guardian_contact', body)}
              />
            ) : null}
          </DashboardCard>
          {sectionId === 'basic' ? (
            <BiodataPhotoGallerySection
              galleryPhotos={data.galleryPhotos ?? []}
              onChanged={refresh}
            />
          ) : null}
        </React.Fragment>
      ))}

      {!managed ? (
        <ConfirmMarriageSection gender={p.gender} profileCountry={p.country ?? null} />
      ) : null}

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
  myPreference,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  myPreference: BiodataMeDto['myPreference'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [displayName, setDisplayName] = React.useState(profile.displayName);
  const [gender, setGender] = React.useState(profile.gender);
  const [dateOfBirth, setDateOfBirth] = React.useState(isoDateInputValue(profile.dateOfBirth));
  const initialHeight = React.useMemo(
    () => (profile.heightCm != null ? cmToFeetInches(profile.heightCm) : null),
    [profile.heightCm],
  );
  const [heightFeet, setHeightFeet] = React.useState(
    initialHeight != null ? String(initialHeight.feet) : '',
  );
  const [heightInches, setHeightInches] = React.useState(
    initialHeight != null ? String(initialHeight.inches) : '',
  );
  const [maritalStatus, setMaritalStatus] = React.useState(profile.maritalStatus);
  const initialComplexion =
    myPreference?.complexion &&
    COMPLEXION_SELF_VALUES.includes(myPreference.complexion as ComplexionSelf)
      ? myPreference.complexion
      : '';
  const [complexion, setComplexion] = React.useState(initialComplexion);
  const [bloodGroup, setBloodGroup] = React.useState(profile.bloodGroup ?? '');
  const [weightKg, setWeightKg] = React.useState(
    profile.weightKg != null ? String(profile.weightKg) : '',
  );
  const [chronicChoice, setChronicChoice] = React.useState<'unset' | 'yes' | 'no'>(() => {
    if (profile.hasChronicConditions === true) {
      return 'yes';
    }
    if (profile.hasChronicConditions === false) {
      return 'no';
    }
    return 'unset';
  });
  const [chronicConditionsDetail, setChronicConditionsDetail] = React.useState(
    profile.chronicConditionsDetail ?? '',
  );
  const [dobError, setDobError] = React.useState<string | null>(null);

  const heightCmPreview = React.useMemo(
    () => parseFeetInchesFields(heightFeet, heightInches),
    [heightFeet, heightInches],
  );

  const parseOptionalWeightKg = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) ? Math.trunc(num) : null;
  };

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
      <SelectWithChevron
        id="gender"
        label="Gender"
        value={gender}
        onChange={(e) => setGender(e.target.value as typeof gender)}
      >
        {GENDER_VALUES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </SelectWithChevron>
      <div>
        <Label htmlFor="dob">Date of birth</Label>
        <DateOfBirthPicker
          id="dob"
          value={dateOfBirth}
          onChange={(iso) => {
            setDateOfBirth(iso);
            setDobError(getBiodataDateOfBirthAgeError(iso));
          }}
          aria-invalid={dobError != null}
          aria-describedby={dobError ? 'dob-error' : undefined}
        />
        {dobError ? (
          <p id="dob-error" className="mt-1.5 text-xs text-red-600" role="alert">
            {dobError}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">Eligible ages 18–50</p>
        )}
      </div>
      <div>
        <Label htmlFor="heightFeet">Height</Label>
        <div className="flex h-11 items-center gap-2">
          <input
            id="heightFeet"
            type="number"
            min={0}
            max={8}
            inputMode="numeric"
            className={cn(inputClass, 'min-w-0 flex-1')}
            placeholder="5"
            value={heightFeet}
            onChange={(e) => setHeightFeet(e.target.value)}
            aria-label="Height feet"
          />
          <span className="text-muted-foreground shrink-0 text-sm">ft</span>
          <input
            id="heightInches"
            type="number"
            min={0}
            max={11}
            inputMode="numeric"
            className={cn(inputClass, 'min-w-0 flex-1')}
            placeholder="9"
            value={heightInches}
            onChange={(e) => setHeightInches(e.target.value)}
            aria-label="Height inches"
          />
          <span className="text-muted-foreground shrink-0 text-sm">in</span>
        </div>
        {heightCmPreview != null ? (
          <p className="text-muted-foreground mt-1 text-xs">≈ {heightCmPreview} cm</p>
        ) : (
          <p className="text-muted-foreground mt-1 text-xs">Stored in centimeters for matching.</p>
        )}
      </div>
      <SelectWithChevron
        id="marital"
        label="Marital status"
        value={maritalStatus}
        onChange={(e) => setMaritalStatus(e.target.value as typeof maritalStatus)}
      >
        {MARITAL_STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {MARITAL_STATUS_LABELS[value]}
          </option>
        ))}
      </SelectWithChevron>
      <SelectWithChevron
        id="complexion"
        label="Skin tone"
        value={complexion}
        onChange={(e) => setComplexion(e.target.value)}
      >
        <option value="">—</option>
        {COMPLEXION_SELF_VALUES.map((value) => (
          <option key={value} value={value}>
            {COMPLEXION_SELF_LABELS[value]}
          </option>
        ))}
      </SelectWithChevron>
      <SelectWithChevron
        id="bloodGroup"
        label="Blood group"
        value={bloodGroup}
        onChange={(e) => setBloodGroup(e.target.value)}
      >
        <option value="">—</option>
        {BLOOD_GROUP_VALUES.map((value) => (
          <option key={value} value={value}>
            {BLOOD_GROUP_LABELS[value]}
          </option>
        ))}
      </SelectWithChevron>
      <div>
        <Label htmlFor="weightKg">Weight (kg)</Label>
        <input
          id="weightKg"
          type="number"
          min={20}
          max={300}
          inputMode="numeric"
          className={inputClass}
          placeholder="Optional"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
      </div>
      <SelectWithChevron
        id="hasChronicConditions"
        label="Do you have any chronic physical or mental conditions?"
        value={chronicChoice}
        onChange={(e) => setChronicChoice(e.target.value as typeof chronicChoice)}
      >
        <option value="unset">—</option>
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </SelectWithChevron>
      {chronicChoice === 'yes' ? (
        <div className="sm:col-span-2">
          <Label htmlFor="chronicConditionsDetail">Please describe (optional)</Label>
          <textarea
            id="chronicConditionsDetail"
            rows={3}
            className={cn(inputClass, 'h-auto min-h-[5.5rem] py-2')}
            value={chronicConditionsDetail}
            onChange={(e) => setChronicConditionsDetail(e.target.value)}
          />
        </div>
      ) : null}
      <SaveRow
        pending={pending}
        onSave={() => {
          const ageError = getBiodataDateOfBirthAgeError(dateOfBirth);
          if (ageError) {
            setDobError(ageError);
            toast.error(ageError);
            return;
          }
          const hasChronicConditions = chronicChoice === 'unset' ? null : chronicChoice === 'yes';
          onSave({
            displayName,
            gender,
            dateOfBirth,
            heightCm: heightCmPreview,
            maritalStatus,
            complexion: complexion || null,
            bloodGroup: bloodGroup || null,
            weightKg: parseOptionalWeightKg(weightKg),
            hasChronicConditions,
            chronicConditionsDetail:
              hasChronicConditions === true ? chronicConditionsDetail.trim() || null : null,
          });
        }}
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
  const [checkInTimeZone, setCheckInTimeZone] = React.useState(
    () => profile.checkInTimeZone?.trim() ?? '',
  );
  const [locationDetails, setLocationDetails] = React.useState(profile.locationDetails ?? '');
  const [motherTongue, setMotherTongue] = React.useState(profile.motherTongue ?? '');
  const [countryFilter, setCountryFilter] = React.useState(() =>
    profile.country && profile.country !== 'Unknown' ? profile.country : '',
  );
  const [countrySuggestOpen, setCountrySuggestOpen] = React.useState(false);
  const [postalHint, setPostalHint] = React.useState<string | null>(null);

  const geo = useGeoLocation({
    countryName: profile.country,
    stateRegion: profile.stateRegion,
  });
  const { loadCountries, selectCountry, selectState } = geo;
  const languageOptions = geo.countryDetail?.languages ?? [];

  const checkInTimezoneOptions = React.useMemo(() => {
    const fromCountry = normalizeCheckInTimeZoneList(
      geo.countryDetail?.timezones ?? [],
      geo.alpha2,
    );
    const current =
      normalizeCheckInTimeZone(checkInTimeZone, { countryAlpha2: geo.alpha2 }) ??
      checkInTimeZone.trim();
    if (!current) {
      return fromCountry;
    }
    if (fromCountry.includes(current)) {
      return fromCountry;
    }
    return [current, ...fromCountry];
  }, [checkInTimeZone, geo.alpha2, geo.countryDetail?.timezones]);

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

  const countrySuggestions = React.useMemo(() => {
    const q = countryFilter.trim().toLowerCase();
    const list = geo.countries;
    const filtered = q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
    return filtered.slice(0, 12);
  }, [countryFilter, geo.countries]);

  const pickCountry = React.useCallback(
    (entry: GeoCountrySummary) => {
      if (!entry.alpha2) {
        setCountry(entry.name);
        setCountryFilter(entry.name);
        setCountrySuggestOpen(false);
        return;
      }
      setCountry(entry.name);
      setCountryFilter(entry.name);
      setCountrySuggestOpen(false);
      setStateRegion('');
      setStateIso('');
      setCity('');
      setPostalCode('');
      setPostalHint(null);
      void selectCountry(entry.alpha2, entry.name).then((result) => {
        if (result?.defaultMotherTongue) {
          setMotherTongue(result.defaultMotherTongue);
        }
        if (result?.timezones?.[0]) {
          const normalized = normalizeCheckInTimeZoneList(result.timezones, entry.alpha2)[0];
          if (normalized) {
            setCheckInTimeZone(normalized);
          }
        }
      });
    },
    [selectCountry],
  );

  const stateOptions = React.useMemo(
    () => geo.states.map((s) => ({ value: s.name, label: s.name, data: s.isoCode })),
    [geo.states],
  );

  const cityOptions = React.useMemo(
    () => geo.cities.map((c) => ({ value: c.name, label: c.name })),
    [geo.cities],
  );

  const stateDisabled = !geo.alpha2 || geo.statesLoading || geo.states.length === 0;
  const statePlaceholder = !geo.alpha2
    ? 'Select country first'
    : geo.statesLoading
      ? 'Loading states…'
      : geo.states.length
        ? 'Search or select state…'
        : 'No states for this country';

  const cityDisabled = !activeStateIso || geo.citiesLoading;

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
      <div className="relative sm:col-span-2">
        <Label htmlFor="countryFilter">Country</Label>
        <div className="relative h-11">
          <input
            id="countryFilter"
            className={inputWithChevronClass}
            value={countryFilter}
            placeholder="Start typing a country name…"
            autoComplete="off"
            role="combobox"
            aria-expanded={countrySuggestOpen}
            aria-controls="country-suggest-list"
            aria-autocomplete="list"
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setCountrySuggestOpen(true);
            }}
            onFocus={() => {
              setCountrySuggestOpen(true);
              void loadCountries(countryFilter.trim() || undefined);
            }}
            onBlur={() => {
              window.setTimeout(() => setCountrySuggestOpen(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setCountrySuggestOpen(false);
              }
            }}
          />
          <ChevronDown
            className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-[var(--muted-foreground)]"
            aria-hidden
          />
          {countrySuggestOpen && (countrySuggestions.length > 0 || geo.countriesLoading) ? (
            <ul
              id="country-suggest-list"
              role="listbox"
              className={cn(
                'absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius)]',
                'border border-[var(--border)] bg-white py-1 shadow-md',
              )}
            >
              {geo.countriesLoading && countrySuggestions.length === 0 ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">Searching…</li>
              ) : null}
              {countrySuggestions.map((c) => (
                <li key={`${c.alpha2}-${c.name}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={country === c.name}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]',
                      country === c.name && 'bg-[var(--muted)]/60 font-medium',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickCountry(c);
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
              {!geo.countriesLoading && countryFilter.trim() && countrySuggestions.length === 0 ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">No countries match.</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
      <SearchableSelectField
        id="stateRegion"
        label="State / province"
        value={stateRegion}
        options={stateOptions}
        disabled={stateDisabled}
        loading={geo.statesLoading}
        placeholder={statePlaceholder}
        emptyMessage="No states match your search."
        onSelect={(option) => {
          setStateRegion(option.label);
          setStateIso(option.data ?? '');
          setCity('');
          if (option.data) {
            void selectState(option.data);
          }
        }}
      />
      {activeStateIso && geo.cities.length > 0 ? (
        <SearchableSelectField
          id="city"
          label="City"
          value={city}
          options={cityOptions}
          disabled={cityDisabled}
          loading={geo.citiesLoading}
          placeholder={geo.citiesLoading ? 'Loading cities…' : 'Search or select city…'}
          emptyMessage="No cities match your search."
          onSelect={(option) => setCity(option.label)}
        />
      ) : (
        <div>
          <Label htmlFor="city">City</Label>
          <input
            id="city"
            className={inputClass}
            value={city}
            disabled={!activeStateIso && !geo.alpha2}
            placeholder={
              activeStateIso
                ? 'Enter city name'
                : geo.alpha2
                  ? 'Select state first'
                  : 'Select country first'
            }
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      )}
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
        <Label htmlFor="checkInTimeZone">Time zone (daily check-in)</Label>
        {checkInTimezoneOptions.length > 0 ? (
          <SelectWithChevron
            id="checkInTimeZone"
            label=""
            aria-label="Time zone for daily check-in"
            value={checkInTimeZone}
            onChange={(e) => setCheckInTimeZone(e.target.value)}
          >
            <option value="">UTC (default)</option>
            {checkInTimezoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </SelectWithChevron>
        ) : (
          <input
            id="checkInTimeZone"
            className={inputClass}
            value={checkInTimeZone}
            placeholder="e.g. Asia/Dhaka (IANA)"
            onChange={(e) => setCheckInTimeZone(e.target.value)}
          />
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          Defines your calendar day for header check-in. Filled from your country when available;
          you can pick another zone listed for that country.
        </p>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="locationDetails">
          Location details <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="locationDetails"
          rows={3}
          required
          aria-required="true"
          className={cn(inputClass, 'mt-1.5 h-auto min-h-[5.5rem] py-2')}
          value={locationDetails}
          placeholder="e.g. house number, village, landmark, area (required, 10–300 words)"
          onChange={(e) =>
            setLocationDetails(limitToMaxWords(e.target.value, LOCATION_DETAILS_MAX_WORDS))
          }
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {countWords(locationDetails)} / {LOCATION_DETAILS_MAX_WORDS} words (minimum{' '}
          {LOCATION_DETAILS_MIN_WORDS})
        </p>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="motherTongue">Mother tongue</Label>
        {languageOptions.length > 0 ? (
          <SelectWithChevron
            id="motherTongue"
            label=""
            aria-label="Mother tongue"
            value={motherTongue}
            onChange={(e) => setMotherTongue(e.target.value)}
          >
            <option value="">Select language</option>
            {languageOptions.map((lang) => (
              <option key={lang.code} value={lang.name}>
                {lang.name}
              </option>
            ))}
          </SelectWithChevron>
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
        onSave={() => {
          const detailsError = validateProfileLocationDetails(locationDetails);
          if (detailsError) {
            toast.error(detailsError);
            return;
          }
          const tzRaw = checkInTimeZone.trim();
          const tzNormalized = tzRaw
            ? normalizeCheckInTimeZone(tzRaw, { countryAlpha2: geo.alpha2 })
            : null;
          if (tzRaw && !tzNormalized) {
            toast.error('Use a time zone from the list (e.g. Asia/Dhaka), not UTC+06:00.');
            return;
          }
          onSave({
            country,
            stateRegion: stateRegion || null,
            city,
            postalCode: postalCode || null,
            checkInTimeZone: tzNormalized,
            locationDetails: locationDetails.trim(),
            motherTongue: motherTongue || null,
          });
        }}
      />
    </div>
  );
}

const INCOME_CURRENCY_OPTIONS = ['USD', 'BDT', 'INR', 'GBP', 'EUR', 'AED', 'SAR'] as const;

function EducationForm({
  profile,
  myPreference,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  myPreference: BiodataMeDto['myPreference'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const maxGraduationYear = new Date().getFullYear() + 1;
  const [degreeName, setDegreeName] = React.useState(() => initialDegreeName(profile));
  const [degreeMajor, setDegreeMajor] = React.useState(profile.degreeMajor ?? '');
  const [institution, setInstitution] = React.useState(profile.institution ?? '');
  const [graduationYear, setGraduationYear] = React.useState(
    profile.graduationYear != null ? String(profile.graduationYear) : '',
  );
  const [occupation, setOccupation] = React.useState(profile.occupation ?? '');
  const [employer, setEmployer] = React.useState(profile.employer ?? '');
  const [yearsExperience, setYearsExperience] = React.useState(
    profile.yearsExperience != null ? String(profile.yearsExperience) : '',
  );
  const [workLocation, setWorkLocation] = React.useState(profile.workLocation ?? '');
  const [monthlyIncome, setMonthlyIncome] = React.useState(
    myPreference?.monthlyIncome != null ? String(myPreference.monthlyIncome) : '',
  );
  const [incomeCurrency, setIncomeCurrency] = React.useState(myPreference?.incomeCurrency ?? 'USD');
  const [bio, setBio] = React.useState(profile.bio ?? '');

  const parseOptionalInt = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) ? Math.trunc(num) : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={cn(sectionSubheadingClass, 'mb-3')}>Latest qualification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="degreeName">Degree / qualification</Label>
            <input
              id="degreeName"
              className={inputClass}
              placeholder="e.g. BSc, MBA, HSC"
              value={degreeName}
              onChange={(e) => setDegreeName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="degreeMajor">Major / field of study</Label>
            <input
              id="degreeMajor"
              className={inputClass}
              placeholder="e.g. Computer Science"
              value={degreeMajor}
              onChange={(e) => setDegreeMajor(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="institution">University / college</Label>
            <input
              id="institution"
              className={inputClass}
              placeholder="Institution name"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="graduationYear">Passing / graduation year</Label>
            <input
              id="graduationYear"
              type="number"
              min={1950}
              max={maxGraduationYear}
              inputMode="numeric"
              className={inputClass}
              placeholder="2020"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="monthlyIncome">Monthly income (optional)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="monthlyIncome"
                type="number"
                min={0}
                inputMode="decimal"
                className={cn(inputClass, 'sm:flex-1')}
                placeholder="Amount"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
              <SelectWithChevron
                id="incomeCurrency"
                label=""
                aria-label="Income currency"
                className="sm:w-28"
                value={incomeCurrency}
                onChange={(e) => setIncomeCurrency(e.target.value)}
              >
                {INCOME_CURRENCY_OPTIONS.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </SelectWithChevron>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className={cn(sectionSubheadingClass, 'mb-3')}>Career</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="occupation">Job title</Label>
            <input
              id="occupation"
              className={inputClass}
              placeholder="e.g. Software engineer"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="employer">Employer / company</Label>
            <input
              id="employer"
              className={inputClass}
              placeholder="Organization name"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <input
              id="yearsExperience"
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              className={inputClass}
              placeholder="0"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="workLocation">Work location</Label>
            <input
              id="workLocation"
              className={inputClass}
              placeholder="City, country"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className={cn(sectionSubheadingClass, 'mb-3')}>About you</h3>
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={5}
          maxLength={1000}
          className={cn(inputClass, 'h-auto py-2')}
          placeholder="Brief introduction for your biodata profile…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <p className="text-muted-foreground mt-1 text-xs">{bio.length}/1000 characters</p>
      </div>
      <SaveRow
        pending={pending}
        onSave={() =>
          onSave({
            degreeName: degreeName || null,
            degreeMajor: degreeMajor || null,
            institution: institution || null,
            graduationYear: parseOptionalInt(graduationYear),
            occupation: occupation || null,
            employer: employer || null,
            yearsExperience: parseOptionalInt(yearsExperience),
            workLocation: workLocation || null,
            bio: bio || null,
            monthlyIncome: parseOptionalInt(monthlyIncome),
            incomeCurrency,
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
      <SelectWithChevron
        id="myGender"
        label="Gender"
        value={gender}
        onChange={(e) => setGender(e.target.value as typeof gender)}
      >
        {GENDER_VALUES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </SelectWithChevron>
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
