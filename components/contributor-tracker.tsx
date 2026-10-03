'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Currency, PaymentMethod } from '@/lib/types/fintech';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { 
  UsersIcon, 
  TrendingUpIcon, 
  WalletIcon, 
  SearchIcon, 
  CopyIcon, 
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from './ui/icons';

export interface ContributorGroup {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  is_anonymous: boolean;
  totalAmount: number;
  currency: Currency;
  count: number;
  lastPaymentAt: string;
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
}

interface ContributorTrackerProps {
  transactions: Transaction[];
  targetAmount?: number;
  currency?: Currency;
  bomaTitle?: string;
}

export default function ContributorTracker({
  transactions,
  targetAmount = 0,
  currency = 'KES',
  bomaTitle = 'Fund',
}: ContributorTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'recent' | 'count' | 'name'>('amount');
  const [filterType, setFilterType] = useState<'all' | 'named' | 'anonymous'>('all');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Group transactions by contributor identity
  const contributorGroups = useMemo(() => {
    const map = new Map<string, ContributorGroup>();

    transactions.forEach((tx) => {
      // Key by email, phone, or name (unless anonymous, key by transaction id to preserve separate anonymous entries)
      const key = tx.is_anonymous
        ? `anon-${tx.id || tx.reference}`
        : (tx.contributor_email?.toLowerCase().trim() ||
           tx.contributor_phone?.trim() ||
           tx.contributor_name.toLowerCase().trim() ||
           `unknown-${tx.id}`);

      const existing = map.get(key);
      const paymentMethod = tx.payment_method;

      if (existing) {
        existing.totalAmount += Number(tx.amount);
        existing.count += 1;
        if (new Date(tx.created_at) > new Date(existing.lastPaymentAt)) {
          existing.lastPaymentAt = tx.created_at;
        }
        if (!existing.paymentMethods.includes(paymentMethod)) {
          existing.paymentMethods.push(paymentMethod);
        }
        existing.transactions.push(tx);
      } else {
        map.set(key, {
          key,
          name: tx.is_anonymous ? 'Anonymous Friend' : tx.contributor_name || 'Member',
          email: tx.is_anonymous ? undefined : tx.contributor_email,
          phone: tx.is_anonymous ? undefined : tx.contributor_phone,
          is_anonymous: tx.is_anonymous,
          totalAmount: Number(tx.amount),
          currency: tx.currency || currency,
          count: 1,
          lastPaymentAt: tx.created_at,
          paymentMethods: [paymentMethod],
          transactions: [tx],
        });
      }
    });

    const list = Array.from(map.values());

    // Sort transactions within each group from newest to oldest
    list.forEach((g) => {
      g.transactions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [transactions, currency]);

  // Overall Statistics
  const totalVolume = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [transactions]);

  const uniqueContributorsCount = contributorGroups.length;
  const avgContribution = uniqueContributorsCount > 0 ? totalVolume / uniqueContributorsCount : 0;
  
  const topContributor = useMemo(() => {
    if (contributorGroups.length === 0) return null;
    return [...contributorGroups].sort((a, b) => b.totalAmount - a.totalAmount)[0];
  }, [contributorGroups]);

  // Filtered & Sorted Contributors
  const filteredContributors = useMemo(() => {
    let result = [...contributorGroups];

    // Filter by type
    if (filterType === 'named') {
      result = result.filter((c) => !c.is_anonymous);
    } else if (filterType === 'anonymous') {
      result = result.filter((c) => c.is_anonymous);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.transactions.some((tx) => tx.reference.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
      if (sortBy === 'recent') {
        return new Date(b.lastPaymentAt).getTime() - new Date(a.lastPaymentAt).getTime();
      }
      if (sortBy === 'count') return b.count - a.count;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [contributorGroups, filterType, searchQuery, sortBy]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Export Member Register as CSV
  const handleExportCSV = () => {
    if (contributorGroups.length === 0) return;
    const headers = ['Contributor Name', 'Email', 'Phone', 'Total Contributed (KES)', 'Payments Count', 'Last Payment Date', 'Payment Rails'];
    const rows = contributorGroups.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.email || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.phone || 'N/A').replace(/"/g, '""')}"`,
      c.totalAmount,
      c.count,
      `"${new Date(c.lastPaymentAt).toLocaleDateString()}"`,
      `"${c.paymentMethods.join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${bomaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_contributions_register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-semibold">
            <span>Contributors</span>
            <UsersIcon className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black font-mono text-neutral-900">
            {uniqueContributorsCount}
          </div>
          <span className="text-[9px] text-neutral-400 mt-0.5 block">
            {transactions.length} total payments
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-semibold">
            <span>Total Collected</span>
            <WalletIcon className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black font-mono text-emerald-800 truncate">
            {formatCurrency(totalVolume, currency)}
          </div>
          <span className="text-[9px] text-emerald-700 font-semibold mt-0.5 block">
            100% verified ledger
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-semibold">
            <span>Average / Member</span>
            <TrendingUpIcon className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black font-mono text-neutral-900 truncate">
            {formatCurrency(avgContribution, currency)}
          </div>
          <span className="text-[9px] text-neutral-400 mt-0.5 block">Per contributor</span>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-semibold">
            <span>Top Contribution</span>
            <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1 text-base sm:text-xl font-black font-mono text-amber-900 truncate">
            {topContributor ? formatCurrency(topContributor.totalAmount, currency) : 'KES 0'}
          </div>
          <span className="text-[9px] text-neutral-500 truncate mt-0.5 block font-medium">
            {topContributor ? topContributor.name : 'None yet'}
          </span>
        </div>
      </div>

      {/* 2. Search, Filter, Sort and CSV Export Bar */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by contributor name, phone, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 py-2 pl-8 pr-3 text-xs text-neutral-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'amount' | 'recent' | 'count' | 'name')}
              className="rounded-xl border border-neutral-200 bg-neutral-50 py-2 px-2.5 text-xs font-semibold text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="amount">Highest Amount</option>
              <option value="recent">Most Recent</option>
              <option value="count">Most Payments</option>
              <option value="name">Name (A-Z)</option>
            </select>

            {/* Export CSV Button */}
            {contributorGroups.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-700 transition-colors shadow-2xs"
                title="Download Member Contribution Register as CSV"
              >
                <DocumentTextIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All ({contributorGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('named')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterType === 'named'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Named ({contributorGroups.filter((c) => !c.is_anonymous).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('anonymous')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterType === 'anonymous'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Anonymous ({contributorGroups.filter((c) => c.is_anonymous).length})
          </button>
        </div>
      </div>

      {/* 3. Contributor List */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
            Contributor Register &amp; Payment History
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            {filteredContributors.length} matching
          </span>
        </div>

        {filteredContributors.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-neutral-800">No contributions found</h4>
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
              {searchQuery
                ? 'No contributors matched your search criteria.'
                : 'When members make contributions, their payment history and totals will track here live.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredContributors.map((c, index) => {
              const isExpanded = expandedKeys.has(c.key);
              const percentageOfTotal = totalVolume > 0 ? Math.round((c.totalAmount / totalVolume) * 100) : 0;
              const isTop = index === 0 && sortBy === 'amount' && c.totalAmount > 0;

              return (
                <div key={c.key} className="p-3.5 sm:p-4 hover:bg-neutral-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    {/* Contributor Avatar & Name Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs ${
                        c.is_anonymous
                          ? 'bg-neutral-200 text-neutral-600'
                          : isTop
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white ring-2 ring-amber-300/60'
                          : 'bg-emerald-700 text-white'
                      }`}>
                        {c.is_anonymous ? '?' : c.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                            {c.name}
                          </span>
                          {isTop && (
                            <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 font-mono">
                              ⭐ Top Contributor
                            </span>
                          )}
                          {c.count > 1 && (
                            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 font-mono">
                              {c.count} Payments
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                          {c.email && <span className="truncate max-w-[140px] sm:max-w-none">{c.email}</span>}
                          {c.email && c.phone && <span>•</span>}
                          {c.phone && <span>{c.phone}</span>}
                          {(c.email || c.phone) && <span>•</span>}
                          <span>Last: {new Date(c.lastPaymentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contributor Amount & Expand Action */}
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black font-mono text-emerald-800 block">
                        {formatCurrency(c.totalAmount, c.currency)}
                      </span>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {percentageOfTotal}% of pool
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleExpand(c.key)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 ml-1 underline decoration-emerald-300 underline-offset-2"
                        >
                          {isExpanded ? 'Hide' : `Payments (${c.count})`}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Micro Progress Bar of this Contributor's Share */}
                  {targetAmount > 0 && (
                    <div className="mt-2.5 h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((c.totalAmount / targetAmount) * 100))}%` }}
                      />
                    </div>
                  )}

                  {/* Expanded Payment History Ledger for this Contributor */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3 border-t border-dashed border-neutral-200 space-y-2 animate-in fade-in duration-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                        Individual Payment Receipts ({c.transactions.length})
                      </span>
                      
                      <div className="space-y-1.5">
                        {c.transactions.map((tx) => (
                          <div
                            key={tx.id || tx.reference}
                            className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-2.5 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-emerald-700 font-bold text-xs shrink-0">
                                +{formatCurrency(tx.amount, tx.currency)}
                              </span>
                              <span className="text-[10px] rounded-md bg-white border border-neutral-200 px-1.5 py-0.2 uppercase font-mono font-bold text-neutral-600 shrink-0">
                                {tx.payment_method}
                              </span>
                              <span className="text-[10px] text-neutral-400 shrink-0">
                                {new Date(tx.created_at).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono text-[10px] text-neutral-500 truncate max-w-[120px] sm:max-w-none">
                                {tx.reference}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(tx.reference)}
                                className="p-1 hover:text-emerald-700 text-neutral-400"
                                title="Copy Reference"
                              >
                                <CopyIcon className="w-3 h-3" />
                              </button>
                              {copiedRef === tx.reference && (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  Copied
                                </span>
                              )}
                              <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-bold">
                                PAID
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
