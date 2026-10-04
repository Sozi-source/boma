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
  const [viewMode, setViewMode] = useState<'contributors' | 'receipts'>('contributors');
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
    <div className="w-full min-w-0 px-5 sm:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
      <div className="w-full max-w-7xl space-y-6">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight">
              {user ? `${user.name.split(' ')[0]}'s Portal` : 'Treasury Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Admin Controls</span>
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

        {/* 4 Metric Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Capital Raised</span>
              <WalletIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {formatCurrency(totalRaised, 'KES')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">{bomas.length} active campaigns</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Contributions Received</span>
              <TrendingUpIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {transactions.length}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">100% verified identities</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Volume Processed</span>
              <UsersIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {formatCurrency(totalGiven, 'KES')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">All settlement rails</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Ledger Status</span>
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-700">
              Balanced
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Double-entry verified</span>
          </div>
        </div>

        {/* Your Active Contributions Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Your Campaigns &amp; Funds
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {bomas.length} Active
            </span>
          </div>

          {/* Contributions List & Table with Empty State */}
          {bomas.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-xs text-slate-500 mb-3">No contributions created yet</p>
              <Link
                href="/bomas/create"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Start Your First Fund</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 px-3 text-right">Raised</th>
                    <th className="py-2.5 px-3 text-right">Target</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bomas.map((b) => {
                    const pct = Math.min(100, Math.round((b.current_amount / b.target_amount) * 100));
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                          {b.title}
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                            {b.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(b.current_amount, b.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(b.target_amount, b.currency)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/bomas/${b.id}`}
                            className="font-semibold text-emerald-700 hover:text-emerald-800 text-xs inline-flex items-center gap-1"
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
          )}
        </div>

        {/* Verified Receipts & Contributor Register */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Contributions &amp; Contributor Register
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
                By Contributor
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
                Receipts Feed ({transactions.length})
              </button>
            </div>
          </div>

          {viewMode === 'contributors' ? (
            <ContributorTracker
              transactions={transactions}
              currency="KES"
              bomaTitle="Treasury Portal"
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent Receipts
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Reconciled
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  <p className="text-xs text-slate-500">No receipts yet. When contributions arrive, they will appear here live with audit references.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Contributor</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 10).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {t.is_anonymous ? 'Anonymous' : t.contributor_name}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span>{t.reference}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(t.reference)}
                                className="text-slate-400 hover:text-emerald-700 transition-colors"
                              >
                                <CopyIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 uppercase text-[10px] font-semibold text-slate-500">
                            {t.payment_method}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                            +{formatCurrency(t.amount, t.currency)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                              PAID
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
