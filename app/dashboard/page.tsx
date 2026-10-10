'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Boma, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import BomaCover from '@/components/boma-cover';
import ContributionModal from '@/components/contribution-modal';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ShareIcon,
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

        {/* Main account / fund hero */}
        <section className="relative overflow-hidden rounded-[24px] bg-[#0A4F43] p-5 text-white shadow-[0_18px_45px_rgba(6,78,73,0.18)] sm:p-7">
          {/* Full-bleed seamless background illustration (no nested card frame) */}
          <Image
            src="/assets/images/funds/savings/pexels-towfiqu-barbhuiya-3440682-9755390.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="pointer-events-none object-cover object-right"
          />

          {/* Gentle soft scrim behind the text on the left; leaves the 3D art on the right 100% bright & vibrant */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-3/5 bg-gradient-to-r from-[#0A4F43] via-[#0A4F43]/50 to-transparent" />

          {/* Foreground content with guaranteed readability */}
          <div className="relative z-10 max-w-md sm:max-w-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-100">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 backdrop-blur-xs">
                  <WalletIcon className="h-4 w-4 text-emerald-200" />
                </span>
                Your group funds
              </div>
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 active:scale-95 backdrop-blur-xs"
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-200/90">
                Recorded in group ledgers
              </p>
              <p className="mt-1 text-[32px] sm:text-[40px] font-bold font-mono tracking-tight tabular-nums drop-shadow-xs">
                {balance}
              </p>
              <p className="mt-1 text-[10px] text-teal-100/80">After Openhand’s 2.5% platform share</p>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] text-teal-200/80">Your active goals</p>
                <p className="mt-0.5 text-sm font-bold font-mono text-white">
                  {bomas.length} {bomas.length === 1 ? 'fund' : 'funds'}
                </p>
              </div>
              <Link
                href="/bomas"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#064c41] shadow-sm transition hover:bg-teal-50 active:scale-98"
              >
                <ArrowUpRightIcon className="h-4 w-4" />
                <span>Explore funds</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-5">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
            <Link href="/bomas" className="text-[11px] font-semibold text-emerald-700">Explore funds</Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <Link href="/bomas" className="group rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ArrowUpRightIcon className="h-5 w-5" />
              </span>
              <span className="mt-2 block text-[10px] font-semibold text-slate-700">Contribute</span>
            </Link>
            <Link href="/activity" className="group rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <CreditCardIcon className="h-5 w-5" />
              </span>
              <span className="mt-2 block text-[10px] font-semibold text-slate-700">Activity</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  const featured = bomas.find((boma) => boma.is_public);
                  const url = featured ? `${window.location.origin}/bomas/${featured.id}` : `${window.location.origin}/bomas`;
                  void navigator.share({
                    title: featured?.title || 'Openhand group goals',
                    text: featured ? `See the goal and follow our progress: ${featured.title}` : 'Explore group goals on Openhand.',
                    url,
                  });
                }
              }}
              className="group rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <ShareIcon className="h-5 w-5" />
              </span>
              <span className="mt-2 block text-[10px] font-semibold text-slate-700">Share</span>
            </button>
          </div>
        </section>

        {/* Overview cards */}
        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Collected</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ArrowDownLeftIcon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-[23px] font-bold tracking-tight text-slate-950">{balance}</p>
              <p className="mt-1 text-[10px] text-slate-400">After Openhand’s 2.5% share</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Contributions</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <CreditCardIcon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-[23px] font-bold tracking-tight text-slate-950">{transactions.length}</p>
            <p className="mt-1 text-[10px] text-slate-400">Across your funds</p>
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
