'use client';

import {
  BLOOD_GROUP_LABELS,
  COMPLEXION_SELF_LABELS,
  COMPLEXION_SELF_VALUES,
  MARITAL_STATUS_LABELS,
  type ComplexionSelf,
} from '@soulsync/shared-types/partner-preference';
import type { ShareableBiodataSectionId } from '@soulsync/shared-types/biodata-visibility';
import {
  FAMILY_ECONOMIC_CLASS_LABELS,
  FAMILY_RELATIVE_RELATIONSHIP_LABELS,
  formatParentAliveDisplay,
  type FamilyRelativeEntry,
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
  messagingTelegramHref,
  messagingWhatsAppHref,
} from '@soulsync/shared-types/guardian-contact';
import { getPartnerPreferredLocations } from '@soulsync/shared-types/partner-preferences-ui';
import {
  formatReligionPracticeRead,
  usesIslamMadhabField,
} from '@soulsync/shared-types/religion-branches';
import type { PartnerPreferenceDto } from '@soulsync/shared-types/partner-preference';
import type { Gender, Religion } from '@soulsync/shared-types/partner-preference';
import { cn } from '@soulsync/ui/lib/utils';
import { formatDateOfBirthDisplay } from '@/lib/age-from-dob';
import { formatBmiDisplay, formatHealthConditionDisplay } from '@/lib/bmi';
import { formatHeightFromCm } from '@/lib/height-units';
const sectionSubheadingClass = 'text-sm font-semibold tracking-tight text-[var(--foreground)]';

function enumLabel<T extends string>(value: unknown, labels: Record<T, string>): string {
  return formatEnumLabel(value as T | null | undefined, labels);
}

function displayText(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

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

type BiodataSectionReadProps = {
  sectionId: ShareableBiodataSectionId;
  content: Record<string, unknown>;
};

export function BiodataSectionRead({ sectionId, content }: BiodataSectionReadProps) {
  switch (sectionId) {
    case 'basic':
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Display name" value={displayText(content.displayName)} />
          <Field label="Gender" value={displayText(content.gender)} />
          <Field
            label="Age"
            value={formatDateOfBirthDisplay(displayText(content.dateOfBirth, ''))}
          />
          <Field
            label="Height"
            value={formatHeightFromCm(content.heightCm as number | null | undefined)}
          />
          <Field
            label="Marital status"
            value={
              MARITAL_STATUS_LABELS[content.maritalStatus as keyof typeof MARITAL_STATUS_LABELS] ??
              displayText(content.maritalStatus)
            }
          />
          <Field
            label="Skin tone"
            value={
              content.complexion &&
              COMPLEXION_SELF_VALUES.includes(content.complexion as ComplexionSelf)
                ? COMPLEXION_SELF_LABELS[content.complexion as ComplexionSelf]
                : displayText(content.complexion)
            }
          />
          <Field
            label="Blood group"
            value={
              content.bloodGroup
                ? BLOOD_GROUP_LABELS[content.bloodGroup as keyof typeof BLOOD_GROUP_LABELS]
                : '—'
            }
          />
          <Field
            label="Weight (kg)"
            value={typeof content.weightKg === 'number' ? String(content.weightKg) : '—'}
          />
          <Field
            label="BMI"
            value={formatBmiDisplay(
              typeof content.heightCm === 'number' ? content.heightCm : null,
              typeof content.weightKg === 'number' ? content.weightKg : null,
            )}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field
              label="Health condition"
              value={formatHealthConditionDisplay({
                hasChronicConditions:
                  typeof content.hasChronicConditions === 'boolean'
                    ? content.hasChronicConditions
                    : null,
                chronicConditionsDetail:
                  typeof content.chronicConditionsDetail === 'string'
                    ? content.chronicConditionsDetail
                    : null,
              })}
            />
          </div>
        </div>
      );
    case 'location':
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Country" value={displayText(content.country)} />
          <Field label="State / province" value={displayText(content.stateRegion)} />
          <Field label="City" value={displayText(content.city)} />
          <Field label="Postal code" value={displayText(content.postalCode)} />
          <Field
            label="Time zone (daily check-in)"
            value={displayText(content.checkInTimeZone, 'UTC (default until set)')}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Location details" value={displayText(content.locationDetails)} />
          </div>
          <Field label="Mother tongue" value={displayText(content.motherTongue)} />
        </div>
      );
    case 'faith': {
      const read = formatReligionPracticeRead({
        religion: content.religion as Religion,
        denomination: (content.denomination as string | null) ?? null,
        community: (content.community as string | null) ?? null,
        religiousPractice: (content.religiousPractice as string | null) ?? null,
        islamMaslak: (content.islamMaslak as never) ?? null,
      });
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Faith tradition" value={read.religion} />
          <Field label="Branch / tradition" value={read.branch} />
          <Field
            label={
              usesIslamMadhabField(
                content.religion as Religion,
                content.denomination as string | null,
              )
                ? 'School of jurisprudence (madhab)'
                : 'Practice / observance'
            }
            value={read.madhabOrPractice}
          />
          {content.religion === 'ISLAM' ? (
            <Field label="Maslak (school of thought)" value={read.maslak} />
          ) : null}
          <Field label="Community" value={read.community} />
        </div>
      );
    }
    case 'education_career':
      return (
        <div className="space-y-6">
          <div>
            <h3 className={cn(sectionSubheadingClass, 'mb-3')}>Latest qualification</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Degree"
                value={displayText(content.degreeName, displayText(content.education))}
              />
              <Field label="Major" value={displayText(content.degreeMajor)} />
              <Field label="University / college" value={displayText(content.institution)} />
              <Field
                label="Passing year"
                value={
                  typeof content.graduationYear === 'number' ? String(content.graduationYear) : '—'
                }
              />
              {!displayText(content.degreeName, '') &&
              !displayText(content.degreeMajor, '') &&
              !displayText(content.institution, '') &&
              typeof content.graduationYear !== 'number' &&
              content.education ? (
                <Field label="Education (legacy)" value={displayText(content.education)} />
              ) : null}
              <Field
                label="Monthly income (optional)"
                value={
                  typeof content.monthlyIncome === 'number'
                    ? `${content.monthlyIncome} ${displayText(content.incomeCurrency, '')}`
                    : '—'
                }
              />
            </div>
          </div>
          <div>
            <h3 className={cn(sectionSubheadingClass, 'mb-3')}>Career</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Job title" value={displayText(content.occupation)} />
              <Field label="Employer" value={displayText(content.employer)} />
              <Field
                label="Years of experience"
                value={
                  typeof content.yearsExperience === 'number'
                    ? String(content.yearsExperience)
                    : '—'
                }
              />
              <Field label="Work location" value={displayText(content.workLocation)} />
            </div>
          </div>
          <div>
            <h3 className={cn(sectionSubheadingClass, 'mb-3')}>About you</h3>
            <Field label="Bio" value={displayText(content.bio)} />
          </div>
        </div>
      );
    case 'islam_sharia':
      return (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className={sectionSubheadingClass}>Salah and aqeedah</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Five daily / congregation prayers"
                value={enumLabel(content.prayerRegularity, PRAYER_REGULARITY_LABELS)}
              />
              <Field
                label="Missed fard prayers (approx.)"
                value={displayText(content.missedFardPrayersNotes, '')}
              />
              <Field label="Aqeedah" value={displayText(content.aqeedahNotes, '')} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className={sectionSubheadingClass}>Appearance and practice</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {shouldShowBeardFields(content.gender as Gender) ? (
                <>
                  <Field
                    label="Sunnah beard"
                    value={enumLabel(content.sunnahBeardStatus, SUNNAH_BEARD_STATUS_LABELS)}
                  />
                  <Field label="Beard details" value={displayText(content.beardDetails, '')} />
                </>
              ) : null}
              {shouldShowHijabField(content.gender as Gender) ? (
                <Field
                  label="Hijab / purdah"
                  value={enumLabel(content.hijabPurdah, HIJAB_PURDAH_LABELS)}
                />
              ) : null}
              <Field
                label="Quran recitation"
                value={enumLabel(content.quranRecitationLevel, QURAN_RECITATION_LEVEL_LABELS)}
              />
              <Field
                label="Mahram compliance"
                value={enumLabel(content.mahramCompliance, MAHRAM_COMPLIANCE_LABELS)}
              />
              <Field
                label="Clothing above ankles"
                value={enumLabel(content.clothingAboveAnkles, CLOTHING_ABOVE_ANKLES_LABELS)}
              />
              <Field label="Quran hifz" value={displayText(content.quranHifzNotes, '')} />
              <Field
                label="Income fully halal"
                value={formatBooleanYes(
                  typeof content.incomeFullyHalal === 'boolean' ? content.incomeFullyHalal : null,
                )}
              />
            </div>
          </div>
        </div>
      );
    case 'family_heritage': {
      const relatives = (content.familyRelatives as FamilyRelativeEntry[] | undefined) ?? [];
      return (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Father alive"
              value={formatParentAliveDisplay(content.fatherIsAlive as boolean | null)}
            />
            <Field
              label="Mother alive"
              value={formatParentAliveDisplay(content.motherIsAlive as boolean | null)}
            />
            <Field label="Father's profession" value={displayText(content.fatherProfession)} />
            <Field label="Mother's profession" value={displayText(content.motherProfession)} />
            <Field
              label="Brothers"
              value={typeof content.brotherCount === 'number' ? String(content.brotherCount) : '—'}
            />
            <Field
              label="Sisters"
              value={typeof content.sisterCount === 'number' ? String(content.sisterCount) : '—'}
            />
            <Field
              label="Family economic class"
              value={
                content.familyEconomicClass
                  ? FAMILY_ECONOMIC_CLASS_LABELS[
                      content.familyEconomicClass as keyof typeof FAMILY_ECONOMIC_CLASS_LABELS
                    ]
                  : '—'
              }
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Residence" value={displayText(content.residenceDescription)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field
                label="Uncles / extended family"
                value={displayText(content.unclesOccupations)}
              />
            </div>
          </div>
          {relatives.length > 0 ? (
            <div className="space-y-3">
              <h3 className={sectionSubheadingClass}>Family members</h3>
              {relatives.map((rel, index) => (
                <div
                  key={`${rel.name}-${index}`}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm"
                >
                  <p className="font-medium">{rel.name || '—'}</p>
                  <p className="text-[var(--muted-foreground)]">
                    {FAMILY_RELATIVE_RELATIONSHIP_LABELS[rel.relationship] ?? rel.relationship} ·{' '}
                    {rel.profession || '—'}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case 'partner': {
      const pp = content.partnerPreference as PartnerPreferenceDto | undefined;
      if (!pp) {
        return (
          <p className="text-sm text-[var(--muted-foreground)]">No partner preferences on file.</p>
        );
      }
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Age range" value={`${pp.minAge} – ${pp.maxAge}`} />
          <Field label="Min height (cm)" value={String(pp.minHeightCm ?? '—')} />
          <Field label="Preferred gender" value={String(pp.preferredGender ?? '—')} />
        </div>
      );
    }
    case 'partner_location': {
      const customExpectations = content.customExpectations as
        PartnerPreferenceDto['customExpectations'] | undefined;
      const locations = getPartnerPreferredLocations(
        customExpectations ? ({ customExpectations } as PartnerPreferenceDto) : null,
      );
      if (locations.length === 0) {
        return (
          <p className="text-sm text-[var(--muted-foreground)]">No preferred locations listed.</p>
        );
      }
      return (
        <ul className="space-y-2 text-sm">
          {locations.map((loc, i) => (
            <li key={i} className="rounded-lg border border-[var(--border)] p-3">
              {[loc.country, loc.stateRegion, loc.city, loc.postalCode].filter(Boolean).join(', ')}
              {loc.motherTongue ? ` · ${loc.motherTongue}` : ''}
            </li>
          ))}
        </ul>
      );
    }
    case 'guardian_contact': {
      const waG = messagingWhatsAppHref(displayText(content.guardianWhatsApp, ''));
      const tgG = messagingTelegramHref(displayText(content.guardianTelegram, ''));
      const waC = messagingWhatsAppHref(displayText(content.candidateWhatsApp, ''));
      const tgC = messagingTelegramHref(displayText(content.candidateTelegram, ''));
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Guardian relationship" value={displayText(content.guardianRelationship)} />
          <Field label="Guardian name" value={displayText(content.guardianName)} />
          <Field label="Guardian mobile" value={displayText(content.guardianMobile)} />
          <Field
            label="Guardian WhatsApp"
            value={displayText(content.guardianWhatsApp)}
            href={waG}
          />
          <Field
            label="Guardian Telegram"
            value={displayText(content.guardianTelegram)}
            href={tgG}
          />
          <Field label="Candidate mobile" value={displayText(content.candidateMobile)} />
          <Field
            label="Candidate WhatsApp"
            value={displayText(content.candidateWhatsApp)}
            href={waC}
          />
          <Field
            label="Candidate Telegram"
            value={displayText(content.candidateTelegram)}
            href={tgC}
          />
        </div>
      );
    }
    case 'my_attributes':
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          {Object.entries(content).map(([key, value]) => (
            <Field key={key} label={key.replace(/([A-Z])/g, ' $1')} value={displayText(value)} />
          ))}
        </div>
      );
    default:
      return null;
  }
}
