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
  title: "Boma — Contributions, transparent to every member",
  description: "Collect and track contributions for family, events and needs. Every member sees every shilling.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
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
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 selection:bg-emerald-500 selection:text-white font-sans">
        <Navbar />
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">{children}</main>
        <MobileNav />

        {/* Desktop App Status Bar */}
        <footer className="hidden md:flex border-t border-neutral-200 bg-white py-2 px-6 items-center justify-between text-[11px] text-neutral-500">
          <span>Boma — Contributions, open to every member</span>
          <span>Pay with M-Pesa or card</span>
        </footer>
      </body>
    </html>
  );
}
