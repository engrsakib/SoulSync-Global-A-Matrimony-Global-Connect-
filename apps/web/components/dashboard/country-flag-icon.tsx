'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { countryFlagUrl } from '@/lib/country-flag-url';

export function CountryFlagIcon({
  iso2,
  emojiFallback,
  className,
}: {
  iso2: string;
  emojiFallback?: string;
  className?: string;
}) {
  const [useEmoji, setUseEmoji] = React.useState(false);

  if (useEmoji && emojiFallback) {
    return (
      <span
        className={cn('flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none', className)}
        aria-hidden
      >
        {emojiFallback}
      </span>
    );
  }

  return (
    // flagcdn PNG; next/image would require remotePatterns for a third-party CDN
    // eslint-disable-next-line @next/next/no-img-element -- external flag CDN, small decorative asset
    <img
      src={countryFlagUrl(iso2, 40)}
      alt=""
      aria-hidden
      width={20}
      height={20}
      className={cn(
        'h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-[var(--border)]/60',
        className,
      )}
      onError={() => setUseEmoji(true)}
    />
  );
}
