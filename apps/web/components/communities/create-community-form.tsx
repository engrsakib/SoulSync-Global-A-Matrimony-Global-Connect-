'use client';

import { useState } from 'react';
import { Button } from '@soulsync/ui/button';
import { Input } from '@soulsync/ui/input';
import { Label } from '@soulsync/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import { toast } from 'sonner';
import type { CommunityDto, CommunityPrivacyDto } from '@soulsync/shared-types/communities';
import { createCommunity } from '@/lib/communities-client';
import { fetchCountries } from '@/lib/geo/client';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';
import {
  CommunityEligibilityFields,
  parseEligibilityFromForm,
  type CommunityEligibilityState,
} from './community-eligibility-fields';

type CreateCommunityFormProps = {
  onCreated: (community: CommunityDto) => void;
};

export function CreateCommunityForm({ onCreated }: CreateCommunityFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<CommunityPrivacyDto>('PUBLIC');
  const [eligibility, setEligibility] = useState<CommunityEligibilityState>({
    limitEligibility: false,
    minAge: '',
    maxAge: '',
    allowedReligions: [],
    allowedCountries: [],
  });
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
    setEligibility({
      limitEligibility: false,
      minAge: '',
      maxAge: '',
      allowedReligions: [],
      allowedCountries: [],
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name is required');
      return;
    }

    const parsed = parseEligibilityFromForm(eligibility);
    if ('error' in parsed) {
      toast.error(parsed.error);
      return;
    }

    setBusy(true);
    try {
      const created = await createCommunity({
        name: trimmed,
        description: description.trim() || null,
        privacy,
        ...parsed,
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

          <CommunityEligibilityFields
            state={eligibility}
            onChange={(patch) => setEligibility((prev) => ({ ...prev, ...patch }))}
            countries={countries}
            countriesLoading={countriesLoading}
            onRequestCountries={() => void ensureCountriesLoaded()}
          />

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
