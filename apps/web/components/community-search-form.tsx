'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { formControlClass, formSurfaceClass } from '@/lib/ui-classes';
import type { Tenant } from '@/lib/api';

const LOOKING_FOR = [
  { value: 'bride', label: 'Bride' },
  { value: 'groom', label: 'Groom' },
] as const;

const MARITAL_STATUS = [
  { value: 'never_married', label: 'Never married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
] as const;

const PROFESSIONS = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'business', label: 'Business' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
] as const;

function formatReligion(value: string): string {
  return value.replace(/_/g, ' ');
}

const selectClassName = formControlClass;

type CommunitySearchFormProps = {
  tenants: Tenant[];
};

export function CommunitySearchForm({ tenants }: CommunitySearchFormProps) {
  const router = useRouter();
  const religions = React.useMemo(() => {
    const set = new Set<string>();
    for (const tenant of tenants) {
      for (const religion of tenant.supportedReligions) {
        set.add(religion);
      }
    }
    return [...set].sort();
  }, [tenants]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of data.entries()) {
      if (typeof value === 'string' && value.trim() !== '') {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.push(query ? `/search?${query}` : '/search');
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(formSurfaceClass, 'rounded-xl p-5 md:p-6')}
    >
      {tenants.length === 0 ? (
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Start the API and run migrations to load communities.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="lookingFor">I am looking for</Label>
          <select id="lookingFor" name="lookingFor" className={selectClassName} defaultValue="">
            <option value="">Select</option>
            {LOOKING_FOR.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital status</Label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            className={selectClassName}
            defaultValue=""
          >
            <option value="">Select</option>
            {MARITAL_STATUS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="community">Community</Label>
          <select
            id="community"
            name="community"
            className={selectClassName}
            defaultValue=""
            disabled={tenants.length === 0}
          >
            <option value="">Any</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.slug}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="religion">Faith tradition</Label>
          <select
            id="religion"
            name="religion"
            className={selectClassName}
            defaultValue=""
            disabled={religions.length === 0}
          >
            <option value="">Any</option>
            {religions.map((religion) => (
              <option key={religion} value={religion}>
                {formatReligion(religion)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profession">Profession</Label>
          <select id="profession" name="profession" className={selectClassName} defaultValue="">
            <option value="">Select</option>
            {PROFESSIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className={cn(
          'mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white',
          'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
          'transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        <Search className="h-5 w-5" aria-hidden />
        Search profiles
      </button>
    </form>
  );
}
