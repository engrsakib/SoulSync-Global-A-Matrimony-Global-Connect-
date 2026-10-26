import { cn } from '@soulsync/ui/lib/utils';

type BokehVariant = 'default' | 'warm' | 'faq';

type PublicBokehBackgroundProps = {
  variant?: BokehVariant;
  className?: string;
};

export function PublicBokehBackground({
  variant = 'default',
  className,
}: PublicBokehBackgroundProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {variant === 'warm' ? (
        <>
          <div className="absolute top-[5%] -left-[10%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-900/20" />
          <div className="absolute right-[-5%] bottom-0 h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-200/45 blur-3xl dark:bg-violet-900/25" />
          <div className="absolute top-[40%] left-[35%] h-48 w-48 rounded-full bg-white/60 blur-2xl dark:bg-white/5" />
        </>
      ) : null}
      {variant === 'faq' || variant === 'default' ? (
        <>
          <div className="absolute top-[8%] -right-[8%] h-[min(360px,50vw)] w-[min(360px,50vw)] rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/20" />
          <div className="absolute bottom-[10%] -left-[6%] h-[min(320px,45vw)] w-[min(320px,45vw)] rounded-full bg-[var(--color-brand-500)]/15 blur-3xl" />
        </>
      ) : null}
    </div>
  );
}
