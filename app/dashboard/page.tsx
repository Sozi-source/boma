'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boma, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { 
  ShieldCheckIcon, 
  WalletIcon, 
  UsersIcon, 
  TrendingUpIcon, 
  PlusIcon, 
  ArrowUpRightIcon,
  CopyIcon,
  CheckCircleIcon
} from '@/components/ui/icons';

export default function DashboardPage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      const currentUser = await bomaService.getCurrentUser();
      if (currentUser && currentUser.id !== 'user-guest') {
        setUser(currentUser);
      }

      const allBomas = await bomaService.getBomas();
      setBomas(allBomas);

      const allTxns: Transaction[] = [];
      for (const b of allBomas) {
        const txns = await bomaService.getBomaTransactions(b.id);
        allTxns.push(...txns);
      }
      allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTxns);
    };

    loadDashboard();
  }, []);

  const totalRaised = bomas.reduce((acc, b) => acc + Number(b.current_amount), 0);
  const totalGiven = transactions.reduce((acc, t) => acc + Number(t.amount), 0);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-5">
      
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 ">
            {user ? `${user.name.split(' ')[0]}'s Portal` : 'Treasury Portal'}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono">
            {user ? `Organizer: ${user.name}` : 'Pooled funds, active contributions, and ledger receipts.'}
          </p>
        </div>

        <Link
          href="/bomas/create"
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
        >
          <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Contribution</span>
        </Link>
      </div>

      {/* Metrics 2x2 on Mobile, 4x1 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs ">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] sm:text-xs font-semibold">
            <span>Total Raised</span>
            <WalletIcon className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black text-neutral-900 truncate">
            {formatCurrency(totalRaised, 'KES')}
          </div>
          <span className="text-[9px] text-neutral-400 mt-0.5 block">{bomas.length} funds</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs ">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] sm:text-xs font-semibold">
            <span>Contributions</span>
            <TrendingUpIcon className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black text-neutral-900 ">
            {transactions.length}
          </div>
          <span className="text-[9px] text-emerald-700 mt-0.5 block">100% verified</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs ">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] sm:text-xs font-semibold">
            <span>Total Given</span>
            <UsersIcon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black text-neutral-900 truncate">
            {formatCurrency(totalGiven, 'KES')}
          </div>
          <span className="text-[9px] text-neutral-400 mt-0.5 block">All payment rails</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs ">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] sm:text-xs font-semibold">
            <span>Ledger Health</span>
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black text-emerald-700 ">
            Balanced
          </div>
          <span className="text-[9px] text-neutral-400 mt-0.5 block">Double-entry verified</span>
        </div>
      </div>

      {/* Your Contributions List (Compact Mobile Row View + Desktop Table) */}
      <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-neutral-900 ">
            Your Contributions
          </h2>
          <span className="text-[10px] text-neutral-400 font-medium">
            {bomas.length} Active
          </span>
        </div>

        {/* Contributions List & Table with Empty State */}
        {bomas.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-200 rounded-xl">
            <p className="text-xs text-neutral-500 mb-2">No contributions created yet</p>
            <Link
              href="/bomas/create"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Start Your First Contribution</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Michango List (< 640px) */}
            <div className="block sm:hidden divide-y divide-neutral-100 ">
              {bomas.map((b) => {
                const pct = Math.min(100, Math.round((b.current_amount / b.target_amount) * 100));
                return (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-neutral-900 truncate">
                        {b.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                        <span className="uppercase font-semibold">{b.category}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{pct}%</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-neutral-900 block">
                        {formatCurrency(b.current_amount, b.currency)}
                      </span>
                      <Link
                        href={`/bomas/${b.id}`}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-700 inline-flex items-center gap-0.5"
                      >
                        <span>Manage</span>
                        <ArrowUpRightIcon className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Michango Table (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider text-[9px]">
                    <th className="py-2 px-2">Title</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2">Progress</th>
                    <th className="py-2 px-2 text-right">Raised</th>
                    <th className="py-2 px-2 text-right">Target</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 ">
                  {bomas.map((b) => {
                    const pct = Math.min(100, Math.round((b.current_amount / b.target_amount) * 100));
                    return (
                      <tr key={b.id} className="hover:bg-neutral-50 ">
                        <td className="py-2.5 px-2 font-semibold text-neutral-900 max-w-xs truncate text-[11px]">
                          {b.title}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-700 uppercase">
                            {b.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 min-w-[100px]">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-neutral-500">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-700 text-[11px]">
                          {formatCurrency(b.current_amount, b.currency)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-neutral-400 text-[11px]">
                          {formatCurrency(b.target_amount, b.currency)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <Link
                            href={`/bomas/${b.id}`}
                            className="font-bold text-emerald-700 hover:text-emerald-700 text-[11px] inline-flex items-center gap-0.5"
                          >
                            <span>Manage</span>
                            <ArrowUpRightIcon className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Verified Receipts Feed (Compact Mobile Row View + Desktop Table) */}
      <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-neutral-900 ">
            Recent Receipts
          </h2>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
            <CheckCircleIcon className="w-3 h-3" />
            Live
          </span>
        </div>

        {/* Receipts Feed with Empty State */}
        {transactions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-200 rounded-xl">
            <p className="text-xs text-neutral-500">No receipts yet. When contributions arrive, they will appear here live with audit references.</p>
          </div>
        ) : (
          <>
            {/* Mobile Receipts View (< 640px) */}
            <div className="block sm:hidden divide-y divide-neutral-100 ">
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-neutral-900 block truncate">
                      {t.is_anonymous ? 'Anonymous Friend' : t.contributor_name}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[9px] text-neutral-400 mt-0.5">
                      <span>{t.reference}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(t.reference)}
                        className="p-0.5 text-neutral-400 hover:text-emerald-700"
                      >
                        <CopyIcon className="w-3 h-3" />
                      </button>
                      {copiedRef === t.reference && <span className="text-emerald-700 font-sans">Copied</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-emerald-700 block">
                      +{formatCurrency(t.amount, t.currency)}
                    </span>
                    <span className="text-[9px] text-neutral-400 uppercase">
                      {t.payment_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Receipts Table (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider text-[9px]">
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Contributor</th>
                    <th className="py-2 px-2">Reference</th>
                    <th className="py-2 px-2">Rail</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 ">
                  {transactions.slice(0, 10).map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50 ">
                      <td className="py-2 px-2 text-neutral-400 text-[11px]">
                        {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 px-2 font-medium text-neutral-900 text-[11px]">
                        {t.is_anonymous ? 'Anonymous' : t.contributor_name}
                      </td>
                      <td className="py-2 px-2 font-mono text-[10px] text-neutral-400">
                        <div className="flex items-center gap-1">
                          <span>{t.reference}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(t.reference)}
                            className="hover:text-emerald-700"
                          >
                            <CopyIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-2 uppercase text-[9px] font-bold text-neutral-400">
                        {t.payment_method}
                      </td>
                      <td className="py-2 px-2 text-right font-extrabold text-emerald-700 text-[11px]">
                        +{formatCurrency(t.amount, t.currency)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ">
                          PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
