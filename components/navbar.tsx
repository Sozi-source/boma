'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusIcon } from './ui/icons';
import UserMenu from './user-menu';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/bomas', label: 'Explore' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-neutral-200/70 bg-white/95 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-13 max-w-6xl items-center justify-between px-3 sm:px-6">
        
        {/* Logo & App Status */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-mono text-sm font-black tracking-tight">B</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-neutral-900 ">
                Boma
              </span>
            </div>
          </Link>

          {/* Desktop App Nav Items (Pill Style) */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-neutral-100/80 p-1 ">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-neutral-900 shadow-xs '
                      : 'text-neutral-500 hover:text-neutral-900 '
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

          <Link
            href="/bomas/create"
            className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Contribution</span>
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
