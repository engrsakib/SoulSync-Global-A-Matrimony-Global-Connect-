'use client';

import Link from 'next/link';
import { Lock, Pencil, Settings2, ShieldCheck, Eye, type LucideIcon } from 'lucide-react';
import type { BiodataManagedProfileSummaryDto } from '@soulsync/shared-types/biodata-editor-grant';
import {
  scopeAllowsContent,
  scopeAllowsSettings,
} from '@soulsync/shared-types/biodata-editor-grant';
import { ManagedBiodataEditingBanner } from '@/components/dashboard/managed-biodata-editing-banner';
import { BiodataEditorScopeBadge } from '@/components/dashboard/biodata-editor-scope-badge';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { useManagedBiodata } from '@/lib/managed-biodata-context';
import { cn } from '@soulsync/ui/lib/utils';

type ManagedProfileHubProps = {
  summary: BiodataManagedProfileSummaryDto;
  username: string;
};

function HubCard({
  title,
  description,
  href,
  enabled,
  icon: Icon,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  enabled: boolean;
  icon: LucideIcon;
  badge?: string;
}) {
  const inner = (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-colors',
        enabled
          ? 'border-[var(--border)]/80 bg-[var(--background)] hover:border-[var(--color-brand-300)]'
          : 'border-[var(--border)]/50 bg-[var(--muted)]/20 opacity-90',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
          {enabled ? (
            <Icon className="h-5 w-5" aria-hidden />
          ) : (
            <Lock className="h-5 w-5" aria-hidden />
          )}
        </div>
        {badge ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-900">
            {badge}
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="text-muted-foreground mt-1 flex-1 text-sm">{description}</p>
      {!enabled ? (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          The owner only granted access to other areas.
        </p>
      ) : (
        <span className="mt-4 text-sm font-semibold text-[var(--color-brand-700)]">Open →</span>
      )}
    </div>
  );

  if (!enabled) {
    return inner;
  }

  return (
    <Link
      href={href}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
    >
      {inner}
    </Link>
  );
}

export function ManagedProfileHub({ summary, username }: ManagedProfileHubProps) {
  const managed = useManagedBiodata();
  const ownerDisplayName = managed?.ownerDisplayName ?? summary.displayName ?? username;
  const canContent = scopeAllowsContent(summary.scope);
  const canSettings = scopeAllowsSettings(summary.scope);
  const pendingView = summary.pendingViewAccessCount ?? 0;

  return (
    <div className="space-y-6">
      <ManagedBiodataEditingBanner
        ownerDisplayName={ownerDisplayName}
        scope={summary.scope}
        canEditContent={canContent}
        canEditSettings={canSettings}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {ownerDisplayName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Completeness{' '}
            <span className="font-semibold text-[var(--color-brand-700)]">
              {summary.completenessPercent}%
            </span>
            {summary.profileUpdatedAt ? (
              <>
                {' '}
                · Updated{' '}
                {new Date(summary.profileUpdatedAt).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
              </>
            ) : null}
          </p>
        </div>
        <BiodataEditorScopeBadge scope={summary.scope} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubCard
          title="Edit biodata"
          description="Sections, gallery, and profile details"
          href={dashboardRoutes.biodataManagedUserEdit(username)}
          enabled={canContent}
          icon={Pencil}
        />
        <HubCard
          title="Settings & listing"
          description="Discovery, section visibility, and privacy"
          href={dashboardRoutes.biodataManagedUserSettings(username)}
          enabled={canSettings}
          icon={Settings2}
        />
        <HubCard
          title="View access requests"
          description="Approve who can see protected sections"
          href={dashboardRoutes.biodataManagedUserPermissions(username)}
          enabled={canSettings}
          icon={ShieldCheck}
          badge={pendingView > 0 ? `${pendingView} pending` : undefined}
        />
      </div>

      {summary.username ? (
        <Link
          href={`/biodata/${encodeURIComponent(summary.username)}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand-700)] hover:underline"
        >
          <Eye className="h-4 w-4" aria-hidden />
          Preview biodata as members see it
        </Link>
      ) : null}
    </div>
  );
}
