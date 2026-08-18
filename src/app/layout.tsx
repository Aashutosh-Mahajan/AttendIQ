import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serifFont = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AttendIQ — Minimalist Attendance & Ledger Tracker',
  description: 'Smart college attendance tracker, automated weekly schedule ledger, and safe skip bunk calculator.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${sansFont.variable} ${serifFont.variable} ${monoFont.variable}`}>
      <body className="bg-paper-950 text-paper-100 antialiased min-h-screen font-sans selection:bg-paper-200/20 selection:text-paper-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
