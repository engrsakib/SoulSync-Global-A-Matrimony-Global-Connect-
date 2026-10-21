'use client';

import { useCallback, useState } from 'react';
import type {
  CommunityDto,
  CommunityPostApprovalModeDto,
  CommunityPrivacyDto,
} from '@soulsync/shared-types/communities';
import { COMMUNITY_POST_APPROVAL_MODES } from '@soulsync/shared-types/communities';
import { Button } from '@soulsync/ui/button';
import { Input } from '@soulsync/ui/input';
import { Label } from '@soulsync/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import { toast } from 'sonner';
import { patchCommunity } from '@/lib/communities-client';
import { fetchCountries } from '@/lib/geo/client';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';
import {
  CommunityEligibilityFields,
  eligibilityStateFromCommunity,
  parseEligibilityFromForm,
  type CommunityEligibilityState,
} from './community-eligibility-fields';

const POST_APPROVAL_LABELS: Record<CommunityPostApprovalModeDto, string> = {
  AUTO_APPROVE: 'Publish immediately',
  ALL_PENDING: 'All posts need approval',
  TRUSTED_AUTO_REST_PENDING: 'Trusted members auto-publish; others need approval',
};

type CommunitySettingsFormProps = {
  community: CommunityDto;
  onSaved: (community: CommunityDto) => void;
};

export function CommunitySettingsForm({ community, onSaved }: CommunitySettingsFormProps) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? '');
  const [privacy, setPrivacy] = useState<CommunityPrivacyDto>(community.privacy);
  const [postApprovalMode, setPostApprovalMode] = useState<CommunityPostApprovalModeDto>(
    community.postApprovalMode,
  );
  const [eligibility, setEligibility] = useState<CommunityEligibilityState>(() =>
    eligibilityStateFromCommunity(community),
  );
  const [countries, setCountries] = useState<GeoCountrySummary[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const ensureCountriesLoaded = useCallback(async () => {
    if (countries.length > 0 || countriesLoading) {
      return;
    }
    setCountriesLoading(true);
    try {
      setCountries(await fetchCountries());
    } catch {
      toast.error('Could not load countries');
    } finally {
      setCountriesLoading(false);
    }
  }, [countries.length, countriesLoading]);

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
      const updated = await patchCommunity(community.slug, {
        name: trimmed,
        description: description.trim() || null,
        privacy,
        postApprovalMode,
        ...parsed,
      });
      toast.success('Community settings saved');
      onSaved(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save settings');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <Card className="border-[var(--border)]/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Community name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-desc">Description</Label>
            <textarea
              id="settings-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-1 text-sm">
            <span className="text-[var(--muted-foreground)]">Public URL slug</span>
            <p className="font-mono text-xs text-[var(--foreground)]">/communities/{community.slug}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Slug stays the same when you rename the community.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)]/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Privacy & posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-privacy">Who can join</Label>
            <select
              id="settings-privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as CommunityPrivacyDto)}
              className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 text-sm"
            >
              <option value="PUBLIC">Public — eligible members join instantly</option>
              <option value="PRIVATE">Private — team approves join requests</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-post-mode">Post approval</Label>
            <select
              id="settings-post-mode"
              value={postApprovalMode}
              onChange={(e) =>
                setPostApprovalMode(e.target.value as CommunityPostApprovalModeDto)
              }
              className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 text-sm"
            >
              {COMMUNITY_POST_APPROVAL_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {POST_APPROVAL_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <CommunityEligibilityFields
        idPrefix="settings"
        state={eligibility}
        onChange={(patch) => setEligibility((prev) => ({ ...prev, ...patch }))}
        countries={countries}
        countriesLoading={countriesLoading}
        onRequestCountries={() => void ensureCountriesLoaded()}
      />

      <Button type="submit" disabled={busy} className="bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]">
        {busy ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  );
}
