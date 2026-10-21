import type { ReactNode } from 'react';

const SECTION_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23c4b5fd' stroke-opacity='0.12' stroke-width='1'%3E%3Cpath d='M40 8c6 12 14 20 26 26-12 6-20 14-26 26-6-12-14-20-26-26 12-6 20-14 26-26z'/%3E%3C/g%3E%3C/svg%3E\")";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <main
      className="min-h-[70vh] bg-[var(--muted)]/30 pt-28 pb-12 md:pt-32 md:pb-16"
      style={{ backgroundImage: SECTION_PATTERN }}
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-blue-600 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {subtitle}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm md:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
