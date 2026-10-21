import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';

export const metadata: Metadata = {
  title: 'Page not found | SoulSync Global',
};

const SECTION_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23c4b5fd' stroke-opacity='0.12' stroke-width='1'%3E%3Cpath d='M40 8c6 12 14 20 26 26-12 6-20 14-26 26-6-12-14-20-26-26 12-6 20-14 26-26z'/%3E%3C/g%3E%3C/svg%3E\")";

export default function NotFound() {
  return (
    <main
      className="flex min-h-[55vh] flex-col items-center justify-center bg-[var(--muted)]/30 py-16 md:min-h-[60vh] md:py-20"
      style={{ backgroundImage: SECTION_PATTERN }}
    >
      <div className="mx-auto w-full max-w-none px-4 text-center sm:px-6 lg:w-[80%] lg:max-w-[80rem] lg:px-6">
        <p
          className="text-[clamp(4.5rem,18vw,9rem)] leading-none font-bold tracking-tighter"
          aria-hidden
        >
          <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] bg-clip-text text-transparent">
            404
          </span>
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          The link may be broken, or the page may have been moved. Let&apos;s get you back to
          discovering communities on SoulSync.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/" className={cn(buttonVariants({ size: 'lg' }), 'min-w-[11rem]')}>
            Back to home
          </Link>
          <Link
            href="/#communities"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-w-[11rem]')}
          >
            Browse communities
          </Link>
        </div>
      </div>
    </main>
  );
}
