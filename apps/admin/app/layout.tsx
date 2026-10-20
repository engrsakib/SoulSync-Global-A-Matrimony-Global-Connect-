import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@soulsync/ui/badge';
import './globals.css';

export const metadata: Metadata = {
  title: 'SoulSync Admin',
  description: 'SoulSync Global backoffice administration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <aside className="hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] p-6 md:flex">
            <div className="mb-8">
              <p className="text-lg font-semibold">SoulSync Admin</p>
              <Badge variant="secondary" className="mt-2">
                Backoffice
              </Badge>
            </div>
            <nav className="flex flex-col gap-2 text-sm">
              <Link className="rounded-[var(--radius)] px-3 py-2 hover:bg-[var(--muted)]" href="/">
                Dashboard
              </Link>
              <Link className="rounded-[var(--radius)] px-3 py-2 hover:bg-[var(--muted)]" href="/tenants">
                Tenants
              </Link>
            </nav>
          </aside>
          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <p className="font-medium">Administration</p>
              <Badge variant="outline">Multi-tenant</Badge>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
