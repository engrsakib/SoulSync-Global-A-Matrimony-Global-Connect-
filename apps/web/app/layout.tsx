import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SoulSync Global',
  description: 'Privacy-first multi-religious matrimony marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
