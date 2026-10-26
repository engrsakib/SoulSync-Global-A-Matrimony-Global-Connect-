import type { ReactNode } from 'react';
import { cn } from '@soulsync/ui/lib/utils';

type PublicSectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  borderTop?: boolean;
  background?: ReactNode;
};

export function PublicSectionShell({
  id,
  children,
  className,
  innerClassName,
  borderTop = false,
  background,
}: PublicSectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative scroll-mt-20 overflow-hidden bg-[var(--background)] py-12 md:py-16',
        borderTop && 'border-t border-[var(--border)]',
        className,
      )}
    >
      {background}
      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:w-[80%]',
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
