'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  SearchIcon,
  WalletIcon,
  PlusIcon,
} from './ui/icons';

export default function MobileNav({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard';
  const isFunds = pathname === '/bomas' || pathname.startsWith('/bomas/');
  const isActivity = pathname === '/activity';
  const isCreate = pathname === '/bomas/create';

  const item = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[9px] font-semibold transition ${
      active ? 'text-emerald-700' : 'text-slate-400'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-[4rem] max-w-md items-center">
        <Link href="/dashboard" className={item(isHome)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isHome ? 'bg-emerald-50' : ''}`}>
            <HomeIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Overview</span>
        </Link>

        <Link href="/bomas" className={item(isFunds)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isFunds ? 'bg-emerald-50' : ''}`}>
            <SearchIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Funds</span>
        </Link>

        <Link href="/activity" className={item(isActivity)}>
          <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${isActivity ? 'bg-emerald-50' : ''}`}>
            <WalletIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Activity</span>
        </Link>

        <Link href={authenticated ? '/bomas/create' : '/auth/login?next=/bomas/create'} className={item(isCreate)}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isCreate ? 'bg-emerald-50' : ''}`}>
            <PlusIcon className="h-[19px] w-[19px]" />
          </span>
          <span>Create</span>
        </Link>
      </div>
    </nav>
  );
}
