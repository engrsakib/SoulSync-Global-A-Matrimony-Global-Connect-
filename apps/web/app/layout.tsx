import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { AppToaster } from '@/components/app-toaster';
import { ThemeHydrator } from '@/components/theme/theme-hydrator';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ThemeScript } from '@/components/theme/theme-script';
import { getServerThemeState } from '@/lib/theme/server';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SoulSync Global',
  description: 'Privacy-first multi-religious matrimony marketplace',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const themeState = await getServerThemeState();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={themeState.resolvedTheme}
      data-theme-preference={themeState.preference}
    >
      <body className={montserrat.className}>
        <ThemeScript />
        <ThemeProvider
          initialPreference={themeState.preference}
          initialResolvedTheme={themeState.resolvedTheme}
        >
          <ThemeHydrator needsCookieBackfill={themeState.needsCookieBackfill} />
          <AppToaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
