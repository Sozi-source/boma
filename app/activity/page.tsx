'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Transaction, Boma, PaymentMethod, Currency } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { normalizePhoneNumber } from '@/lib/utils/phone';
import { 
  CreditCardIcon, 
  SearchIcon, 
  SmartphoneIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  CopyIcon, 
  CheckCircleIcon, 
  UsersIcon, 
  XMarkIcon, 
  PrinterIcon, 
  ArrowUpRightIcon, 
  BuildingLibraryIcon 
} from '@/components/ui/icons';

interface ContributorStat {
  key: string;
  name: string;
  phone?: string;
  email?: string;
  isAnonymous: boolean;
  totalAmount: number;
  currency: Currency;
  count: number;
  funds: string[];
  lastDate: string;
}

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'all' | 'mpesa' | 'card'>('all');
  const [viewMode, setViewMode] = useState<'receipts' | 'contributors'>('receipts');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

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

  // Aggregate stats per distinct contributor
  const contributorStats = useMemo(() => {
    const map = new Map<string, ContributorStat>();
    transactions.forEach((tx) => {
      const res = bomaService.resolveSenderIdentity(
        tx.contributor_phone,
        tx.contributor_email,
        tx.contributor_name
      );
      const isRegistered = Boolean(res.matchedUser);
      const isAnonymous = isRegistered ? false : tx.is_anonymous;
      const displayName = isRegistered
        ? res.matchedUser!.full_name
        : isAnonymous
        ? 'Anonymous Friend'
        : res.name || tx.contributor_name || 'Contributor';

      const key = isAnonymous
        ? `anon-${tx.id || tx.reference}`
        : isRegistered
        ? `user-${res.matchedUser!.id}`
        : (tx.contributor_email?.toLowerCase().trim() ||
           normalizePhoneNumber(tx.contributor_phone) ||
           tx.contributor_name.toLowerCase().trim() ||
           `unknown-${tx.id}`);

      const fund = bomaMap.get(tx.boma_id);
      const fundTitle = fund ? fund.title : 'Community Fund';

      const existing = map.get(key);
      if (existing) {
        existing.totalAmount += Number(tx.amount || 0);
        existing.count += 1;
        if (!existing.funds.includes(fundTitle)) {
          existing.funds.push(fundTitle);
        }
        if (new Date(tx.created_at) > new Date(existing.lastDate)) {
          existing.lastDate = tx.created_at;
        }
      } else {
        map.set(key, {
          key,
          name: displayName,
          phone: tx.contributor_phone,
          email: tx.contributor_email,
          isAnonymous,
          totalAmount: Number(tx.amount || 0),
          currency: (tx.currency as Currency) || 'KES',
          count: 1,
          funds: [fundTitle],
          lastDate: tx.created_at,
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.totalAmount - a.totalAmount);
    return list;
  }, [transactions, bomaMap]);

  // Filter contributors
  const filteredContributors = useMemo(() => {
    if (!searchQuery.trim()) return contributorStats;
    const q = searchQuery.toLowerCase().trim();
    return contributorStats.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.funds.some((f) => f.toLowerCase().includes(q))
    );
  }, [contributorStats, searchQuery]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (selectedMethod !== 'all') {
      list = list.filter((t) => t.payment_method === selectedMethod);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((t) => {
      const fund = bomaMap.get(t.boma_id);
      return (
        t.contributor_name.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        (t.contributor_phone && t.contributor_phone.toLowerCase().includes(q)) ||
        (t.contributor_email && t.contributor_email.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        (fund && fund.title.toLowerCase().includes(q))
      );
    });
  }, [transactions, searchQuery, selectedMethod, bomaMap]);

  const totalVolume = useMemo(() => {
    return transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const copyReference = (ref: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const activeFundForReceipt = selectedReceipt ? bomaMap.get(selectedReceipt.boma_id) : null;

  return (
    <div className="w-full min-w-0 px-3.5 sm:px-8 lg:px-10 xl:px-12 py-4 sm:py-8 bg-[#f5f7f8] min-h-screen">
      <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Activity &amp; Receipts
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Public Audit Log</span>
              </span>
              {bomas.length === 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                  <span>{bomas[0].title}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time ledger of contributors and receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <span>← Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Volume Raised</span>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-950">
              {formatCurrency(totalVolume, 'KES')}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">100% verified settlement</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Receipts</span>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-950">
              {transactions.length}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Audited transactions</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Distinct Contributors</span>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-950">
              {contributorStats.length}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Community supporters</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Causes</span>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-950">
              {bomas.length}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Escrow accounts</span>
          </div>
        </div>

        {/* View Mode Switcher & Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Segmented Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('receipts')}
              className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'receipts'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCardIcon className="w-4 h-4 text-emerald-700" />
              <span>Receipts Ledger</span>
              <span className="ml-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                {transactions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('contributors')}
              className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'contributors'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UsersIcon className="w-4 h-4 text-emerald-700" />
              <span>Contributors Breakdown</span>
              <span className="ml-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                {contributorStats.length}
              </span>
            </button>
          </div>

          {/* Search Bar & Method Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 md:max-w-xl md:justify-end">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                aria-label="Search ledger"
                placeholder={
                  viewMode === 'receipts'
                    ? 'Search contributor, reference, or fund...'
                    : 'Search contributor by name or contact...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {viewMode === 'receipts' && (
              <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedMethod === 'all'
                      ? 'bg-white text-slate-950 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('mpesa')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedMethod === 'mpesa'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  M-Pesa
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedMethod === 'card'
                      ? 'bg-white text-sky-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Card
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-xs text-slate-400 font-mono shadow-xs">
            Loading cryptographic audit log...
          </div>
        ) : viewMode === 'receipts' ? (
          /* ========================================================= */
          /* VIEW 1: RECEIPTS TABULAR FINTECH LEDGER                   */
          /* ========================================================= */
          filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
              <ClockIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No receipts found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No transactions matched your search criteria.' : 'Live payments completed through Paystack M-Pesa or Card will appear here.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              
              {/* Desktop & Tablet Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 pl-6 pr-3">Date &amp; Time</th>
                      <th className="py-3.5 px-3">Contributor</th>
                      {bomas.length > 1 && <th className="py-3.5 px-3">Fund / Cause</th>}
                      <th className="py-3.5 px-3">Method</th>
                      <th className="py-3.5 px-3">Payment Reference</th>
                      <th className="py-3.5 px-3 text-right">Amount</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 pr-6 pl-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTransactions.map((tx) => {
                      const fund = bomaMap.get(tx.boma_id);
                      const isCopied = copiedRef === tx.reference;
                      const dateObj = new Date(tx.created_at);

                      return (
                        <tr
                          key={tx.id || tx.reference}
                          onClick={() => setSelectedReceipt(tx)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Date & Time */}
                          <td className="py-4 pl-6 pr-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 block">
                              {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          {/* Contributor */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2.5 min-w-[160px]">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  tx.is_anonymous
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {tx.is_anonymous ? '?' : tx.contributor_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-950 block truncate">
                                  {tx.is_anonymous ? 'Anonymous Friend' : tx.contributor_name}
                                </span>
                                {tx.contributor_phone && (
                                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                                    {tx.contributor_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Fund (only shown when multiple funds exist) */}
                          {bomas.length > 1 && (
                            <td className="py-4 px-3">
                              {fund ? (
                                <Link
                                  href={`/bomas/${fund.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold text-emerald-800 hover:text-emerald-950 hover:underline block truncate max-w-[200px]"
                                >
                                  {fund.title}
                                </Link>
                              ) : (
                                <span className="text-slate-500 font-medium">Fund</span>
                              )}
                            </td>
                          )}

                          {/* Payment Method Badge */}
                          <td className="py-4 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                tx.payment_method === 'mpesa'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200/80'
                              }`}
                            >
                              {tx.payment_method === 'mpesa' ? (
                                <SmartphoneIcon className="w-3 h-3 text-emerald-700" />
                              ) : (
                                <CreditCardIcon className="w-3 h-3 text-slate-600" />
                              )}
                              <span>{tx.payment_method}</span>
                            </span>
                          </td>

                          {/* Reference */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                              <span className="truncate max-w-[150px]">{tx.reference}</span>
                              <button
                                type="button"
                                onClick={(e) => copyReference(tx.reference, e)}
                                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                                title="Copy reference"
                              >
                                {isCopied ? (
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <CopyIcon className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-3 text-right whitespace-nowrap">
                            <span className="font-mono text-sm font-bold text-emerald-700">
                              +{formatCurrency(tx.amount, tx.currency)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Settled
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(tx)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 transition group-hover:underline"
                            >
                              <span>Receipt</span>
                              <ArrowUpRightIcon className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-style Ledger */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const fund = bomaMap.get(tx.boma_id);
                  const isCopied = copiedRef === tx.reference;
                  const dateObj = new Date(tx.created_at);

                  return (
                    <div
                      key={tx.id || tx.reference}
                      onClick={() => setSelectedReceipt(tx)}
                      className="p-4 hover:bg-slate-50/70 transition cursor-pointer space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              tx.is_anonymous ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tx.is_anonymous ? '?' : tx.contributor_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-950 truncate">
                              {tx.is_anonymous ? 'Anonymous Friend' : tx.contributor_name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-bold text-emerald-700 block">
                            +{formatCurrency(tx.amount, tx.currency)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            Settled
                          </span>
                        </div>
                      </div>

                      {bomas.length > 1 && fund && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 font-medium">Fund: </span>
                          <span className="font-bold text-slate-900">{fund.title}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {tx.payment_method}
                          </span>
                          <span className="truncate max-w-[120px]">{tx.reference.slice(0, 16)}...</span>
                          <button
                            type="button"
                            onClick={(e) => copyReference(tx.reference, e)}
                            className="p-1 hover:text-slate-800"
                          >
                            {isCopied ? <CheckCircleIcon className="w-3 h-3 text-emerald-600" /> : <CopyIcon className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-emerald-700 font-bold text-[10px]">View Receipt →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* ========================================================= */
          /* VIEW 2: CONTRIBUTORS BREAKDOWN DIRECTORY                   */
          /* ========================================================= */
          filteredContributors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
              <UsersIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No contributors found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No contributors matched your search keywords.' : 'Contributors will automatically appear here once payments land.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              
              {/* Desktop & Tablet Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 pl-6 pr-3">Contributor</th>
                      <th className="py-3.5 px-3">Contact</th>
                      {bomas.length > 1 && <th className="py-3.5 px-3">Supported Causes</th>}
                      <th className="py-3.5 px-3 text-center">Gifts</th>
                      <th className="py-3.5 px-3 text-right">Total Given</th>
                      <th className="py-3.5 px-3">Last Contribution</th>
                      <th className="py-3.5 pr-6 pl-3 text-right">Ledger Filter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredContributors.map((c) => (
                      <tr key={c.key} className="hover:bg-slate-50/80 transition-colors">
                        {/* Contributor Profile */}
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                c.isAnonymous ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {c.isAnonymous ? '?' : c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-950 block">{c.name}</span>
                              {c.isAnonymous && (
                                <span className="text-[10px] text-slate-400 italic">Privacy requested</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-4 px-3 font-mono text-[11px] text-slate-500">
                          {c.phone || c.email || '—'}
                        </td>

                        {/* Causes Supported (only shown when multiple funds exist) */}
                        {bomas.length > 1 && (
                          <td className="py-4 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {c.funds.map((f) => (
                                <span
                                  key={f}
                                  className="inline-block truncate rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                        )}

                        {/* Gifts Count */}
                        <td className="py-4 px-3 text-center">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-700">
                            {c.count} {c.count === 1 ? 'gift' : 'gifts'}
                          </span>
                        </td>

                        {/* Total Given */}
                        <td className="py-4 px-3 text-right whitespace-nowrap">
                          <span className="font-mono text-sm font-bold text-emerald-700">
                            {formatCurrency(c.totalAmount, c.currency)}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td className="py-4 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(c.lastDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Filter Ledger */}
                        <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery(c.name);
                              setViewMode('receipts');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                          >
                            <span>View Receipts</span>
                            <span>→</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredContributors.map((c) => (
                  <div key={c.key} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            c.isAnonymous ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.isAnonymous ? '?' : c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-950 truncate">{c.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {c.phone || c.email || 'Verified contributor'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-emerald-700 block">
                          {formatCurrency(c.totalAmount, c.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {c.count} {c.count === 1 ? 'gift' : 'gifts'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 font-mono">
                        Last: {new Date(c.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(c.name);
                          setViewMode('receipts');
                        }}
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        View {c.count} {c.count === 1 ? 'Receipt' : 'Receipts'} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* ========================================================= */}
        {/* OFFICIAL DIGITAL RECEIPT MODAL                             */}
        {/* ========================================================= */}
        {selectedReceipt && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedReceipt(null)}
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* Header Stamp */}
              <div className="text-center pt-2 pb-4 border-b border-slate-100">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-950">Official BomaPay Receipt</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Verified Payment Settlement
                </p>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold font-mono text-emerald-700 tracking-tight">
                    +{formatCurrency(selectedReceipt.amount, selectedReceipt.currency)}
                  </span>
                </div>
              </div>

              {/* Receipt Details Breakdown */}
              <div className="py-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contributor</span>
                  <span className="font-bold text-slate-900">
                    {selectedReceipt.is_anonymous ? 'Anonymous Friend' : selectedReceipt.contributor_name}
                  </span>
                </div>

                {activeFundForReceipt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Community Fund</span>
                    <span className="font-bold text-slate-900">{activeFundForReceipt.title}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment Channel</span>
                  <span className="font-semibold uppercase tracking-wider text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                    {selectedReceipt.payment_method}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reference Number</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                    <span>{selectedReceipt.reference}</span>
                    <button
                      type="button"
                      onClick={() => copyReference(selectedReceipt.reference)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedRef === selectedReceipt.reference ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Date &amp; Time</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedReceipt.created_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Escrow Ledger Status</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Booked &amp; Irrevocable
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <PrinterIcon className="w-4 h-4 text-slate-500" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
