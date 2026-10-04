'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
    let active = true;
    const readUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (active) setHasUser(Boolean(user));
      } catch {
        if (active) setHasUser(false);
      }
    };
    void readUser();
    return () => { active = false; };
  }, [pathname]);

  const isHome = pathname === '/';
  const isExplore = pathname === '/bomas';
  const isDashboard = pathname === '/dashboard';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 select-none border-t border-slate-200 bg-white h-[calc(5rem+env(safe-area-inset-bottom))] px-3 pb-[env(safe-area-inset-bottom)] transition-colors lg:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto h-full">
        {/* Vault / Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
            isHome
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
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
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <SearchIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Explore</span>
        </Link>

        {/* Create (Elevated Action) */}
        <Link
          href="/bomas/create"
          className="group flex flex-col items-center justify-center rounded-xl px-3 py-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs transition-transform group-active:scale-95">
            <PlusIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] mt-0.5 font-semibold text-slate-800">
            Start
          </span>
        </Link>

        {/* Ledger & Dashboard */}
        <Link
          href="/dashboard"
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
            isDashboard
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <div className="relative">
            <WalletIcon className="w-5 h-5" />
            {hasUser && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Activity</span>
        </Link>
      </div>
    </nav>
  );
}
