'use client';

import { Input } from '@soulsync/ui/input';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import type { Religion } from '@soulsync/shared-types/partner-preference';
import { RELIGION_VALUES } from '@soulsync/shared-types/partner-preference';
import { RELIGION_LABELS } from '@soulsync/shared-types/religion-branches';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';

const ELIGIBILITY_RELIGIONS = RELIGION_VALUES.filter(
  (r): r is Religion => r !== 'PREFER_NOT_TO_SAY',
);

export type CommunityEligibilityState = {
  limitEligibility: boolean;
  minAge: string;
  maxAge: string;
  allowedReligions: Religion[];
  allowedCountries: string[];
};

type CommunityEligibilityFieldsProps = {
  state: CommunityEligibilityState;
  onChange: (patch: Partial<CommunityEligibilityState>) => void;
  countries: GeoCountrySummary[];
  countriesLoading: boolean;
  onRequestCountries: () => void;
  idPrefix?: string;
};

export function CommunityEligibilityFields({
  state,
  onChange,
  countries,
  countriesLoading,
  onRequestCountries,
  idPrefix = 'community',
}: CommunityEligibilityFieldsProps) {
  const { limitEligibility, minAge, maxAge, allowedReligions, allowedCountries } = state;

  function toggleReligion(religion: Religion) {
    onChange({
      allowedReligions: allowedReligions.includes(religion)
        ? allowedReligions.filter((r) => r !== religion)
        : [...allowedReligions, religion],
    });
  }

  function toggleCountry(alpha2: string) {
    onChange({
      allowedCountries: allowedCountries.includes(alpha2)
        ? allowedCountries.filter((c) => c !== alpha2)
        : [...allowedCountries, alpha2],
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={limitEligibility}
          onChange={(e) => {
            const checked = e.target.checked;
            onChange({ limitEligibility: checked });
            if (checked) {
              onRequestCountries();
            }
          }}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium">Restrict who can join</span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Match profile religion, country (from biodata), and age. Empty lists mean no limit for
            that rule.
          </span>
        </span>
      </label>

      {limitEligibility ? (
        <div className="space-y-4 border-t border-[var(--border)]/60 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-min-age`}>Minimum age</Label>
              <Input
                id={`${idPrefix}-min-age`}
                type="number"
                min={16}
                max={100}
                placeholder="Any"
                value={minAge}
                onChange={(e) => onChange({ minAge: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-max-age`}>Maximum age</Label>
              <Input
                id={`${idPrefix}-max-age`}
                type="number"
                min={16}
                max={100}
                placeholder="Any"
                value={maxAge}
                onChange={(e) => onChange({ maxAge: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Religion (optional — none selected = any religion)</Label>
            <div className="flex flex-wrap gap-2">
              {ELIGIBILITY_RELIGIONS.map((religion) => {
                const selected = allowedReligions.includes(religion);
                return (
                  <button
                    key={religion}
                    type="button"
                    onClick={() => toggleReligion(religion)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      selected
                        ? 'border-[var(--color-brand-700)] bg-[var(--color-brand-700)] text-white'
                        : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]',
                    )}
                  >
                    {RELIGION_LABELS[religion]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Country / area (optional — none selected = any country)</Label>
            {countriesLoading ? (
              <p className="text-xs text-[var(--muted-foreground)]">Loading countries…</p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-2">
                <div className="flex flex-wrap gap-1.5">
                  {countries.map((country) => {
                    const code = country.alpha2.toUpperCase();
                    const selected = allowedCountries.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        title={country.name}
                        onClick={() => toggleCountry(code)}
                        className={cn(
                          'rounded-md border px-2 py-0.5 text-xs transition-colors',
                          selected
                            ? 'border-[var(--color-brand-700)] bg-[var(--color-brand-50)] font-medium text-[var(--color-brand-900)]'
                            : 'border-transparent hover:bg-[var(--muted)]',
                        )}
                      >
                        {country.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function parseEligibilityFromForm(state: CommunityEligibilityState): {
  minAge: number | null;
  maxAge: number | null;
  allowedReligions: Religion[];
  allowedCountries: string[];
} | { error: string } {
  if (!state.limitEligibility) {
    return {
      minAge: null,
      maxAge: null,
      allowedReligions: [],
      allowedCountries: [],
    };
  }

  let parsedMin: number | null = null;
  let parsedMax: number | null = null;
  if (state.minAge.trim()) {
    parsedMin = Number.parseInt(state.minAge, 10);
    if (!Number.isFinite(parsedMin) || parsedMin < 16 || parsedMin > 100) {
      return { error: 'Minimum age must be between 16 and 100' };
    }
  }
  if (state.maxAge.trim()) {
    parsedMax = Number.parseInt(state.maxAge, 10);
    if (!Number.isFinite(parsedMax) || parsedMax < 16 || parsedMax > 100) {
      return { error: 'Maximum age must be between 16 and 100' };
    }
  }
  if (parsedMin != null && parsedMax != null && parsedMin > parsedMax) {
    return { error: 'Minimum age cannot exceed maximum age' };
  }

  return {
    minAge: parsedMin,
    maxAge: parsedMax,
    allowedReligions: state.allowedReligions,
    allowedCountries: state.allowedCountries,
  };
}

export function eligibilityStateFromCommunity(community: {
  minAge: number | null;
  maxAge: number | null;
  allowedReligions: string[];
  allowedCountries: string[];
}): CommunityEligibilityState {
  const hasRules =
    community.allowedReligions.length > 0 ||
    community.allowedCountries.length > 0 ||
    community.minAge != null ||
    community.maxAge != null;

  return {
    limitEligibility: hasRules,
    minAge: community.minAge != null ? String(community.minAge) : '',
    maxAge: community.maxAge != null ? String(community.maxAge) : '',
    allowedReligions: community.allowedReligions as Religion[],
    allowedCountries: community.allowedCountries,
  };
}
