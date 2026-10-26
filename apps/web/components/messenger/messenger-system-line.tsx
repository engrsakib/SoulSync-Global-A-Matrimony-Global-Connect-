import type { ReactNode } from 'react';
import { cn } from '@soulsync/ui/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
};

export function MessengerSystemLine({ children, className }: Props) {
  return (
    <div className={cn('flex justify-center px-2 py-1', className)}>
      <p className="max-w-md text-center text-[11px] leading-snug text-slate-500">{children}</p>
    </div>
  );
}
