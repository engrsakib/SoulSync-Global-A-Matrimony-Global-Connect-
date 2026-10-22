'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import {
  scopeAllowsContent,
  scopeAllowsSettings,
  type BiodataEditorScope,
} from '@soulsync/shared-types/biodata-editor-grant';
import { dashboardRoutes } from '@/lib/dashboard-routes';

type ManagedBiodataEditingBannerProps = {
  ownerDisplayName: string;
  scope?: BiodataEditorScope;
  canEditContent?: boolean;
  canEditSettings?: boolean;
};

export function ManagedBiodataEditingBanner({
  ownerDisplayName,
  scope,
  canEditContent,
  canEditSettings,
}: ManagedBiodataEditingBannerProps) {
  const content = canEditContent ?? (scope ? scopeAllowsContent(scope) : true);
  const settings = canEditSettings ?? (scope ? scopeAllowsSettings(scope) : true);

  return (
    <div className="rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)]/80 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-700)]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Managing {ownerDisplayName}&apos;s biodata
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Changes save to their account. Your access is limited to what they granted.
            </p>
            {scope ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {content ? (
                  <li className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-[var(--color-brand-800)]">
                    Biodata sections
                  </li>
                ) : null}
                {settings ? (
                  <li className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-[var(--color-brand-800)]">
                    Privacy & approvals
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>
        <Link
          href={dashboardRoutes.biodataManaged}
          className="text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
        >
          Back to biodata I manage
        </Link>
      </div>
    </div>
  );
}
