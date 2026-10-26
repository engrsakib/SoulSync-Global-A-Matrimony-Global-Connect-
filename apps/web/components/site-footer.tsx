import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { memberRoutes } from '@/lib/member-routes';

const FOOTER_SHELL_CLASS =
  'mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:w-[80%] lg:max-w-[80rem] lg:px-6';

const MAIN_MENU_LINKS = [
  { href: '/', label: 'Home' },
  { href: memberRoutes.communities, label: 'Communities' },
  { href: '/#stats', label: 'Stats' },
  { href: '/about', label: 'About' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#contact', label: 'Contact' },
] as const;

const QUICK_LINKS = [
  { label: 'Facebook Page' },
  { label: 'Facebook Group' },
  { label: 'YouTube' },
  { label: 'TikTok' },
] as const;

const USEFUL_LINKS = [
  { label: 'Terms & Conditions', href: '/system/terms' },
  { label: 'Privacy Policy', href: '/system/privacy-policy' },
  { label: 'Safety on SoulSync', href: '/system/safety' },
  { label: 'Return & Refund', href: '/system/return-refund' },
] as const;

function usefulLinkHref(item: (typeof USEFUL_LINKS)[number]): string {
  return item.href;
}

const SOCIAL_ICONS = [
  { label: 'Facebook', Icon: Facebook },
  { label: 'X (Twitter)', Icon: Twitter },
  { label: 'Instagram', Icon: Instagram },
  { label: 'YouTube', Icon: Youtube },
  { label: 'LinkedIn', Icon: Linkedin },
] as const;

function FooterDivider() {
  return <hr className="border-0 border-t border-[var(--color-brand-500)]/40" aria-hidden />;
}

function FooterColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold tracking-wider text-[var(--color-brand-500)] uppercase">
        {children}
      </h3>
      <div className="mt-2 h-0.5 w-10 bg-[var(--color-brand-600)]/70" aria-hidden />
    </div>
  );
}

function FooterLinkList<T extends { label: string; href?: string }>({
  items,
  getHref,
}: {
  items: readonly T[];
  getHref: (item: T) => string;
}) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map((item) => (
        <li key={item.label}>
          <Link
            href={getHref(item)}
            className={cn(
              'text-slate-300 transition-colors hover:text-white',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none',
            )}
            {...(getHref(item) === '#' ? { title: 'Coming soon' } : {})}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StoreBadge({ store }: { store: 'google' | 'apple' }) {
  const label = store === 'google' ? 'Get it on Google Play' : 'Download on the App Store';

  return (
    <Link
      href="#"
      title="Coming soon"
      aria-label={`${label} (coming soon)`}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-md border border-slate-600 bg-black/40 px-4 py-2.5',
        'text-xs leading-tight font-semibold text-white sm:text-sm',
        'transition-colors hover:border-slate-500 hover:bg-black/60',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none',
      )}
    >
      {store === 'google' ? (
        <span className="text-left">
          <span className="block text-[10px] font-normal tracking-wide text-slate-400 uppercase">
            Get it on
          </span>
          Google Play
        </span>
      ) : (
        <span className="text-left">
          <span className="block text-[10px] font-normal text-slate-400">Download on the</span>
          App Store
        </span>
      )}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-brand-600)]/30 bg-slate-950 text-slate-200">
      <div className={cn(FOOTER_SHELL_CLASS, 'space-y-10 py-12 md:py-14')}>
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-700)] bg-clip-text text-transparent">
              SoulSync Global
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
            The right place to find a suitable life partner across faith-aware communities—with
            consent, privacy, and guardian-led next steps built in. We help your search stay
            respectful so marriage can be lasting and fulfilling. Include us in your journey.
          </p>
        </div>

        <FooterDivider />

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <FooterColumnTitle>Contacts</FooterColumnTitle>
            <address className="space-y-2.5 text-sm text-slate-300 not-italic">
              <p>Dhaka, Bangladesh</p>
              <p>
                <a
                  href="mailto:hello@soulsync.global"
                  className="transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:outline-none"
                >
                  hello@soulsync.global
                </a>
              </p>
              <p>
                <a
                  href="https://soulsync.global"
                  className="transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:outline-none"
                  rel="noopener noreferrer"
                >
                  soulsync.global
                </a>
              </p>
            </address>
          </div>

          <div>
            <FooterColumnTitle>Main menu</FooterColumnTitle>
            <ul className="space-y-2.5 text-sm">
              {MAIN_MENU_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterColumnTitle>Quick links</FooterColumnTitle>
            <FooterLinkList items={QUICK_LINKS} getHref={() => '#'} />
          </div>

          <div>
            <FooterColumnTitle>Useful links</FooterColumnTitle>
            <FooterLinkList items={USEFUL_LINKS} getHref={usefulLinkHref} />
          </div>
        </div>

        <FooterDivider />

        <div className="space-y-5 text-center">
          <h3 className="text-sm font-bold tracking-wider text-[var(--color-brand-500)] uppercase">
            Download the SoulSync app
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <StoreBadge store="google" />
            <StoreBadge store="apple" />
          </div>
        </div>

        <FooterDivider />

        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            Copyright © {year} SoulSync Global — All rights reserved
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SOCIAL_ICONS.map(({ label, Icon }) => (
              <Link
                key={label}
                href="#"
                title="Coming soon"
                aria-label={`${label} (coming soon)`}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300',
                  'transition-colors hover:bg-[var(--color-brand-600)] hover:text-white',
                  'focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
