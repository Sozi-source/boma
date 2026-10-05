'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Boma, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import ContributorTracker from '@/components/contributor-tracker';
import BomaCover from '@/components/boma-cover';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BellIcon,
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
  const [viewMode, setViewMode] = useState<'contributors' | 'receipts'>('contributors');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const currentUser = await bomaService.getCurrentUser();
      if (currentUser && currentUser.id !== 'user-guest') setUser(currentUser);

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

    void loadDashboard();
  }, []);

  const totalRaised = useMemo(
    () => bomas.reduce((acc, b) => acc + Number(b.current_amount), 0),
    [bomas]
  );

  const firstName = user?.name?.split(' ')[0] || 'there';
  const balance = showBalance ? formatCurrency(totalRaised, 'KES') : '••••••';

  return (
    <div className="min-h-full bg-[#f5f7f8]">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        {/* Mobile / compact greeting */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Good day</p>
            <h1 className="mt-0.5 text-[20px] font-bold tracking-tight text-slate-950 sm:text-2xl">
              {firstName} 👋
            </h1>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <BellIcon className="h-5 w-5" />
            {transactions.length > 0 && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Main account / fund hero */}
        <section className="relative overflow-hidden rounded-[24px] bg-[#064c41] bg-cover bg-right bg-no-repeat p-5 text-white shadow-[0_18px_45px_rgba(6,78,73,0.22)] sm:p-7">
          <picture className="pointer-events-none absolute inset-0">
            <source
              media="(max-width: 639px)"
              srcSet="/assets/images/dashboard/hero_card_bg_640w_mobile.webp 640w"
              sizes="calc(100vw - 32px)"
            />
            <source
              media="(min-width: 640px)"
              srcSet="/assets/images/dashboard/hero_card_bg_944w_web.webp 944w, /assets/images/dashboard/hero_card_bg_1416w_web-xl.webp 1416w, /assets/images/dashboard/hero_card_bg_1888w_web-2x.webp 1888w"
              sizes="(min-width: 1024px) 944px, calc(100vw - 48px)"
            />
            <img
              src="/assets/images/dashboard/hero_card_bg_640w_mobile.webp"
              alt=""
              className="h-full w-full object-cover object-right"
            />
          </picture>

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                  <WalletIcon className="h-4 w-4" />
                </span>
                Total funds
              </div>
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/15"
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/90">Available across your funds</p>
              <p className="mt-1 text-[34px] font-bold tracking-tight sm:text-[42px]">{balance}</p>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-white/85">Active funds</p>
                <p className="mt-1 text-sm font-semibold">{bomas.length} {bomas.length === 1 ? 'fund' : 'funds'}</p>
              </div>
              <Link
                href="/bomas"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#087f78] shadow-sm transition hover:bg-white/90"
              >
                <ArrowUpRightIcon className="h-4 w-4" />
                Explore funds
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
            <Link href="/dashboard" className="group rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <CreditCardIcon className="h-5 w-5" />
              </span>
              <span className="mt-2 block text-[10px] font-semibold text-slate-700">Activity</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  void navigator.share({ title: 'Boma', text: 'Join my Boma fund.' });
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
            <p className="mt-1 text-[10px] text-slate-400">Across {bomas.length} {bomas.length === 1 ? 'fund' : 'funds'}</p>
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
              <p className="text-sm font-bold text-slate-950">Your funds</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Track every shilling in one place</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {bomas.length} {bomas.length === 1 ? 'fund' : 'funds'}
            </span>
          </div>

          {bomas.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-xs font-semibold text-slate-700">No active funds found.</p>
              <Link href="/bomas" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition">
                <ArrowUpRightIcon className="h-4 w-4" /> Explore community funds
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {bomas.map((b) => {
                const pct = Math.min(100, Math.round((Number(b.current_amount) / Number(b.target_amount || 1)) * 100));
                return (
                  <Link
                    key={b.id}
                    href={`/bomas/${b.id}`}
                    className="block rounded-2xl border border-slate-200 bg-[#fbfcfc] p-4 transition hover:border-emerald-300 hover:bg-emerald-50/20"
                  >
                    <BomaCover
                      boma={b}
                      className="mb-3 h-32 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-40 lg:h-44"
                      sizes="(max-width: 639px) calc(100vw - 64px), (max-width: 1023px) calc(100vw - 96px), 840px"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          {b.category}
                        </span>
                        <h3 className="mt-1 truncate text-sm font-bold text-slate-950">{b.title}</h3>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">{pct}%</span>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm font-bold text-slate-950">{formatCurrency(b.current_amount, b.currency)}</span>
                      <span className="text-[10px] text-slate-400">Goal {formatCurrency(b.target_amount, b.currency)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">Recent activity</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Latest contributions across your funds</p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode((v) => v === 'contributors' ? 'receipts' : 'contributors')}
              className="text-[10px] font-semibold text-emerald-700"
            >
              {viewMode === 'contributors' ? 'View receipts' : 'View contributors'}
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 text-left text-[11px] text-slate-500 sm:p-4">
              <img
                src="/assets/images/dashboard/empty-state/empty_state_240w_mobile-sm.webp"
                srcSet="/assets/images/dashboard/empty-state/empty_state_240w_mobile-sm.webp 240w, /assets/images/dashboard/empty-state/empty_state_360w_mobile.webp 360w, /assets/images/dashboard/empty-state/empty_state_720w_tablet.webp 720w, /assets/images/dashboard/empty-state/empty_state_1080w_web.webp 1080w"
                sizes="72px"
                alt=""
                aria-hidden="true"
                className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                loading="lazy"
                decoding="async"
              />
              No contributions yet. They’ll appear here when received.
            </div>
          ) : viewMode === 'receipts' ? (
            <div className="mt-3 divide-y divide-slate-100">
              {transactions.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">{t.is_anonymous ? 'Anonymous' : t.contributor_name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-700">
                    +{formatCurrency(t.amount, t.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <ContributorTracker transactions={transactions} currency="KES" bomaTitle="Your funds" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
