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

  return (
    <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-[#dce0d3] bg-white/90 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
        
        {/* Logo & App Status */}
        <div className="flex items-center gap-3 sm:gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <Image
              src="/assets/icons/openhand.webp"
              alt="Openhand"
              width={36}
              height={36}
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-lg sm:rounded-xl object-contain shadow-xs transition-transform group-hover:scale-105"
              priority
            />
            <span className="text-[1.35rem] sm:text-[1.45rem] font-bold leading-none tracking-tight text-[#18181b]">Open<span className="text-[#99d452]">hand</span></span>
          </Link>

          {/* Desktop App Nav Items */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const basePath = link.href.split('#')[0];
              const isActive = basePath === '/' ? pathname === '/' : pathname === basePath || pathname.startsWith(`${basePath}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] transition-colors -tracking-[0.2px] ${
                    isActive
                      ? 'text-[#18181b] font-semibold'
                      : 'text-[#52525b] font-medium hover:text-[#18181b]'
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
          {!authenticated ? (
            <>
              <Link
                href="/auth/login"
                className="inline-flex min-h-10 items-center rounded-full border border-[#dce0d3] bg-white px-4 text-[13px] sm:text-[14px] font-semibold text-[#18181b] transition hover:border-[#b8c2ad] hover:text-[#14532d] -tracking-[0.2px]"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup?role=organizer"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#99d452] px-4 sm:px-5 text-xs sm:text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(153,212,82,0.3)] transition hover:bg-[#8ac841] active:scale-[0.98] -tracking-[0.2px]"
              >
                Start a group
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#18181b] hover:bg-slate-100 sm:text-sm">Workspace</Link>
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
