import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar";
import MobileNav from "@/components/mobile-nav";
import AdminSidebar from "@/components/admin/admin-sidebar";
import DesktopHeader from "@/components/desktop-header";
import PwaRegister from "@/components/pwa-register";
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
  applicationName: "Boma",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Boma",
  },
  icons: {
    icon: [
      { url: "/assets/icons/favicon.ico" },
      { url: "/assets/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/assets/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/assets/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/assets/icons/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f8579",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body 
        suppressHydrationWarning
        className="min-h-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 selection:bg-emerald-500 selection:text-white font-sans"
      >
        
        {/* Desktop Dark Navy Fintech Sidebar (Persistent on Laptop & Desktop) */}
        <AdminSidebar />

        {/* Workspace Column on Laptop & Desktop */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          
          {/* Mobile Top Navbar (Visible only on < lg) */}
          <div className="lg:hidden">
            <Navbar />
          </div>

          {/* Desktop Top Header (Visible on >= lg) */}
          <div className="hidden lg:block sticky top-0 z-30">
            <DesktopHeader />
          </div>

          {/* Main Page Content */}
          <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 w-full min-w-0">
            {children}
          </main>

          {/* Mobile Bottom Navigation (Visible only on < lg) */}
          <MobileNav />

          {/* Desktop Fintech Status Bar Footer */}
          <footer className="hidden lg:flex border-t border-slate-200 bg-white py-2.5 px-5 sm:px-8 lg:px-10 xl:px-12 items-center justify-between text-[11px] text-slate-500 select-none">
            <span>Boma — Contributions, open and transparent to every member</span>
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                M-Pesa &amp; Card Gateway Live
              </span>
              <span>Merchant ID: 1938784</span>
            </div>
          </footer>
        </div>

        {/* PWA Service Worker & Install Prompt */}
        <PwaRegister />
      </body>
    </html>
  );
}
