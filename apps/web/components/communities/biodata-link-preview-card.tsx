'use client';

import * as React from 'react';
import Image from 'next/image';
import { ExternalLink, FileUser } from 'lucide-react';
import type { MemberBiodataLinkPreviewDto } from '@soulsync/shared-types/biodata-view';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { fetchMemberBiodataLinkPreview } from '@/lib/biodata-view-api';
import { memberRoutes } from '@/lib/member-routes';

const previewCache = new Map<string, MemberBiodataLinkPreviewDto>();
const previewInflight = new Map<string, Promise<MemberBiodataLinkPreviewDto>>();

function loadPreview(username: string): Promise<MemberBiodataLinkPreviewDto> {
  const cached = previewCache.get(username);
  if (cached) {
    return Promise.resolve(cached);
  }
  const inflight = previewInflight.get(username);
  if (inflight) {
    return inflight;
  }
  const promise = fetchMemberBiodataLinkPreview(username)
    .then((data) => {
      previewCache.set(username, data);
      previewInflight.delete(username);
      return data;
    })
    .catch((error: unknown) => {
      previewInflight.delete(username);
      throw error;
    });
  previewInflight.set(username, promise);
  return promise;
}

function openBiodata(username: string) {
  const href = memberRoutes.memberBiodata(username);
  window.open(href, '_blank', 'noopener,noreferrer');
}

export function BiodataLinkPreviewCard({ username }: { username: string }) {
  const normalized = username.trim().toLowerCase();
  const [preview, setPreview] = React.useState<MemberBiodataLinkPreviewDto | null>(
    () => previewCache.get(normalized) ?? null,
  );
  const [loading, setLoading] = React.useState(!preview);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const cached = previewCache.get(normalized);
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

  const canOpen = preview.canView;
  const handleOpen = () => {
    if (canOpen) {
      openBiodata(preview.username);
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
          <p className="text-xs font-medium tracking-wide text-emerald-800/90 uppercase">
            Member biodata
          </p>
          <p className="truncate font-semibold text-[var(--foreground)]">
            {preview.displayName || `@${preview.username}`}
          </p>
          <p className="text-muted-foreground text-sm">@{preview.username}</p>
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
