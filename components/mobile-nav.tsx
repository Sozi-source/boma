'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  PlusIcon, 
  WalletIcon, 
  SearchIcon 
} from './ui/icons';

// Home icon for mobile bottom nav
function HomeNavIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const demo = localStorage.getItem('bomapay_auth_user');
      if (demo) setHasUser(true);
    }
  }, [pathname]);

  const isHome = pathname === '/';
  const isExplore = pathname === '/bomas';
  const isCreate = pathname === '/bomas/create';
  const isDashboard = pathname === '/dashboard';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl px-3 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Vault / Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
            isHome
              ? 'text-emerald-600 font-extrabold'
              : 'text-neutral-400 hover:text-neutral-700 font-medium'
          }`}
        >
          <HomeNavIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </Link>

        {/* Explore */}
        <Link
          href="/bomas"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
            isExplore
              ? 'text-emerald-600 font-extrabold'
              : 'text-neutral-400 hover:text-neutral-700 font-medium'
          }`}
        >
          <SearchIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Explore</span>
        </Link>

        {/* Create (Elevated Action) */}
        <Link
          href="/bomas/create"
          className="flex flex-col items-center justify-center -mt-5 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 group-active:scale-90 transition-transform">
            <PlusIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-neutral-800 ">
            Create
          </span>
        </Link>

        {/* Ledger & Dashboard */}
        <Link
          href="/dashboard"
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
            isDashboard
              ? 'text-emerald-600 font-extrabold'
              : 'text-neutral-400 hover:text-neutral-700 font-medium'
          }`}
        >
          <div className="relative">
            <WalletIcon className="w-5 h-5" />
            {hasUser && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white " />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Taarifa</span>
        </Link>
      </div>
    </nav>
  );
}
