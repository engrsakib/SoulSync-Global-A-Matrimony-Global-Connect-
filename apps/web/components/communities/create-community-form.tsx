'use client';

import { useState } from 'react';
import { Button } from '@soulsync/ui/button';
import { Input } from '@soulsync/ui/input';
import { Label } from '@soulsync/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type { CommunityDto, CommunityPrivacyDto } from '@soulsync/shared-types/communities';
import type { Religion } from '@soulsync/shared-types/partner-preference';
import { RELIGION_VALUES } from '@soulsync/shared-types/partner-preference';
import { RELIGION_LABELS } from '@soulsync/shared-types/religion-branches';
import { createCommunity } from '@/lib/communities-client';
import { fetchCountries } from '@/lib/geo/client';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';

const ELIGIBILITY_RELIGIONS = RELIGION_VALUES.filter(
  (r): r is Religion => r !== 'PREFER_NOT_TO_SAY',
);

type CreateCommunityFormProps = {
  onCreated: (community: CommunityDto) => void;
};

export function CreateCommunityForm({ onCreated }: CreateCommunityFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<CommunityPrivacyDto>('PUBLIC');
  const [limitEligibility, setLimitEligibility] = useState(false);
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [allowedReligions, setAllowedReligions] = useState<Religion[]>([]);
  const [allowedCountries, setAllowedCountries] = useState<string[]>([]);
  const [countries, setCountries] = useState<GeoCountrySummary[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function ensureCountriesLoaded() {
    if (countries.length > 0 || countriesLoading) {
      return;
    }
    setCountriesLoading(true);
    try {
      setCountries(await fetchCountries());
    } catch {
      toast.error('Could not load countries for area restrictions');
    } finally {
      setCountriesLoading(false);
    }
  }

  function resetForm() {
    setName('');
    setDescription('');
    setPrivacy('PUBLIC');
    setLimitEligibility(false);
    setMinAge('');
    setMaxAge('');
    setAllowedReligions([]);
    setAllowedCountries([]);
  }

  function toggleReligion(religion: Religion) {
    setAllowedReligions((prev) =>
      prev.includes(religion) ? prev.filter((r) => r !== religion) : [...prev, religion],
    );
  }

  function toggleCountry(alpha2: string) {
    setAllowedCountries((prev) =>
      prev.includes(alpha2) ? prev.filter((c) => c !== alpha2) : [...prev, alpha2],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name is required');
      return;
    }

    let parsedMin: number | null = null;
    let parsedMax: number | null = null;
    if (limitEligibility) {
      if (minAge.trim()) {
        parsedMin = Number.parseInt(minAge, 10);
        if (!Number.isFinite(parsedMin) || parsedMin < 16 || parsedMin > 100) {
          toast.error('Minimum age must be between 16 and 100');
          return;
        }
      }
      if (maxAge.trim()) {
        parsedMax = Number.parseInt(maxAge, 10);
        if (!Number.isFinite(parsedMax) || parsedMax < 16 || parsedMax > 100) {
          toast.error('Maximum age must be between 16 and 100');
          return;
        }
      }
      if (parsedMin != null && parsedMax != null && parsedMin > parsedMax) {
        toast.error('Minimum age cannot exceed maximum age');
        return;
      }
    }

    setBusy(true);
    try {
      const created = await createCommunity({
        name: trimmed,
        description: description.trim() || null,
        privacy,
        ...(limitEligibility
          ? {
              minAge: parsedMin,
              maxAge: parsedMax,
              allowedReligions,
              allowedCountries,
            }
          : {
              minAge: null,
              maxAge: null,
              allowedReligions: [],
              allowedCountries: [],
            }),
      });
      toast.success('Community created');
      resetForm();
      setOpen(false);
      onCreated(created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create community');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        className="bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]"
        onClick={() => {
          setOpen(true);
          void ensureCountriesLoaded();
        }}
      >
        Create community
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-lg border-[var(--border)]/80 shadow-sm sm:max-w-xl">
      <CardHeader>
        <CardTitle className="text-lg">Create a community</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Set who can join using age, religion, and country. Leave restrictions off to allow all
          eligible members in your tenant.
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="community-name">Name</Label>
            <Input
              id="community-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dhaka professionals"
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="community-desc">Description (optional)</Label>
            <textarea
              id="community-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="What is this community about?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="community-privacy">Privacy</Label>
            <select
              id="community-privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as CommunityPrivacyDto)}
              className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 text-sm"
            >
              <option value="PUBLIC">Public — eligible members can join instantly</option>
              <option value="PRIVATE">Private — moderators approve join requests</option>
            </select>
          </div>

          <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={limitEligibility}
                onChange={(e) => {
                  setLimitEligibility(e.target.checked);
                  if (e.target.checked) {
                    void ensureCountriesLoaded();
                  }
                }}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">Restrict who can join</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Match profile religion, country (from biodata), and age. Empty lists mean no
                  limit for that rule.
                </span>
              </span>
            </label>

            {limitEligibility ? (
              <div className="space-y-4 border-t border-[var(--border)]/60 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="community-min-age">Minimum age</Label>
                    <Input
                      id="community-min-age"
                      type="number"
                      min={16}
                      max={100}
                      placeholder="Any"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="community-max-age">Maximum age</Label>
                    <Input
                      id="community-max-age"
                      type="number"
                      min={16}
                      max={100}
                      placeholder="Any"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
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

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
