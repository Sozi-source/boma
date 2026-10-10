'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './user-menu';

export default function Navbar({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();

  const navLinks = authenticated ? [
    { href: '/dashboard', label: 'Overview' },
    { href: '/bomas', label: 'Group funds' },
    { href: '/activity', label: 'Activity' },
  ] : [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/bomas', label: 'Explore goals' },
    { href: '/#trust', label: 'Why Boma' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
        
        {/* Logo & App Status */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm transition-colors group-hover:bg-emerald-800">
              <span className="font-mono text-sm font-semibold tracking-tight">B</span>
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-slate-900">BomaPay</span>
              <span className="hidden text-[10px] text-slate-500 sm:block">Together, with clarity</span>
            </div>
          </Link>

          {/* Desktop App Nav Items (Pill Style) */}
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => {
              const basePath = link.href.split('#')[0];
              const isActive = basePath === '/' ? pathname === '/' : pathname === basePath || pathname.startsWith(`${basePath}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-emerald-800'
                      : 'text-slate-600 hover:text-emerald-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Fintech Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!authenticated && <Link href="/auth/login" className="inline-flex min-h-10 items-center rounded-lg px-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm">Sign in</Link>}
          {!authenticated && <Link href="/auth/signup?role=organizer" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-2.5 text-[11px] font-semibold text-white transition hover:bg-emerald-800 sm:px-4 sm:text-sm">Start a group</Link>}
          {authenticated && <><Link href="/dashboard" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm">Workspace</Link><UserMenu /></>}
        </div>
      </div>
    </header>
  );
}
