import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar";
import MobileNav from "@/components/mobile-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boma Pay — Transparent Cause & Community Banking",
  description: "A seamless way to contribute toward a common cause with confidence, verified double-entry ledgers, and absolute financial transparency.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 selection:bg-emerald-500 selection:text-white font-sans">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-6">{children}</main>
        <MobileNav />

        {/* Desktop App Status Bar */}
        <footer className="hidden md:flex border-t border-neutral-200/60 bg-white/50 dark:border-neutral-800/60 dark:bg-neutral-950/50 backdrop-blur-xs py-1.5 px-6 items-center justify-between text-[10px] text-neutral-400 font-mono transition-colors">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Segregated Escrow Active</span>
            <span>•</span>
            <span>Paystack Rails Live</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Double-Entry Reconciled</span>
            <span>•</span>
            <span>v3.0.4</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
