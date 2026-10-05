'use client';

import React, { useState, useEffect } from 'react';
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
  BuildingLibraryIcon
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
    { href: '/admin', label: 'Dashboard', icon: ShieldCheckIcon, exact: true },
    { href: '/admin/users', label: 'User Directory', icon: UsersIcon, exact: false },
    { href: '/admin/approvals', label: 'Signup Approvals', icon: ClockIcon, exact: false, badge: pendingApprovals > 0 ? `${pendingApprovals}` : null },
    { href: '/admin/subaccounts', label: 'Subaccounts & Banks', icon: SmartphoneIcon, exact: false },
    { href: '/admin/ledger', label: 'Central Ledger', icon: CreditCardIcon, exact: false },
    { href: '/bomas/create', label: 'Start New Fund', icon: PlusIcon, exact: false },
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
              aria-label={drawerOpen ? 'Close admin navigation' : 'Open admin navigation'}
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

            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A4F43] text-amber-300 font-mono text-sm font-bold shadow-2xs">
                B
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-slate-900 block">Boma Admin</span>
                <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[110px]">{currentLabel}</span>
              </div>
            </Link>
          </div>

          {/* Right: Exit link + User Profile */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Exit
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Admin Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Admin Navigation Menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-[#0A4F43] text-teal-50 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-teal-700/50 bg-teal-900/30">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-400 text-slate-950 font-mono font-bold flex items-center justify-center text-sm shadow-xs">
                  B
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Admin Console</span>
                  <span className="text-[10px] font-mono text-teal-300">ID: 1938784</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-teal-200 hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Administration
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
                        ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                        : 'text-teal-100 hover:bg-white/10 hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-teal-200'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold font-mono text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-teal-700/40 mt-4">
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Public Workspace
                </p>
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-teal-100 hover:bg-white/10 hover:text-white font-medium"
                >
                  <HomeIcon className="w-4 h-4 text-teal-200" />
                  <span>Public Home</span>
                </Link>
                <Link
                  href="/bomas"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-teal-100 hover:bg-white/10 hover:text-white font-medium"
                >
                  <BuildingLibraryIcon className="w-4 h-4 text-teal-200" />
                  <span>Public Funds</span>
                </Link>
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-teal-700/50 bg-teal-950/40 text-[11px] text-teal-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live System
              </span>
              <span className="font-mono text-[10px]">v1.2</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
