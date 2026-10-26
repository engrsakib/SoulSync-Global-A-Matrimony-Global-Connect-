import Link from 'next/link';
import { buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';

type ThankYouPageProps = {
  searchParams: Promise<{ intent?: string }>;
};

export default async function SubscribeThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams;
  const intent = params.intent;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-16 md:pt-32">
      <div className="max-w-lg space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          You&apos;re on the list
        </h1>
        <p className="leading-relaxed text-[var(--muted-foreground)]">
          We saved your subscription checkout request. Payment processing will be enabled in a
          future release—no charge was made.
        </p>
        {intent ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            Reference: <span className="font-mono">{intent}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/dashboard" className={cn(buttonVariants(), 'rounded-full')}>
            Go to dashboard
          </Link>
          <Link
            href="/subscribe"
            className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}
          >
            View plans
          </Link>
        </div>
      </div>
    </main>
  );
}
