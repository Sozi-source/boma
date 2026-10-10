import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Poppins } from 'next/font/google';
import AppShell from '@/components/app-shell';
import PwaRegister from '@/components/pwa-register';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Openhand — Group contributions, made clear',
  description: 'Bring people together around a shared goal. Collect contributions and keep a clear group record.',
  applicationName: 'Openhand',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Openhand',
  },
  icons: {
    icon: [
      { url: '/assets/icons/favicon.ico' },
      { url: '/assets/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/assets/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/assets/icons/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f8579',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 selection:bg-emerald-500 selection:text-white font-sans">
        <AppShell>{children}</AppShell>
        <PwaRegister />
      </body>
    </html>
  );
}
