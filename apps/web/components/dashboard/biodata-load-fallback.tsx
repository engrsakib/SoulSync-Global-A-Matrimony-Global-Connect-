'use client';

import * as React from 'react';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { cn } from '@soulsync/ui/lib/utils';
import { BiodataBuilder } from '@/components/dashboard/biodata-builder';
import { fetchMyBiodata } from '@/lib/biodata-api';
import { btnPrimaryMd, dashboardPageTitle } from '@/lib/ui-classes';

export function BiodataLoadFallback() {
  const [data, setData] = React.useState<BiodataMeDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const runFetch = React.useCallback(() => {
    return fetchMyBiodata()
      .then((biodata) => {
        setData(biodata);
        setError(null);
      })
      .catch((err: unknown) => {
        setData(null);
        setError(err instanceof Error ? err.message : 'Could not load biodata');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const retry = () => {
    setLoading(true);
    void runFetch();
  };

  if (data) {
    return <BiodataBuilder initialBiodata={data} />;
  }

  return (
    <div className="space-y-4">
      <h1 className={dashboardPageTitle}>Biodata</h1>
      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading your biodata…</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
          <p className="text-sm text-[var(--foreground)]">
            {error ?? 'Your biodata could not be loaded.'}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Check that the API is running and try again. You stay signed in on this page.
          </p>
          <button type="button" className={cn(btnPrimaryMd, 'mt-4')} onClick={retry}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
