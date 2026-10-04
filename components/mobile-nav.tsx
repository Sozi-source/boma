'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  PlusIcon,
  SearchIcon,
  WalletIcon,
  BellIcon,
} from './ui/icons';

export default function MobileNav({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isExplore = pathname === '/bomas';
  const isDashboard = authenticated && pathname === '/dashboard';
  const createHref = authenticated ? '/bomas/create' : '/auth/signup';
  const dashboardHref = authenticated ? '/dashboard' : '/auth/login';

  const item = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[9px] font-semibold transition ${
      active ? 'text-emerald-700' : 'text-slate-400'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-[4.75rem] max-w-md items-center">
        <Link href="/" className={item(isHome)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isHome ? 'bg-emerald-50' : ''}`}>
            <HomeIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Home</span>
        </Link>

        <Link href="/bomas" className={item(isExplore)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isExplore ? 'bg-emerald-50' : ''}`}>
            <SearchIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Explore</span>
        </Link>

        <Link href={createHref} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[9px] font-bold text-slate-700">
          <span className="flex h-11 w-11 -translate-y-2 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_8px_20px_rgba(15,133,121,0.28)] ring-4 ring-white">
            <PlusIcon className="h-5 w-5 stroke-[2.5]" />
          </span>
          <span className="-mt-1">Start</span>
        </Link>

        <Link href={dashboardHref} className={item(isDashboard)}>
          <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${isDashboard ? 'bg-emerald-50' : ''}`}>
            <WalletIcon className="h-[19px] w-[19px]" />
            {authenticated && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
          </span>
          <span>{authenticated ? 'Activity' : 'Sign in'}</span>
        </Link>

        <Link href={authenticated ? '/admin' : '/auth/login'} className={item(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl">
            <BellIcon className="h-[19px] w-[19px]" />
          </span>
          <span>More</span>
        </Link>
      </div>
    </nav>
  );
}
