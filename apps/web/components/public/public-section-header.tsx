import { cn } from '@soulsync/ui/lib/utils';

type PublicSectionHeaderProps = {
  badge: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'center' | 'left';
  titleGradient?: boolean;
};

export function PublicSectionHeader({
  badge,
  title,
  description,
  className,
  align = 'center',
  titleGradient = false,
}: PublicSectionHeaderProps) {
  const centered = align === 'center';

  return (
    <header className={cn('space-y-4', centered && 'text-center', className)}>
      <div className={cn('flex items-center gap-3', centered && 'justify-center')}>
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--color-brand-500)]/50 sm:w-16" />
        <span className="rounded-full border border-[var(--color-brand-500)]/35 bg-[var(--card)]/80 px-4 py-1 text-xs font-semibold tracking-wider text-[var(--color-brand-600)] uppercase backdrop-blur-sm">
          {badge}
        </span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--color-brand-500)]/50 sm:w-16" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
        {titleGradient ? (
          <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] bg-clip-text text-transparent">
            {title}
          </span>
        ) : (
          title
        )}
      </h2>
      {description ? (
        <p
          className={cn(
            'text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg',
            centered ? 'mx-auto max-w-2xl' : 'max-w-xl',
          )}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
