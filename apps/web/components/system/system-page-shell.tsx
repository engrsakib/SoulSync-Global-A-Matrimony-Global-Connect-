import type { SystemPageDto } from '@soulsync/shared-types';
import { SystemMarkdown } from './system-markdown';
import { SystemPageNav } from './system-page-nav';
import { SystemSidebarPanel } from './system-sidebar-panel';

type SystemPageShellProps = {
  page: SystemPageDto;
};

function formatUpdatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SystemPageShell({ page }: SystemPageShellProps) {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold tracking-wider text-[var(--color-brand-500)] uppercase">
          Legal &amp; trust
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {page.title}
        </h1>
        <p className="text-sm text-slate-400">Last updated {formatUpdatedAt(page.updatedAt)}</p>
      </header>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-10">
        <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)]/40 p-6 sm:p-8">
          <SystemMarkdown markdown={page.markdown} />
        </div>
        <SystemSidebarPanel cards={page.sidebar} className="lg:sticky lg:top-24" />
      </div>

      <SystemPageNav prevSlug={page.prevSlug} nextSlug={page.nextSlug} />
    </article>
  );
}
