'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  SearchIcon,
  WalletIcon,
  ShieldCheckIcon,
} from './ui/icons';

export default function MobileNav({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isFunds = pathname === '/bomas' || pathname.startsWith('/bomas/');
  const isActivity = pathname === '/activity';
  const isAdmin = pathname.startsWith('/admin');

  const item = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[9px] font-semibold transition ${
      active ? 'text-emerald-700' : 'text-slate-400'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-[4rem] max-w-md items-center">
        <Link href="/" className={item(isHome)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isHome ? 'bg-emerald-50' : ''}`}>
            <HomeIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Home</span>
        </Link>

        <Link href="/bomas" className={item(isFunds)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isFunds ? 'bg-emerald-50' : ''}`}>
            <SearchIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Funds</span>
        </Link>

        <Link href={authenticated ? '/activity' : '/auth/login'} className={item(isActivity)}>
          <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${isActivity ? 'bg-emerald-50' : ''}`}>
            <WalletIcon className="h-[19px] w-[19px]" />
            {authenticated && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
          </span>
          <span>{authenticated ? 'Activity' : 'Sign in'}</span>
        </Link>

        <Link href={authenticated ? '/admin' : '/auth/login'} className={item(isAdmin)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isAdmin ? 'bg-emerald-50' : ''}`}>
            <ShieldCheckIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Admin</span>
        </Link>
      </div>
    </nav>
  );
}
