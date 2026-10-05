'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './user-menu';

export default function Navbar({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/bomas', label: 'Funds' },
    { href: '/activity', label: 'Activity' },
    ...(authenticated ? [
      { href: '/admin', label: 'Admin Console' },
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
        
        {/* Logo & App Status */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs group-hover:bg-emerald-700 transition-colors">
              <span className="font-mono text-sm font-semibold tracking-tight">B</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-slate-800">
                Boma
              </span>
            </div>
          </Link>

          {/* Desktop App Nav Items (Pill Style) */}
          <nav className="hidden md:flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
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
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
