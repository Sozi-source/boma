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
        entry.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Activity', 'Amount', 'Description'];
    const rows = entries.map((e) => [
      new Date(e.created_at).toLocaleDateString(),
      e.entry_type === 'credit' ? 'Contribution' : 'Payout',
      e.amount,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${bomaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-activity.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
            Fund activity
          </h3>
          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
            <ShieldCheckIcon className="w-3 h-3 text-emerald-700" />
            Verified
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <DownloadIcon className="w-3 h-3 text-slate-500" />
            <span>Download</span>
          </button>

          {onOpenStatement && (
            <button
              type="button"
              onClick={onOpenStatement}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <PrinterIcon className="w-3 h-3 text-slate-500" />
              <span>Statement</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('credit')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              filterType === 'credit'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Contributions
          </button>
          <button
            type="button"
            onClick={() => setFilterType('debit')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              filterType === 'debit'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Payouts
          </button>
        </div>

        <div className="relative w-full sm:w-56">
          <SearchIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2.5 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Mobile Transaction List View (Screens < 640px) */}
      <div className="mt-3 block sm:hidden divide-y divide-slate-100">
        {filteredEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No activity yet.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isCredit = entry.entry_type === 'credit';
            return (
              <div key={entry.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {isCredit ? (
                      <ArrowDownLeftIcon className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRightIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {entry.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span>{isCredit ? 'Contribution' : 'Payout'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold font-mono ${
                    isCredit ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {isCredit ? '+' : '-'}{formatCurrency(entry.amount, currency)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop & Tablet Table (Screens >= 640px) */}
      <div className="mt-4 hidden sm:block">
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No activity found.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                <th className="py-2.5 px-2">Date</th>
                <th className="py-2.5 px-2">Description</th>
                <th className="py-2.5 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => {
                const isCredit = entry.entry_type === 'credit';
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-2 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-900 max-w-xs truncate text-[11px]">
                      {entry.description}
                    </td>
                    <td className={`py-2 px-2 text-right font-semibold font-mono text-[11px] whitespace-nowrap ${
                      isCredit ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {isCredit ? '+' : '-'}{formatCurrency(entry.amount, currency)}
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
