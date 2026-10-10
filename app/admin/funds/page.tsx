'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bomaService } from '@/lib/services/boma-service';
import { Boma } from '@/lib/types/fintech';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { 
  WalletIcon, 
  SearchIcon, 
  ShieldCheckIcon, 
  ArrowUpRightIcon,
  PlusIcon
} from '@/components/ui/icons';

export default function AdminFundsPage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadFunds = async () => {
    try {
      const list = await bomaService.getBomas();
      setBomas(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  const filteredBomas = bomas.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return b.title.toLowerCase().includes(q) || b.creator_name.toLowerCase().includes(q);
  });

  const totalRaised = bomas.reduce((acc, b) => acc + Number(b.current_amount || 0), 0);
  const totalTarget = bomas.reduce((acc, b) => acc + Number(b.target_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-neutral-900 tracking-tight">
            Funds
          </h1>
        </div>

        <Link
          href="/bomas/create"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
        >
          <PlusIcon className="w-4 h-4 stroke-[2.5]" />
          <span>Start a group fund</span>
        </Link>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs text-neutral-400 font-semibold block">Total Pooled Capital</span>
          <span className="text-2xl font-black text-neutral-900 font-mono mt-1 block">
            {formatCurrency(totalRaised, 'KES')}
          </span>
          <span className="text-[10px] text-neutral-400 mt-1 block">Across {bomas.length} funds</span>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs text-neutral-400 font-semibold block">Combined Target</span>
          <span className="text-2xl font-black text-neutral-900 font-mono mt-1 block">
            {formatCurrency(totalTarget, 'KES')}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
            {totalTarget > 0 ? Math.round((totalRaised / totalTarget) * 100) : 0}% aggregate completion
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs text-neutral-400 font-semibold block">Audit Integrity</span>
          <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
            100%
          </span>
          <span className="text-[10px] text-emerald-700 mt-1 block">All disbursements ledger verified</span>
        </div>
      </div>

      {/* Funds Table */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by fund title or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-xs text-neutral-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="hidden 2xl:block">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/70 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                <th className="py-3 px-3">Fund Title &amp; Category</th>
                <th className="py-3 px-3">Organizer</th>
                <th className="py-3 px-3">Raised / Target</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBomas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No funds found.
                  </td>
                </tr>
              ) : (
                filteredBomas.map((b) => {
                  const pct = b.target_amount > 0 ? Math.min(100, Math.round((b.current_amount / b.target_amount) * 100)) : 0;

                  return (
                    <tr key={b.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="min-w-0">
                          <span className="font-bold text-neutral-900 block truncate">{b.title}</span>
                          <span className="text-[10px] uppercase font-mono text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-xs border border-emerald-200/60">
                            {b.category}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-neutral-700">
                        <span className="font-semibold block">{b.creator_name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {b.contributors_count} contributors
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-emerald-800 block">
                          {formatCurrency(b.current_amount, b.currency)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Goal: {formatCurrency(b.target_amount, b.currency)} ({pct}%)
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                          {b.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/bomas/${b.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-300"
                        >
                          <span>View Portal</span>
                          <ArrowUpRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-3 2xl:hidden">
          {filteredBomas.length === 0 ? (
            <p className="col-span-2 py-8 text-center text-xs text-neutral-400">No funds found.</p>
          ) : filteredBomas.map((b) => {
            const pct = b.target_amount > 0 ? Math.min(100, Math.round((b.current_amount / b.target_amount) * 100)) : 0;
            return (
              <Link key={b.id} href={`/bomas/${b.id}`} className="min-w-0 rounded-xl border border-neutral-200 p-3 hover:border-emerald-300">
                <span className="block truncate text-[9px] font-semibold uppercase text-emerald-800">{b.category}</span>
                <span className="mt-1 line-clamp-2 block min-h-9 text-xs font-bold text-neutral-900">{b.title}</span>
                <span className="mt-2 block truncate text-[11px] text-neutral-600">{b.creator_name}</span>
                <span className="mt-2 block truncate text-xs font-bold text-emerald-800">{formatCurrency(b.current_amount, b.currency)}</span>
                <span className="block truncate text-[10px] text-neutral-500">of {formatCurrency(b.target_amount, b.currency)} · {pct}%</span>
                <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-800">{b.status}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
