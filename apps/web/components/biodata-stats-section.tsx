import { BarChart3, Users } from 'lucide-react';
import { Badge } from '@soulsync/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@soulsync/ui/card';
import { cn } from '@soulsync/ui/lib/utils';
import type { PlatformBiodataStats, ReligionBiodataBreakdown } from '@/lib/platform-stats';

function formatReligion(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function rowTotal(row: ReligionBiodataBreakdown): number {
  return row.male + row.female;
}

function genderSplitPercent(male: number, female: number): { malePct: number; femalePct: number } {
  const total = male + female;
  if (total === 0) return { malePct: 50, femalePct: 50 };
  return {
    malePct: Math.round((male / total) * 100),
    femalePct: Math.round((female / total) * 100),
  };
}

function GenderMixBar({
  male,
  female,
  className,
}: {
  male: number;
  female: number;
  className?: string;
}) {
  const { malePct, femalePct } = genderSplitPercent(male, female);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-[var(--muted)]"
        role="img"
        aria-label={`Gender mix: ${malePct}% men, ${femalePct}% women`}
      >
        <div
          className="h-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)]"
          style={{ width: `${malePct}%` }}
        />
        <div
          className="h-full bg-violet-300/90 dark:bg-violet-400/70"
          style={{ width: `${femalePct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
        <span>Men {malePct}%</span>
        <span>Women {femalePct}%</span>
      </div>
    </div>
  );
}

function GenderLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-6 rounded-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)]"
          aria-hidden
        />
        Men
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-6 rounded-full bg-violet-300/90 dark:bg-violet-400/70"
          aria-hidden
        />
        Women
      </span>
    </div>
  );
}

type FaithTraditionBreakdownProps = {
  rows: ReligionBiodataBreakdown[];
  platformTotal: number;
};

function FaithTraditionBreakdown({ rows, platformTotal }: FaithTraditionBreakdownProps) {
  const sortedRows = [...rows].sort((a, b) => rowTotal(b) - rowTotal(a));

  const totals = sortedRows.reduce(
    (acc, row) => ({
      male: acc.male + row.male,
      female: acc.female + row.female,
    }),
    { male: 0, female: 0 },
  );
  const listedTotal = totals.male + totals.female;

  return (
    <Card className="overflow-hidden border-[var(--border)] bg-[var(--background)] shadow-sm">
      <CardHeader className="gap-4 border-b border-[var(--border)] bg-gradient-to-br from-[var(--muted)]/40 to-transparent pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] text-white shadow-sm"
            aria-hidden
          >
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight md:text-xl">
              By faith tradition
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              How discoverable profiles are distributed across traditions, with gender balance at a
              glance.
            </CardDescription>
          </div>
        </div>
        <GenderLegend />
      </CardHeader>

      <CardContent className="p-0">
        {/* Mobile: card list */}
        <ul className="divide-y divide-[var(--border)] md:hidden">
          {sortedRows.map((row) => {
            const total = rowTotal(row);
            const shareOfPlatform =
              platformTotal > 0 ? Math.round((total / platformTotal) * 100) : 0;

            return (
              <li key={row.religion} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="leading-snug font-semibold">{formatReligion(row.religion)}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {formatCount(total)} profiles
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {shareOfPlatform}% of total
                  </Badge>
                </div>
                <GenderMixBar male={row.male} female={row.female} />
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-2 py-2.5">
                    <dt className="text-[10px] font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                      Men
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold tabular-nums">
                      {formatCount(row.male)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-2 py-2.5">
                    <dt className="text-[10px] font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                      Women
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold tabular-nums">
                      {formatCount(row.female)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2.5">
                    <dt className="text-[10px] font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                      Total
                    </dt>
                    <dd className="mt-0.5 text-base font-bold tabular-nums">
                      {formatCount(total)}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>

        {/* Desktop: data table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">
              Biodata counts by faith tradition, showing men, women, and gender mix
            </caption>
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/25 text-left text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                <th scope="col" className="px-6 py-3.5 font-medium">
                  Tradition
                </th>
                <th scope="col" className="min-w-[12rem] px-4 py-3.5 font-medium">
                  Gender mix
                </th>
                <th scope="col" className="px-4 py-3.5 text-right font-medium">
                  Men
                </th>
                <th scope="col" className="px-4 py-3.5 text-right font-medium">
                  Women
                </th>
                <th scope="col" className="px-6 py-3.5 text-right font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const total = rowTotal(row);
                const shareOfPlatform =
                  platformTotal > 0 ? Math.round((total / platformTotal) * 100) : 0;

                return (
                  <tr
                    key={row.religion}
                    className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--muted)]/20"
                  >
                    <td className="px-6 py-4 align-middle">
                      <p className="font-semibold text-[var(--foreground)]">
                        {formatReligion(row.religion)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {shareOfPlatform}% of platform · {formatCount(total)} profiles
                      </p>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <GenderMixBar male={row.male} female={row.female} className="max-w-xs" />
                    </td>
                    <td className="px-4 py-4 text-right align-middle font-medium tabular-nums">
                      {formatCount(row.male)}
                    </td>
                    <td className="px-4 py-4 text-right align-middle font-medium tabular-nums">
                      {formatCount(row.female)}
                    </td>
                    <td className="px-6 py-4 text-right align-middle font-semibold tabular-nums">
                      {formatCount(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--border)] bg-[var(--muted)]/30 font-semibold">
                <td className="px-6 py-4 text-[var(--foreground)]" colSpan={2}>
                  All listed traditions
                </td>
                <td className="px-4 py-4 text-right tabular-nums">{formatCount(totals.male)}</td>
                <td className="px-4 py-4 text-right tabular-nums">{formatCount(totals.female)}</td>
                <td className="px-6 py-4 text-right tabular-nums">{formatCount(listedTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile footer total */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--muted)]/25 px-5 py-4 md:hidden">
          <span className="text-sm font-semibold">All listed traditions</span>
          <span className="text-sm font-bold tabular-nums">
            {formatCount(listedTotal)} profiles
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

type SummaryStatCardProps = {
  label: string;
  value: number;
  hint: string;
};

function SummaryStatCard({ label, value, hint }: SummaryStatCardProps) {
  return (
    <Card className="border-[var(--border)] bg-[var(--background)] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
          {label}
        </CardTitle>
        <Users className="h-4 w-4 text-[var(--muted-foreground)]/70" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{formatCount(value)}</p>
        <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">{hint}</p>
      </CardContent>
    </Card>
  );
}

type BiodataStatsSectionProps = {
  stats: PlatformBiodataStats;
};

export function BiodataStatsSection({ stats }: BiodataStatsSectionProps) {
  const maleShare = stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0;
  const femaleShare = stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0;

  return (
    <section
      id="stats"
      className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--muted)]/40 py-14"
    >
      <div className="mx-auto w-full max-w-[80rem] space-y-8 px-4 sm:px-6 lg:w-[80%]">
        <div className="space-y-3 text-center md:text-left">
          <p className="text-sm font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
            Platform insights
          </p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] bg-clip-text text-transparent">
              Platform biodata overview
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] md:mx-0 md:text-base">
            Community-wide discoverable profiles across faith traditions. Figures below are
            illustrative until live stats are connected.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryStatCard
            label="Total biodata"
            value={stats.total}
            hint="Active discoverable listings"
          />
          <SummaryStatCard label="Men" value={stats.male} hint={`${maleShare}% of total`} />
          <SummaryStatCard label="Women" value={stats.female} hint={`${femaleShare}% of total`} />
        </div>

        <FaithTraditionBreakdown rows={stats.byReligion} platformTotal={stats.total} />
      </div>
    </section>
  );
}
