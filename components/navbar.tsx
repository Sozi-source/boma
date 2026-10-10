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
    { href: '/#trust', label: 'Why Openhand' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-[#e8ece7] bg-[#f7f8f6]/95 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
        
        {/* Logo & App Status */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="text-[1.35rem] font-semibold leading-none tracking-[-.06em] text-[#15342b]">Open<span className="text-[#83c83e]">hand</span></span>
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
          {!authenticated && <Link href="/auth/login" className="inline-flex min-h-10 items-center rounded-full px-2.5 text-xs font-semibold text-[#25342d] transition hover:bg-white sm:px-4 sm:text-sm">Sign in</Link>}
          {!authenticated && <Link href="/auth/signup?role=organizer" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#99d452] px-4 text-[11px] font-semibold text-[#19352c] transition hover:bg-[#8ac841] sm:px-5 sm:text-sm">Start a group</Link>}
          {authenticated && <><Link href="/dashboard" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm">Workspace</Link><UserMenu /></>}
        </div>
      </div>
    </header>
  );
}
