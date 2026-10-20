import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { AppToaster } from '@/components/app-toaster';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
