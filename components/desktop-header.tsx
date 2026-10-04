'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './user-menu';
import { BellIcon, PlusIcon, ShieldCheckIcon } from './ui/icons';

export default function DesktopHeader() {
  const pathname = usePathname();
  const [isLive, setIsLive] = useState(true);

  // Derive human-readable page section for the desktop breadcrumb
  const getPageTitle = () => {
    if (pathname === '/') return 'Home Overview';
    if (pathname === '/dashboard') return 'Treasury & Member Portal';
    if (pathname === '/bomas') return 'Community Funds';
    if (pathname.startsWith('/bomas/create')) return 'Launch New Boma';
    if (pathname === '/admin') return 'Admin Overview';
    if (pathname === '/admin/users') return 'Customers & Multi-Phone Directory';
    if (pathname === '/admin/approvals') return 'Signup Approvals Queue';
    if (pathname === '/admin/senders') return 'Sender Name Resolution Audit';
    if (pathname === '/admin/subaccounts') return 'Subaccounts & Settlement Accounts';
    if (pathname === '/admin/funds') return 'Funds & Disbursements';
    if (pathname === '/admin/ledger') return 'Double-Entry Ledger Audit';
    return 'Boma Platform';
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-5 sm:px-8 lg:px-10 xl:px-12 flex items-center justify-between gap-4 select-none shadow-2xs">
      
      {/* Left: Breadcrumb / Current Context */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-semibold text-slate-800 tracking-tight truncate">
          {getPageTitle()}
        </span>
        <span className="text-slate-300 hidden xl:inline">•</span>
        <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
          Merchant ID: 1938784
        </span>
      </div>

      {/* Center: Subtle Security Badge */}
      <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
        <span>Bank-grade Double-Entry Escrow</span>
      </div>

      {/* Right Controls: Live toggle, Approved pill, New Contribution, Notifications, User Profile */}
      <div className="flex items-center gap-3.5 shrink-0">
        
        {/* Live Switch Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isLive ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={isLive}
            title="Toggle Live / Test Mode"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isLive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-slate-700">
            {isLive ? 'Live' : 'Test'}
          </span>
        </div>

        {/* Approved Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
          <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <span>Approved</span>
        </div>

        {/* Quick New Contribution Button */}
        <Link
          href="/bomas/create"
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5 stroke-[2]" />
          <span>New Contribution</span>
        </Link>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => alert('All payments & settlement notifications reconciled successfully.')}
          className="relative p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* User Account Menu */}
        <div className="pl-1 border-l border-slate-200">
          <UserMenu />
        </div>
      </div>

    </header>
  );
}
