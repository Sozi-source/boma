'use client';

import React from 'react';
import Image from 'next/image';
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
  ];

  const isFundDetailPage = pathname.startsWith('/bomas/') && pathname !== '/bomas' && pathname !== '/bomas/create';

  return (
    <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
        
        {/* Logo & App Status */}
        <div className="flex items-center gap-3 sm:gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl overflow-hidden shadow-xs border border-slate-200/80 bg-white p-0.5 transition-transform group-hover:scale-105">
              <Image
                src="/assets/icons/openhand.webp"
                alt="Openhand"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-bold leading-none tracking-tight text-slate-900">
              Open<span className="text-emerald-700">hand</span>
            </span>
          </Link>

          {/* Desktop App Nav Items */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => {
              const basePath = link.href.split('#')[0];
              const isActive = basePath === '/' ? pathname === '/' : pathname === basePath || pathname.startsWith(`${basePath}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'text-emerald-800 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
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
          {isFundDetailPage && !authenticated ? null : !authenticated ? (
            <>
              <Link
                href="/auth/login"
                className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup?role=organizer"
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 active:scale-[0.98]"
              >
                Start a group
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/dashboard" 
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Organizer Workspace
              </Link>
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
