'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '@/components/user-menu';
import { bomaService } from '@/lib/services/boma-service';
import { 
  ShieldCheckIcon,
  UsersIcon, 
  ClockIcon, 
  SmartphoneIcon, 
  CreditCardIcon,
  XMarkIcon,
  PlusIcon,
  HomeIcon,
  BuildingLibraryIcon,
  CheckCircleIcon
} from '@/components/ui/icons';

export default function AdminMobileHeader() {
  const pathname = usePathname();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const requests = await bomaService.getSignupRequests('pending_approval');
        if (isMounted) {
          setPendingApprovals(requests.length);
        }
      } catch {
        // Fallback
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  // Lock scroll when drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: HomeIcon, exact: true },
    { href: '/activity', label: 'Activity & Feed', icon: ClockIcon, exact: false },
    { href: '/bomas', label: 'Funds & Campaigns', icon: BuildingLibraryIcon, exact: true },
    { href: '/admin/users', label: 'Member Directory', icon: UsersIcon, exact: false },
    { href: '/admin/approvals', label: 'Signup Approvals', icon: CheckCircleIcon, exact: false, badge: pendingApprovals > 0 ? `${pendingApprovals}` : null },
    { href: '/admin/ledger', label: 'Central Ledger', icon: CreditCardIcon, exact: false },
    { href: '/admin/subaccounts', label: 'Payout Accounts', icon: SmartphoneIcon, exact: false },
    { href: '/admin', label: 'System Operations', icon: ShieldCheckIcon, exact: true },
    { href: '/bomas/create', label: 'Add New Fund', icon: PlusIcon, exact: false },
  ];

  const currentLabel = navItems.find((item) => 
    item.exact ? pathname === item.href : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
  )?.label || 'Console';

  return (
    <>
      <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6">
          {/* Left: Hamburger + Brand */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label={drawerOpen ? 'Close organizer navigation' : 'Open organizer navigation'}
              onClick={() => setDrawerOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              {drawerOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-2xs">
                <Image
                  src="/assets/icons/openhand.webp"
                  alt="Openhand"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-slate-900 block">Openhand</span>
                <span className="text-[11px] text-slate-500 font-medium block truncate max-w-[120px]">{currentLabel}</span>
              </div>
            </Link>
          </div>

          {/* Right: Exit link + User Profile */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Public Home
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Admin Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Organizer Navigation Menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-white text-slate-700 shadow-2xl border-r border-slate-200 animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200 p-1 flex items-center justify-center">
                  <Image
                    src="/assets/icons/openhand.webp"
                    alt="Openhand"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Clarix Innovators</span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 tabular-nums">
                    <span>ID: 1938784</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-sans font-semibold">Verified</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </p>
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold font-mono text-emerald-800 tabular-nums whitespace-nowrap">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-slate-200 mt-4">
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Public Pages
                </p>
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                >
                  <HomeIcon className="w-4 h-4 text-slate-400" />
                  <span>Public Home</span>
                </Link>
                <Link
                  href="/bomas"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                >
                  <BuildingLibraryIcon className="w-4 h-4 text-slate-400" />
                  <span>Explore Funds</span>
                </Link>
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-slate-800">Live System</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">Paystack M-Pesa</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
