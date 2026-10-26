import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import {
  marketingBrandHairlineClass,
  marketingCardClass,
  marketingFeaturedCardClass,
  marketingIconTileClass,
} from '@/lib/marketing-ui-classes';

export type PublicFeatureCardProps = {
  title: string;
  icon?: LucideIcon;
  featured?: boolean;
  /** Larger title for featured policy-style cards */
  titleSize?: 'default' | 'large';
  badge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PublicFeatureCard({
  title,
  icon: Icon,
  featured = false,
  titleSize = 'default',
  badge,
  footer,
  children,
  className,
}: PublicFeatureCardProps) {
  const shellClass = featured ? marketingFeaturedCardClass : marketingCardClass;

  return (
    <article className={cn(shellClass, className)}>
      {featured ? <div className={marketingBrandHairlineClass} aria-hidden /> : null}
      <div className={cn('flex flex-col p-6', featured && 'pt-5')}>
        <div className="flex flex-row items-start gap-4">
          {Icon ? (
            <div className={marketingIconTileClass}>
              <Icon className="h-6 w-6" aria-hidden />
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  'font-bold leading-snug tracking-tight text-[var(--foreground)]',
                  titleSize === 'large' ? 'text-xl sm:text-2xl' : 'text-lg',
                )}
              >
                {title}
              </h3>
              {badge}
            </div>
          </div>
        </div>
        <div
          className={cn(
            'mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]',
            titleSize === 'large' && 'text-base sm:text-lg',
          )}
        >
          {children}
        </div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </article>
  );
}
