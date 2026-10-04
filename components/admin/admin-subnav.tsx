'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bomaService } from '@/lib/services/boma-service';
import { 
  ShieldCheckIcon,
  UsersIcon, 
  ClockIcon, 
  SmartphoneIcon, 
  CreditCardIcon,
  XMarkIcon,
} from '@/components/ui/icons';

export default function AdminSubnav() {
  const pathname = usePathname();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const closeOnBack = () => setMenuOpen(false);
    window.addEventListener('popstate', closeOnBack);
    return () => window.removeEventListener('popstate', closeOnBack);
  }, []);

  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: ShieldCheckIcon,
      exact: true,
    },
    {
      href: '/admin/users',
      label: 'Members',
      icon: UsersIcon,
      exact: false,
    },
    {
      href: '/admin/approvals',
      label: 'Approvals',
      icon: ClockIcon,
      exact: false,
      badge: pendingApprovals > 0 ? `${pendingApprovals}` : null,
    },
    {
      href: '/admin/subaccounts',
      label: 'Accounts',
      icon: SmartphoneIcon,
      exact: false,
    },
    {
      href: '/admin/ledger',
      label: 'Fund activity',
      icon: CreditCardIcon,
      exact: false,
    },
  ];

  return (
    <>
    <div className="lg:hidden sticky top-14 z-20 border-b border-slate-200/90 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur-md">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="mobile-admin-menu"
        aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex min-h-10 w-full items-center justify-between rounded-lg px-2 py-1 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            {menuOpen ? <XMarkIcon className="h-4 w-4" /> : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </span>
          <span>Admin menu</span>
        </span>
        <span className="max-w-[55%] truncate text-xs font-medium text-slate-500">
          {navItems.find((item) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href))?.label || 'Menu'}
        </span>
      </button>

    </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-[1px]"
          />
          <aside
            id="mobile-admin-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col border-r border-slate-200 bg-white shadow-2xl animate-in slide-in-from-left duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
              <div>
                <p className="text-sm font-bold text-slate-900">Admin menu</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Manage your workspace</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close admin menu"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Admin sections" className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`flex min-h-12 items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-slate-900 text-amber-300' : 'border border-amber-300 bg-amber-100 text-amber-900'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 text-[11px] text-slate-500">
              Admin workspace
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
