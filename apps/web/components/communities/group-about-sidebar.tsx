import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { PrivacyBadge } from './privacy-badge';

type GroupAboutSidebarProps = {
  community: CommunityDto;
};

export function GroupAboutSidebar({ community }: GroupAboutSidebarProps) {
  const hasEligibility =
    community.allowedReligions.length > 0 ||
    community.allowedCountries.length > 0 ||
    community.minAge != null ||
    community.maxAge != null;

  return (
    <Card className="sticky top-24 border-[var(--border)]/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted-foreground)]">Privacy</span>
          <PrivacyBadge privacy={community.privacy} />
        </div>
        {community.description ? <p className="leading-relaxed">{community.description}</p> : null}
        {hasEligibility ? (
          <div className="space-y-1 rounded-lg bg-[var(--muted)]/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Join eligibility
            </p>
            {community.allowedReligions.length > 0 ? (
              <p>Religion: {community.allowedReligions.join(', ')}</p>
            ) : null}
            {community.allowedCountries.length > 0 ? (
              <p>Countries: {community.allowedCountries.join(', ')}</p>
            ) : null}
            {community.minAge != null || community.maxAge != null ? (
              <p>
                Age: {community.minAge ?? '—'} – {community.maxAge ?? '—'}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-[var(--muted-foreground)]">Open to all eligible members in your community.</p>
        )}
      </CardContent>
    </Card>
  );
}
