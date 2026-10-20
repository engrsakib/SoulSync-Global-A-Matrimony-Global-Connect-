'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#communities', label: 'Communities' },
  { href: '/#stats', label: 'Stats' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
] as const;

const SCROLL_SOLID_THRESHOLD = 24;

/** Matches communities / stats section width: full on mobile & tablet, 80% from lg up. */
const HEADER_SHELL_CLASS =
  'mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:w-[80%]';

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isHome = pathname === '/';
  const overHero = isHome && !scrolled;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_SOLID_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const linkClass = (href: string) => {
    const active = href === '/' && pathname === '/';
    return cn(
      'text-sm font-medium transition-colors',
      overHero
        ? active
          ? 'text-[var(--color-brand-100)]'
          : 'text-white/90 hover:text-white'
        : active
          ? 'text-[var(--primary)]'
          : 'text-[var(--foreground)] hover:text-[var(--primary)]',
    );
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        overHero
          ? 'border-transparent bg-transparent'
          : 'border-b border-[var(--border)] bg-[var(--background)]/95 shadow-sm backdrop-blur-md',
      )}
    >
      <div className={cn('flex h-16 items-center justify-between gap-4', HEADER_SHELL_CLASS)}>
        <Link href="/" className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
              overHero
                ? 'bg-white/15 text-white ring-1 ring-white/30'
                : 'bg-[var(--primary)] text-[var(--primary-foreground)]',
            )}
          >
            S
          </span>
          <span
            className={cn(
              'text-sm font-semibold tracking-tight md:text-base',
              overHero ? 'text-white' : 'text-[var(--foreground)]',
            )}
          >
            SoulSync Global
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/#communities"
            className={cn(
              buttonVariants({ variant: overHero ? 'outline' : 'default', size: 'sm' }),
              overHero && 'border-white/40 bg-transparent text-white hover:bg-white/10',
            )}
          >
            Explore
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              overHero && 'text-white hover:bg-white/10 hover:text-white',
            )}
          >
            Log In
          </Link>
        </div>

        <button
          type="button"
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius)] md:hidden',
            overHero ? 'text-white hover:bg-white/10' : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
          )}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav"
          className={cn(
            'border-t md:hidden',
            overHero
              ? 'border-white/15 bg-black/80 backdrop-blur-md'
              : 'border-[var(--border)] bg-[var(--background)]',
          )}
        >
          <nav className={cn('flex flex-col py-4', HEADER_SHELL_CLASS)} aria-label="Mobile">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-[var(--radius)] px-3 py-3 text-base font-medium',
                  overHero
                    ? 'text-white hover:bg-white/10'
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                )}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div
              className={cn(
                'mt-2 flex flex-col gap-2 border-t pt-4',
                overHero ? 'border-white/10' : 'border-[var(--border)]',
              )}
            >
              <Link
                href="/#communities"
                className={buttonVariants({ size: 'lg' })}
                onClick={() => setMenuOpen(false)}
              >
                Explore
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  overHero && 'border-white/30 bg-transparent text-white hover:bg-white/10',
                )}
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ size: 'lg' })}
                onClick={() => setMenuOpen(false)}
              >
                Log In
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
