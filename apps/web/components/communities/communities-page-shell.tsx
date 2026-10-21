import type { ReactNode } from 'react';

type CommunitiesPageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function CommunitiesPageShell({ title, subtitle, children }: CommunitiesPageShellProps) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--muted)]/30 pt-20 pb-14">
      <div className="mx-auto w-full max-w-[80rem] space-y-6 px-4 sm:px-6 lg:w-[80%]">
        {title || subtitle ? (
          <div className="space-y-2">
            {title ? (
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            ) : null}
            {subtitle ? (
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  );
}
