'use client';

import React, { useState } from 'react';
import { LedgerEntry, Currency } from '../lib/types/fintech';
import { formatCurrency } from '../lib/ledger/ledger-service';
import { 
  ShieldCheckIcon, 
  SearchIcon, 
  DownloadIcon, 
  ArrowUpRightIcon, 
  ArrowDownLeftIcon,
  PrinterIcon 
} from './ui/icons';

interface TransparentLedgerProps {
  entries: LedgerEntry[];
  currency: Currency;
  bomaTitle: string;
  onOpenStatement?: () => void;
}

export default function TransparentLedger({
  entries,
  currency,
  bomaTitle,
  onOpenStatement,
}: TransparentLedgerProps) {
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter((entry) => {
    if (filterType !== 'all' && entry.entry_type !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        entry.description.toLowerCase().includes(q) ||
        entry.reference_code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Type', 'Amount', 'Currency', 'Balance After', 'Reference Code', 'Description'];
    const rows = entries.map((e) => [
      new Date(e.created_at).toISOString(),
      e.entry_type.toUpperCase(),
      e.amount,
      e.currency,
      e.balance_after,
      e.reference_code,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${bomaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border border-neutral-200/90 bg-white p-3.5 sm:p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
            Public Ledger
          </h3>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheckIcon className="w-3 h-3 text-emerald-600" />
            Verified
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <DownloadIcon className="w-3 h-3" />
            <span>CSV</span>
          </button>

          {onOpenStatement && (
            <button
              type="button"
              onClick={onOpenStatement}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <PrinterIcon className="w-3 h-3 text-emerald-600" />
              <span>Statement</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-white'
                : 'text-neutral-500'
            }`}
          >
            All ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('credit')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              filterType === 'credit'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-neutral-900 dark:text-emerald-400'
                : 'text-neutral-500'
            }`}
          >
            In
          </button>
          <button
            type="button"
            onClick={() => setFilterType('debit')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              filterType === 'debit'
                ? 'bg-white text-amber-700 shadow-xs dark:bg-neutral-900 dark:text-amber-400'
                : 'text-neutral-500'
            }`}
          >
            Out
          </button>
        </div>

        <div className="relative w-full sm:w-56">
          <SearchIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search ref or donor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-7 pr-2.5 py-1 text-[11px] text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      {/* Mobile Transaction List View (Native App Feel on Screens < 640px) */}
      <div className="mt-3 block sm:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
        {filteredEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            No ledger entries.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isCredit = entry.entry_type === 'credit';
            return (
              <div key={entry.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isCredit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60'
                  }`}>
                    {isCredit ? (
                      <ArrowDownLeftIcon className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRightIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {entry.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <span>{new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="font-mono text-[9px]">{entry.reference_code}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-extrabold ${
                    isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {isCredit ? '+' : '-'}{formatCurrency(entry.amount, currency)}
                  </span>
                  <p className="text-[9px] text-neutral-400 font-mono">
                    Bal: {formatCurrency(entry.balance_after, currency)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop & Tablet Table (Screens >= 640px) */}
      <div className="mt-4 hidden sm:block overflow-x-auto">
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No ledger entries found.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 dark:border-neutral-800 font-semibold uppercase tracking-wider text-[9px]">
                <th className="py-2.5 px-2">Date</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Description</th>
                <th className="py-2.5 px-2">Reference</th>
                <th className="py-2.5 px-2 text-right">Amount</th>
                <th className="py-2.5 px-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredEntries.map((entry) => {
                const isCredit = entry.entry_type === 'credit';
                return (
                  <tr key={entry.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                    <td className="py-2 px-2 text-neutral-500 whitespace-nowrap text-[11px]">
                      {new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        isCredit ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {entry.entry_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium text-neutral-900 dark:text-white max-w-xs truncate text-[11px]">
                      {entry.description}
                    </td>
                    <td className="py-2 px-2 font-mono text-[10px] text-neutral-400 whitespace-nowrap">
                      {entry.reference_code}
                    </td>
                    <td className={`py-2 px-2 text-right font-extrabold text-[11px] whitespace-nowrap ${
                      isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {isCredit ? '+' : '-'}{formatCurrency(entry.amount, currency)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {formatCurrency(entry.balance_after, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
