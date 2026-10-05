'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Transaction, Boma } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import ContributorTracker from '@/components/contributor-tracker';
import { 
  CreditCardIcon, 
  SearchIcon, 
  BuildingLibraryIcon, 
  SmartphoneIcon,
  ShieldCheckIcon,
  ClockIcon,
  CopyIcon,
  CheckCircleIcon
} from '@/components/ui/icons';

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'transactions' | 'contributors'>('transactions');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allBomas = await bomaService.getBomas();
        setBomas(allBomas);

        const allTxns: Transaction[] = [];
        for (const b of allBomas) {
          const txs = await bomaService.getBomaTransactions(b.id);
          allTxns.push(...txs);
        }
        allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTransactions(allTxns);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const bomaMap = useMemo(() => {
    const map = new Map<string, Boma>();
    bomas.forEach((b) => map.set(b.id, b));
    return map;
  }, [bomas]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => {
      const fund = bomaMap.get(t.boma_id);
      return (
        t.contributor_name.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        (fund && fund.title.toLowerCase().includes(q))
      );
    });
  }, [transactions, searchQuery, bomaMap]);

  const totalVolume = useMemo(() => {
    return transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="w-full min-w-0 px-3.5 sm:px-8 lg:px-10 xl:px-12 py-4 sm:py-8">
      <div className="w-full max-w-7xl space-y-5 sm:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80">
          <div>
            <h1 className="text-base sm:text-xl font-semibold text-slate-900 tracking-tight">
              Activity &amp; Receipts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live, immutable record of all contributions and receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Public Audit Log</span>
            </span>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Volume</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-slate-900">
              {formatCurrency(totalVolume, 'KES')}
            </p>
            <span className="text-[10px] text-slate-400">All-time contributions</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contributions</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-slate-900">
              {transactions.length}
            </p>
            <span className="text-[10px] text-slate-400">Completed payments</span>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Funds</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-slate-900">
              {bomas.length}
            </p>
            <span className="text-[10px] text-slate-400">Transparent community pools</span>
          </div>
        </div>

        {/* Controls: Search & View Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="relative w-full sm:max-w-md">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search transactions"
              placeholder="Search by contributor, fund, or BP- reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('transactions')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'transactions'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Receipts
            </button>
            <button
              type="button"
              onClick={() => setViewMode('contributors')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'contributors'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              By Contributor
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-mono">
            Loading activity log...
          </div>
        ) : viewMode === 'contributors' ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <ContributorTracker transactions={filteredTransactions} currency="KES" bomaTitle="All Community Funds" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <ClockIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No contributions found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search terms.' : 'Completed payments will automatically appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const fund = bomaMap.get(tx.boma_id);
                const isCopied = copiedRef === tx.reference;

                return (
                  <div key={tx.id || tx.reference} className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                        {tx.payment_method === 'mpesa' ? (
                          <SmartphoneIcon className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <CreditCardIcon className="w-4 h-4 text-emerald-700" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {tx.is_anonymous ? 'Anonymous Friend' : tx.contributor_name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                            {tx.payment_method}
                          </span>
                        </div>

                        {fund && (
                          <Link
                            href={`/bomas/${fund.id}`}
                            className="text-xs text-emerald-700 hover:underline font-medium block truncate mt-0.5"
                          >
                            Fund: {fund.title}
                          </Link>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                          <span>{new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => copyReference(tx.reference)}
                            className="inline-flex items-center gap-1 hover:text-slate-700 transition"
                            title="Click to copy payment reference"
                          >
                            <span>{tx.reference.slice(0, 16)}...</span>
                            {isCopied ? (
                              <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <CopyIcon className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <span className="text-sm sm:text-base font-bold font-mono text-emerald-700">
                        +{formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Completed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
