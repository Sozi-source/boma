'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Boma, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import BomaCover from '@/components/boma-cover';
import ContributionModal from '@/components/contribution-modal';
import {
  ArrowUpRightIcon,
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  WalletIcon,
} from '@/components/ui/icons';

export default function DashboardPage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedBomaForModal, setSelectedBomaForModal] = useState<Boma | null>(null);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    const currentUser = await bomaService.getCurrentUser();
    if (currentUser && currentUser.id !== 'user-guest') setUser(currentUser);

    const ownedBomas = await bomaService.getMyBomas();
    setBomas(ownedBomas);

    const allTxns: Transaction[] = [];
    for (const b of ownedBomas) {
      const txns = await bomaService.getBomaTransactions(b.id);
      allTxns.push(...txns);
    }
    allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setTransactions(allTxns);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalRaised = useMemo(
    () => bomas.reduce((acc, b) => acc + Number(b.current_amount), 0),
    [bomas]
  );

  const firstName = user?.name?.split(' ')[0] || 'there';
  const balance = showBalance ? formatCurrency(totalRaised, 'KES') : '••••••';

  return (
    <div className="min-h-full bg-[#f5f7f8]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-5 sm:px-8 sm:pt-8 lg:px-10">
        {/* Mobile / compact greeting */}
          <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Good day</p>
            <h1 className="mt-0.5 text-[20px] font-bold tracking-tight text-slate-950 sm:text-2xl">
              {firstName} 👋
            </h1>
          </div>
          <Link href="/bomas/create" className="inline-flex min-h-10 items-center rounded-xl bg-emerald-700 px-3.5 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:px-4 sm:text-sm">Start a group fund</Link>
        </div>

        {/* Main account / fund hero banner */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#9dda50] bg-[#aee366] p-4 sm:p-5.5 shadow-xs ring-1 ring-black/5">
          {/* Top header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b1e16] px-2.5 py-1 text-[11px] font-bold text-[#aee366] shadow-2xs shrink-0">
                <WalletIcon className="h-3 w-3 text-[#aee366]" />
                <span className="tracking-wide">Group Treasury</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-[#16382b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16382b]" />
                <span>Audited</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowBalance((v) => !v)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#0b1e16] shadow-2xs transition hover:bg-white active:scale-95 shrink-0"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Core balance display */}
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1c4232]">
              Recorded in group ledgers
            </p>
            <div className="mt-1 text-[#0b1e16]">
              {showBalance ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-xl font-extrabold text-[#16382b]">KES</span>
                  <span className="font-mono text-[28px] sm:text-[38px] font-black tracking-[-0.03em] leading-none text-[#0b1e16]">
                    {Number(totalRaised).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="font-mono text-[26px] sm:text-[34px] font-black tracking-widest leading-none text-[#0b1e16]">
                  ••••••••
                </div>
              )}
            </div>
          </div>

          {/* Bottom stats & action rail */}
          <div className="mt-3.5 sm:mt-4 flex items-center justify-between border-t border-black/10 pt-2.5 sm:pt-3">
            <div className="flex items-center gap-2.5 sm:gap-4 text-[11px]">
              <div>
                <span className="font-medium text-[#204a37]">Active: </span>
                <span className="font-mono font-bold text-[#0b1e16]">
                  {bomas.length} {bomas.length === 1 ? 'fund' : 'funds'}
                </span>
              </div>
              <span className="h-3 w-px bg-black/15" />
              <span className="font-medium text-[#204a37] text-[10px] sm:text-[11px]">Direct M-Pesa</span>
            </div>

            <Link
              href="/bomas"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b1e16] px-3 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-2xs transition hover:bg-[#15382a] active:scale-95"
            >
              <span>Explore</span>
              <ArrowUpRightIcon className="h-3 w-3 text-[#aee366]" />
            </Link>
          </div>
        </section>



        {/* Funds */}
        <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">Your group funds</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Member-visible progress and contribution records</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {bomas.length} {bomas.length === 1 ? 'fund' : 'funds'}
            </span>
          </div>

          {bomas.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-800">Your group goals will appear here.</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">Create your first fund, add the group’s M-Pesa destination, then share its link with members.</p>
              <Link href="/bomas/create" className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800">
                <PlusIcon className="h-4 w-4" /> Start a group fund
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {bomas.map((b) => {
                const pct = Math.min(100, Math.round((Number(b.current_amount) / Number(b.target_amount || 1)) * 100));
                return (
                  <div
                    key={b.id}
                    className="block rounded-2xl border border-slate-200 bg-[#fbfcfc] p-4 sm:p-5 shadow-xs transition hover:border-emerald-300"
                  >
                    <BomaCover
                      boma={b}
                      className="mb-4 h-44 sm:h-52 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-2xs"
                      imageClassName="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-102"
                      sizes="(max-width: 639px) calc(100vw - 64px), (max-width: 1023px) calc(100vw - 96px), 840px"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                          {b.category}
                        </span>
                        <Link href={`/bomas/${b.id}`} className="block group">
                          <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-950 group-hover:text-emerald-800 transition-colors">{b.title}</h3>
                        </Link>
                        {b.description && (
                          <p className="mt-1 text-xs text-slate-600 line-clamp-2">{b.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{pct}%</span>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-3">
                      <span className="font-mono text-base sm:text-lg font-bold text-slate-950">{formatCurrency(b.current_amount, b.currency)}</span>
                      <span className="text-xs text-slate-500 font-medium">Goal {formatCurrency(b.target_amount, b.currency)}</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400" style={{ width: `${pct}%` }} />
                    </div>

                    {/* Action buttons directly on card */}
                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                      {b.is_public ? <button
                        type="button"
                        onClick={() => {
                          setSelectedBomaForModal(b);
                          setIsContributeModalOpen(true);
                        }}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        <span>Contribute</span>
                      </button> : <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-600">Private · only you can view</span>}
                      <Link
                        href={`/bomas/${b.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                      >
                        <span>Details</span>
                        <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Public Audit Teaser linking directly to dedicated Activity */}
        <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <CreditCardIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">Transparent Community Ledger</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Track every transaction.
              </p>
            </div>
          </div>
          <Link
            href="/activity"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 px-4 py-2 text-xs font-semibold text-emerald-800 transition-colors shrink-0"
          >
            <span>View All Receipts ({transactions.length})</span>
            <span>→</span>
          </Link>
        </section>

        {/* Live Contribution Modal (Paystack M-Pesa split payment) */}
        {selectedBomaForModal && (
          <ContributionModal
            isOpen={isContributeModalOpen}
            onClose={() => setIsContributeModalOpen(false)}
            boma={selectedBomaForModal}
            onSuccess={() => {
              void loadDashboard();
            }}
          />
        )}
      </div>
    </div>
  );
}
