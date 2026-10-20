import * as React from 'react';
import { cn } from '../lib/utils';

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--muted)]',
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({ className, alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={cn('aspect-square h-full w-full object-cover', className)} alt={alt} {...props} />;
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-[var(--muted)] text-sm font-medium',
        className,
      )}
      {...props}
    />
  );
}
