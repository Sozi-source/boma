'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boma, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import ContributorTracker from '@/components/contributor-tracker';
import { 
  ShieldCheckIcon, 
  WalletIcon,
  PlusIcon, 
} from '@/components/ui/icons';

export default function DashboardPage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'contributors' | 'receipts'>('contributors');
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

  return (
    <div className="w-full min-w-0 px-5 sm:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
      <div className="w-full max-w-7xl space-y-6">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight">
              {user ? `${user.name.split(' ')[0]}'s funds` : 'Your funds'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Manage</span>
            </Link>

            <Link
              href="/bomas/create"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Start a Fund</span>
            </Link>
          </div>
        </div>

        {/* Quick overview */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Collected</span>
              <WalletIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {formatCurrency(totalRaised, 'KES')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Across {bomas.length} funds</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Contributions</span>
              <WalletIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {transactions.length}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">Across your funds</span>
          </div>
        </div>

        {/* Your Active Contributions Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Your funds
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {bomas.length} funds
            </span>
          </div>

          {/* Contributions List & Table with Empty State */}
          {bomas.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-xs text-slate-500 mb-3">You haven’t started a fund yet.</p>
              <Link
                href="/bomas/create"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Start Your First Fund</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {bomas.map((b) => {
                const pct = Math.min(100, Math.round((b.current_amount / b.target_amount) * 100));
                return (
                  <Link
                    key={b.id}
                    href={`/bomas/${b.id}`}
                    className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition-colors hover:border-emerald-300 hover:bg-emerald-50/20 sm:p-4"
                  >
                    <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[10px]">
                      {b.category}
                    </span>
                    <span className="mt-1 line-clamp-2 min-h-10 text-xs font-semibold leading-snug text-slate-900 sm:text-sm">
                      {b.title}
                    </span>
                    <div className="mt-3 flex items-baseline justify-between gap-1">
                      <span className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                        {formatCurrency(b.current_amount, b.currency)}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="mt-2 truncate text-[10px] text-slate-500">
                      Goal {formatCurrency(b.target_amount, b.currency)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Contributions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Contributions
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('contributors')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'contributors'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Contributors
              </button>
              <button
                type="button"
                onClick={() => setViewMode('receipts')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'receipts'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recent ({transactions.length})
              </button>
            </div>
          </div>

          {viewMode === 'contributors' ? (
            <ContributorTracker
              transactions={transactions}
              currency="KES"
              bomaTitle="Your funds"
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent contributions
                </h2>
              </div>

              {transactions.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-xs text-slate-500">No contributions yet. They’ll appear here when received.</p>
                </div>
              ) : (
                <>
                <div className="divide-y divide-slate-100 sm:hidden">
                  {transactions.slice(0, 10).map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 py-3 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{t.is_anonymous ? 'Anonymous' : t.contributor_name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <span className="shrink-0 text-right font-mono text-xs font-semibold text-emerald-700">+{formatCurrency(t.amount, t.currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block">
                  <table className="w-full table-fixed text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Contributor</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 10).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="truncate py-3 px-3 font-semibold text-slate-900">
                            {t.is_anonymous ? 'Anonymous' : t.contributor_name}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                            +{formatCurrency(t.amount, t.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
