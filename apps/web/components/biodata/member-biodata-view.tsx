'use client';

import * as React from 'react';
import Image from 'next/image';
import type {
  BiodataSectionViewerAccess,
  MemberBiodataViewDto,
  MemberBiodataViewSectionDto,
} from '@soulsync/shared-types/biodata-view';
import { WHOLE_BIODATA_BATCH_EXCLUDED_SECTION_IDS } from '@soulsync/shared-types/biodata-visibility';
import { Button } from '@soulsync/ui/button';
import { toast } from 'sonner';
import type { ProfileCompatibilityDto } from '@soulsync/shared-types/compatibility';
import { fetchProfileCompatibility } from '@/lib/compatibility-api';
import { MemberBiodataFamilyBadges } from '@/components/biodata/member-biodata-family-badges';
import {
  MemberBiodataConfirmMarriageSection,
  shouldShowPublicConfirmMarriageSection,
} from '@/components/biodata/member-biodata-confirm-marriage-section';
import { createBiodataAccessRequest, fetchMemberBiodataView } from '@/lib/biodata-view-api';
import { BiodataSectionRead } from '@/components/biodata/biodata-section-read';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { btnPrimaryMd } from '@/lib/ui-classes';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { memberRoutes } from '@/lib/member-routes';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';

const REQUESTABLE_SECTION_ACCESS: BiodataSectionViewerAccess[] = ['locked', 'expired', 'denied'];

function isRequestableSectionAccess(access: BiodataSectionViewerAccess): boolean {
  return REQUESTABLE_SECTION_ACCESS.includes(access);
}

function sectionsNeedingAccessRequest(
  sections: MemberBiodataViewSectionDto[],
): MemberBiodataViewSectionDto[] {
  return sections.filter(
    (section) =>
      section.access !== 'not_applicable' &&
      isRequestableSectionAccess(section.access) &&
      !(WHOLE_BIODATA_BATCH_EXCLUDED_SECTION_IDS as readonly string[]).includes(section.sectionId),
  );
}

function sectionsWithPendingAccess(
  sections: MemberBiodataViewSectionDto[],
): MemberBiodataViewSectionDto[] {
  return sections.filter(
    (section) => section.access !== 'not_applicable' && section.access === 'pending',
  );
}

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

function WholeBiodataAccessCard({
  sections,
  ownerUserId,
  ownerDisplayName,
  onRefresh,
}: {
  sections: MemberBiodataViewSectionDto[];
  ownerUserId: string;
  ownerDisplayName: string;
  onRefresh: () => void;
}) {
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const requestable = sectionsNeedingAccessRequest(sections);
  const pending = sectionsWithPendingAccess(sections);

  if (requestable.length === 0 && pending.length === 0) {
    return null;
  }

  const requestWholeBiodataAccess = async () => {
    if (requestable.length === 0) {
      return;
    }
    setBusy(true);
    const trimmedMessage = message.trim() || undefined;
    try {
      const results = await Promise.allSettled(
        requestable.map((section) =>
          createBiodataAccessRequest({
            ownerUserId,
            sectionId: section.sectionId,
            message: trimmedMessage,
          }),
        ),
      );
      const succeeded = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      if (succeeded > 0) {
        toast.success(
          succeeded === 1
            ? 'Access request sent'
            : `Access requests sent for ${succeeded} sections`,
        );
        onRefresh();
      }
      if (failed > 0 && succeeded === 0) {
        toast.error('Could not send access requests. You may already have pending requests.');
      } else if (failed > 0) {
        toast.message(`${failed} section(s) could not be requested (may already be pending).`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-xl border border-[var(--color-brand-700)]/25 bg-[var(--color-brand-50)]/40 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[var(--color-brand-700)]">
        Request whole biodata access
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Ask {ownerDisplayName} for permission to view all protected sections in one step. Personal
        details stay visible either way.
      </p>
      {pending.length > 0 ? (
        <p className="mt-2 text-sm text-[var(--foreground)]">
          {pending.length} section{pending.length === 1 ? '' : 's'} already pending review.
        </p>
      ) : null}
      {requestable.length > 0 ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Optional message to the member"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            className={btnPrimaryMd}
            disabled={busy}
            onClick={() => void requestWholeBiodataAccess()}
          >
            {busy
              ? 'Sending…'
              : `Request access to ${requestable.length} section${requestable.length === 1 ? '' : 's'}`}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function MemberBiodataView({ initialView, username }: MemberBiodataViewProps) {
  const [view, setView] = React.useState(initialView);
  const [compatibility, setCompatibility] = React.useState<ProfileCompatibilityDto | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const next = await fetchMemberBiodataView(username);
      setView(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh');
    }
  }, [username]);

  React.useEffect(() => {
    let cancelled = false;
    void fetchProfileCompatibility(initialView.owner.id)
      .then((data) => {
        if (!cancelled) {
          setCompatibility(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompatibility(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialView.owner.id]);

  const { owner } = view;
  const showConfirmMarriageSection = shouldShowPublicConfirmMarriageSection(
    view.confirmMarriagePanel,
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {view.confirmedMarriages.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-brand-700)]/30 bg-[var(--color-brand-700)]/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-800)]">
            <Heart className="h-4 w-4 shrink-0" aria-hidden />
            Confirmed marriage
          </div>
          <ul className="mt-3 space-y-2">
            {view.confirmedMarriages.map((entry) => {
              if (!entry.partner) {
                return (
                  <li key={entry.marriageDate} className="text-sm text-[var(--foreground)]">
                    Marriage confirmed on {entry.marriageDate}
                  </li>
                );
              }
              const partnerName =
                formatMemberDisplayName(entry.partner.displayName, entry.partner.username ?? '') ??
                entry.partner.username ??
                'Partner';
              const href = entry.partner.username
                ? memberRoutes.memberBiodata(entry.partner.username)
                : null;
              return (
                <li
                  key={`${entry.marriageDate}-${entry.partner.userId}`}
                  className="text-sm text-[var(--foreground)]"
                >
                  Married{' '}
                  {href ? (
                    <Link
                      href={href}
                      className="font-medium text-[var(--color-brand-700)] hover:underline"
                    >
                      {partnerName}
                    </Link>
                  ) : (
                    <span className="font-medium">{partnerName}</span>
                  )}{' '}
                  on {entry.marriageDate}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

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
          <MemberBiodataFamilyBadges summary={view.familySummary} />
          {compatibility?.eligible && compatibility.overallPercent != null ? (
            <p className="mt-2 inline-flex rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-semibold text-[var(--primary)]">
              {compatibility.overallPercent}% match for you
            </p>
          ) : null}
          <p className="mt-3 border-t border-[var(--border)]/60 pt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Sections marked “Request access” follow this member’s biodata settings.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <WholeBiodataAccessCard
          sections={view.sections}
          ownerUserId={view.accessRequestOwnerUserId}
          ownerDisplayName={owner.displayName}
          onRefresh={() => void refresh()}
        />
        {view.sections.flatMap((section) => {
          const cards: React.ReactNode[] = [
            <SectionCard
              key={section.sectionId}
              section={section}
              ownerUserId={view.accessRequestOwnerUserId}
              onRefresh={() => void refresh()}
            />,
          ];
          if (section.sectionId === 'guardian_contact' && showConfirmMarriageSection) {
            cards.push(
              <MemberBiodataConfirmMarriageSection
                key="confirm-marriage"
                ownerUserId={view.accessRequestOwnerUserId}
                panel={view.confirmMarriagePanel!}
              />,
            );
          }
          return cards;
        })}
      </div>
    </div>
  );
}
