'use client';

import * as React from 'react';
import Image from 'next/image';
import type {
  BiodataSectionViewerAccess,
  MemberBiodataViewDto,
  MemberBiodataViewSectionDto,
} from '@soulsync/shared-types/biodata-view';
import { Button } from '@soulsync/ui/button';
import { toast } from 'sonner';
import { createBiodataAccessRequest, fetchMemberBiodataView } from '@/lib/biodata-view-api';
import { BiodataSectionRead } from '@/components/biodata/biodata-section-read';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';

type MemberBiodataViewProps = {
  initialView: MemberBiodataViewDto;
  username: string;
};

function accessMessage(access: BiodataSectionViewerAccess): string | null {
  switch (access) {
    case 'locked':
      return 'This section requires permission from the member.';
    case 'pending':
      return 'Your access request is pending review.';
    case 'denied':
      return 'Your previous request was declined.';
    case 'expired':
      return 'Your access grant expired. You can request again.';
    case 'not_applicable':
      return 'Not applicable for this profile.';
    default:
      return null;
  }
}

function SectionCard({
  section,
  ownerUserId,
  onRefresh,
}: {
  section: MemberBiodataViewSectionDto;
  ownerUserId: string;
  onRefresh: () => void;
}) {
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  if (section.access === 'not_applicable') {
    return null;
  }

  const locked = section.access !== 'visible';
  const hint = accessMessage(section.access);

  const requestAccess = async () => {
    setBusy(true);
    try {
      await createBiodataAccessRequest({
        ownerUserId,
        sectionId: section.sectionId,
        message: message.trim() || undefined,
      });
      toast.success('Access request sent');
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--foreground)]">{section.title}</h2>

      {locked ? (
        <div className="mt-4 space-y-3">
          {hint ? <p className="text-sm text-[var(--muted-foreground)]">{hint}</p> : null}
          {section.access === 'locked' ||
          section.access === 'expired' ||
          section.access === 'denied' ? (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="Optional message to the member"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
              />
              <Button type="button" size="sm" disabled={busy} onClick={() => void requestAccess()}>
                Request access
              </Button>
            </>
          ) : null}
        </div>
      ) : section.content ? (
        <div className="mt-4">
          <BiodataSectionRead sectionId={section.sectionId} content={section.content} />
        </div>
      ) : null}
    </article>
  );
}

export function MemberBiodataView({ initialView, username }: MemberBiodataViewProps) {
  const [view, setView] = React.useState(initialView);

  const refresh = React.useCallback(async () => {
    try {
      const next = await fetchMemberBiodataView(username);
      setView(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh');
    }
  }, [username]);

  const { owner } = view;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 sm:flex-row sm:items-center sm:gap-5">
        <Avatar className="h-20 w-20 shrink-0 self-start sm:self-center">
          {owner.avatarUrl ? (
            <Image
              src={owner.avatarUrl}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <AvatarFallback className="text-lg">
              {owner.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1 text-left">
          <h1 className="text-xl leading-tight font-semibold text-[var(--foreground)]">
            {owner.displayName}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">@{owner.username}</p>
          <p className="mt-3 border-t border-[var(--border)]/60 pt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Sections marked “Request access” follow this member’s biodata settings.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {view.sections.map((section) => (
          <SectionCard
            key={section.sectionId}
            section={section}
            ownerUserId={view.accessRequestOwnerUserId}
            onRefresh={() => void refresh()}
          />
        ))}
      </div>
    </div>
  );
}
