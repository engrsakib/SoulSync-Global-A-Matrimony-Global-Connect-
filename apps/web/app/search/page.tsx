import Link from 'next/link';
import { Badge } from '@soulsync/ui/badge';

const FILTER_LABELS: Record<string, string> = {
  lookingFor: 'Looking for',
  maritalStatus: 'Marital status',
  community: 'Community',
  religion: 'Faith tradition',
  profession: 'Profession',
};

function formatValue(key: string, value: string): string {
  if (key === 'lookingFor') {
    return value === 'bride' ? 'Bride' : value === 'groom' ? 'Groom' : value;
  }
  if (key === 'maritalStatus') {
    return value.replace(/_/g, ' ');
  }
  if (key === 'religion') {
    return value.replace(/_/g, ' ');
  }
  if (key === 'profession') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value;
}

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const filters = Object.entries(params).filter(
    ([key, value]) => key in FILTER_LABELS && typeof value === 'string' && value.length > 0,
  ) as [string, string][];

  return (
    <main className="mx-auto min-h-[60vh] w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        Full biodata search is not implemented yet. Your filters are saved in the URL for when
        results go live.
      </p>

      {filters.length > 0 ? (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Your filters</h2>
          <ul className="flex flex-wrap gap-2">
            {filters.map(([key, value]) => (
              <li key={key}>
                <Badge variant="outline" className="gap-1 px-3 py-1.5 text-sm">
                  <span className="text-[var(--muted-foreground)]">{FILTER_LABELS[key]}:</span>
                  <span className="font-medium">{formatValue(key, value)}</span>
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          No filters selected. Go back and choose criteria to preview the search flow.
        </p>
      )}

      <Link
        href="/#communities"
        className="mt-10 inline-flex text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
      >
        Back to communities
      </Link>
    </main>
  );
}
