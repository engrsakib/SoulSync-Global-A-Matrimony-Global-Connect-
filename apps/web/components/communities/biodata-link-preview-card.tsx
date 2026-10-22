'use client';

import * as React from 'react';
import Image from 'next/image';
import { ExternalLink, FileUser } from 'lucide-react';
import type { MemberBiodataLinkPreviewDto } from '@soulsync/shared-types/biodata-view';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import type { ProfileCompatibilityDto } from '@soulsync/shared-types/compatibility';
import { fetchMemberCompatibilityByUsername } from '@/lib/compatibility-api';
import { fetchMemberBiodataLinkPreview } from '@/lib/biodata-view-api';
import { memberRoutes } from '@/lib/member-routes';

const PREVIEW_CACHE_VERSION = 'v2';

const previewCache = new Map<string, MemberBiodataLinkPreviewDto>();
const previewInflight = new Map<string, Promise<MemberBiodataLinkPreviewDto>>();

function cacheKey(username: string): string {
  return `${PREVIEW_CACHE_VERSION}:${username}`;
}

function loadPreview(username: string): Promise<MemberBiodataLinkPreviewDto> {
  const key = cacheKey(username);
  const cached = previewCache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }
  const inflight = previewInflight.get(key);
  if (inflight) {
    return inflight;
  }
  const promise = fetchMemberBiodataLinkPreview(username)
    .then((data) => {
      previewCache.set(key, data);
      previewInflight.delete(key);
      return data;
    })
    .catch((error: unknown) => {
      previewInflight.delete(key);
      throw error;
    });
  previewInflight.set(key, promise);
  return promise;
}

function openBiodata(username: string) {
  const href = memberRoutes.memberBiodata(username);
  window.open(href, '_blank', 'noopener,noreferrer');
}

export function BiodataLinkPreviewCard({ username }: { username: string }) {
  const normalized = username.trim().toLowerCase();
  const [preview, setPreview] = React.useState<MemberBiodataLinkPreviewDto | null>(
    () => previewCache.get(cacheKey(normalized)) ?? null,
  );
  const [loading, setLoading] = React.useState(!preview);
  const [error, setError] = React.useState<string | null>(null);
  const [compatibility, setCompatibility] = React.useState<ProfileCompatibilityDto | null>(null);

  React.useEffect(() => {
    const cached = previewCache.get(cacheKey(normalized));
    if (cached) {
      return;
    }
    let cancelled = false;
    void loadPreview(normalized)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load biodata preview');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [normalized]);

  React.useEffect(() => {
    if (!preview?.canView) {
      return;
    }
    let cancelled = false;
    void fetchMemberCompatibilityByUsername(normalized)
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
  }, [normalized, preview?.canView]);

  if (loading && !preview) {
    return (
      <div
        className="mt-3 animate-pulse rounded-xl border border-[var(--border)]/80 bg-gradient-to-br from-emerald-50/50 to-[var(--muted)]/30 p-4"
        aria-hidden
      >
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-full bg-[var(--muted)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-[var(--muted)]" />
            <div className="h-3 w-48 rounded bg-[var(--muted)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="mt-3 rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4 text-sm text-[var(--muted-foreground)]">
        Biodata preview unavailable.
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const linkUsername = (preview.username?.trim() || normalized).toLowerCase();
  const displayName = preview.displayName?.trim() || `@${linkUsername}`;
  const canOpen = Boolean(linkUsername);
  const visibleCompatibility =
    preview.canView && compatibility?.eligible && compatibility.overallPercent != null
      ? compatibility
      : null;
  const handleOpen = () => {
    if (canOpen) {
      openBiodata(linkUsername);
    }
  };

  return (
    <div
      className={cn(
        'mt-3 overflow-hidden rounded-xl border border-emerald-200/70',
        'bg-gradient-to-br from-emerald-50/80 via-[var(--card)] to-[var(--muted)]/20',
        canOpen && 'cursor-pointer transition-shadow hover:shadow-md',
      )}
      role={canOpen ? 'link' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onClick={canOpen ? handleOpen : undefined}
      onKeyDown={
        canOpen
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpen();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3 p-4">
        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-white/80">
          {preview.avatarUrl ? (
            <Image
              src={preview.avatarUrl}
              alt=""
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-emerald-100/80 text-emerald-900">
              <FileUser className="h-5 w-5" aria-hidden />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium tracking-wide text-emerald-800/90 uppercase">
              Member biodata
            </p>
            {visibleCompatibility ? (
              <span className="rounded-full bg-emerald-700/10 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                {visibleCompatibility.overallPercent}% match
              </span>
            ) : null}
          </div>
          <p className="truncate font-semibold text-[var(--foreground)]">{displayName}</p>
          <p className="text-muted-foreground text-sm">@{linkUsername}</p>
          {preview.bioPreview ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--foreground)]/90">
              {preview.bioPreview}
            </p>
          ) : null}
          {!canOpen && preview.restrictionMessage ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {preview.restrictionMessage}
            </p>
          ) : null}
        </div>
      </div>
      {canOpen ? (
        <div className="border-t border-emerald-200/50 bg-white/40 px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center gap-1.5 text-emerald-900 hover:bg-emerald-100/50"
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
          >
            View biodata
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
