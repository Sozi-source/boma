'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Boma, Group, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import BomaCover from '@/components/boma-cover';
import ContributionModal from '@/components/contribution-modal';
import ShareModal from '@/components/share-modal';
import {
  ArrowUpRightIcon,
  CreditCardIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
  WhatsAppIcon,
} from '@/components/ui/icons';

export default function DashboardPage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedBomaForModal, setSelectedBomaForModal] = useState<Boma | null>(null);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedBomaForShare, setSelectedBomaForShare] = useState<Boma | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      // Parallel initial fetch: currentUser, group profile, and funds
      const [currentUser, userGroup, ownedBomas] = await Promise.all([
        bomaService.getCurrentUser(),
        bomaService.getMyGroup(),
        bomaService.getMyBomas(),
      ]);

      if (currentUser && currentUser.id !== 'user-guest') setUser(currentUser);
      if (userGroup) setGroup(userGroup);
      setBomas(ownedBomas);

      // Unblock UI immediately so funds display without waiting for all historical transactions
      setLoading(false);

      // Concurrently fetch transactions across all funds in background
      if (ownedBomas.length > 0) {
        const txnArrays = await Promise.all(
          ownedBomas.map((b) => bomaService.getBomaTransactions(b.id))
        );
        const allTxns = txnArrays.flat();
        allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTransactions(allTxns);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalRaised = useMemo(
    () => bomas.reduce((acc, b) => acc + Number(b.current_amount), 0),
    [bomas]
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-full bg-[#f5f7f8]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-8 sm:pt-9 lg:px-10 lg:pt-10">
        
        {/* Top header & organizer status */}
        <div className="mb-3.5 sm:mb-9 lg:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {group?.name ? `${group.name} · Organizer Workspace` : 'Organizer Workspace'}
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-950">
              {firstName} 👋
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/activity"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4 shadow-2xs"
            >
              <DocumentTextIcon className="h-4 w-4 text-slate-500" />
              <span>View Ledger</span>
            </Link>
            <Link
              href="/bomas/create"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white transition hover:bg-emerald-800 sm:text-sm shadow-xs active:scale-98"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add fund</span>
            </Link>
          </div>
        </div>

        {/* Main account / fund hero banner (Clean, uncluttered, professional) */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 lg:p-7 shadow-xs">
          {/* Subtle green-yellow top accent highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9dda50] via-[#aee366] to-[#bbf07a]" />

          {/* Top header row */}
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-emerald-900 shadow-2xs">
                <WalletIcon className="h-3.5 w-3.5 text-emerald-700" />
                <span className="tracking-wide">Group Treasury</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span>Audited Balance</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span>Direct M-Pesa</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowBalance((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 shrink-0"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>

          {/* Core balance display */}
          <div className="relative mt-3 sm:mt-5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Funds Collected</span>
            <div className="mt-1 text-slate-950">
              {loading ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-xl font-extrabold text-slate-400">KES</span>
                  <span className="inline-block h-8 sm:h-11 w-44 sm:w-60 animate-pulse rounded-lg bg-slate-200 align-middle" />
                </div>
              ) : showBalance ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-xl font-extrabold text-slate-400">KES</span>
                  <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.03em] leading-none text-slate-950 whitespace-nowrap tabular-nums">
                    {Number(totalRaised).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-widest leading-none text-slate-950">
                  ••••••••
                </div>
              )}
            </div>
          </div>

          {/* Bottom stats & action rail */}
          <div className="relative mt-4 sm:mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium truncate">
              <span className="truncate">Group: <strong className="text-slate-900">{group?.name || 'Family Support Group'}</strong></span>
              <span className="hidden sm:inline-block h-3 w-px bg-slate-200" />
              <span className="hidden sm:inline">Paystack M-Pesa automated settlement</span>
            </div>

            <Link
              href="/bomas"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95"
            >
              <span>Explore all funds</span>
              <ArrowUpRightIcon className="h-3.5 w-3.5 text-emerald-400" />
            </Link>
          </div>
        </section>

        {/* Metric Quick Stats Strip (Clean 2-to-4 Column Grid Outside Banner) */}
        <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Goals</span>
            <span className="mt-1 block font-mono text-base sm:text-lg font-bold text-slate-900 whitespace-nowrap tabular-nums">
              {loading ? '…' : `${bomas.length} ${bomas.length === 1 ? 'fund' : 'funds'}`}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Audit Receipts</span>
            <span className="mt-1 block font-mono text-base sm:text-lg font-bold text-slate-900 whitespace-nowrap tabular-nums">
              {loading ? '…' : `${transactions.length} verified`}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Contributed</span>
            <span className="mt-1 block font-mono text-base sm:text-lg font-bold text-emerald-800 whitespace-nowrap tabular-nums">
              {loading ? '…' : formatCurrency(totalRaised, 'KES')}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs col-span-2 sm:col-span-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Settlement</span>
            <span className="mt-1 flex items-center gap-1.5 font-sans text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>M-Pesa Till (Verified)</span>
            </span>
          </div>
        </div>

        {/* Primary Section: Group Funds (Uncrowded, Full Content Density) */}
        <section className="mt-6 sm:mt-8 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 lg:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 sm:pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950">Your group funds</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono">
                  {bomas.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Member-visible progress, verified receipts, and direct contributions</p>
            </div>

            <Link
              href="/bomas/create"
              className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-98"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>New Fund</span>
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 shadow-xs animate-pulse">
                <div className="mb-4 h-44 sm:h-52 w-full rounded-2xl bg-slate-200" />
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3.5 w-1/2 bg-slate-200 rounded" />
                  <div className="h-2 w-full bg-slate-200 rounded-full" />
                </div>
              </div>
            </div>
          ) : bomas.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-800">Your group goals will appear here.</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Create your first fund, add the group’s M-Pesa destination, then share its link with members.
              </p>
              <Link
                href="/bomas/create"
                className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <PlusIcon className="h-4 w-4" /> Add fund
              </Link>
            </div>
          ) : (
            <div className={`mt-6 ${bomas.length === 1 ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-5'}`}>
              {bomas.map((b) => {
                const pct = Math.min(100, Math.round((Number(b.current_amount) / Number(b.target_amount || 1)) * 100));

                // If single fund: expansive split view on medium+ screens
                if (bomas.length === 1) {
                  return (
                    <div
                      key={b.id}
                      className="group rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5 lg:p-6 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:bg-white hover:shadow-md flex flex-col md:flex-row md:items-stretch gap-5 lg:gap-6"
                    >
                      {/* Left: Cover thumbnail */}
                      <div className="relative h-44 sm:h-52 md:h-auto md:w-72 lg:w-80 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/70 shadow-2xs">
                        <BomaCover
                          boma={b}
                          className="h-full w-full"
                          imageClassName="h-full w-full object-cover object-[center_28%] transition-transform duration-500 group-hover:scale-[1.02]"
                          sizes="(min-width: 1024px) 30vw, 100vw"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                          <span className="rounded-lg bg-slate-950/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                            {b.category}
                          </span>
                          {b.verified && (
                            <span className="rounded-lg bg-emerald-700/90 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                              <ShieldCheckIcon className="w-3 h-3 text-emerald-200" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        {pct > 0 && (
                          <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-slate-950/80 px-2.5 py-0.5 font-mono text-[11px] font-black text-white backdrop-blur-md shadow-xs">
                            {pct}% funded
                          </div>
                        )}
                      </div>

                      {/* Right: Info & Actions */}
                      <div className="flex-1 flex flex-col justify-between space-y-3.5">
                        <div>
                          <Link href={`/bomas/${b.id}`} className="group/title inline-block">
                            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950 group-hover/title:text-emerald-700 transition-colors">
                              {b.title}
                            </h3>
                          </Link>
                          {b.description && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {b.description}
                            </p>
                          )}
                        </div>

                        {/* Financial Progress Box */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-end justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Raised so far
                              </span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">{b.currency}</span>
                                <span className="font-mono text-xl sm:text-2xl font-black text-slate-950 whitespace-nowrap tabular-nums">
                                  {Number(b.current_amount).toLocaleString('en-KE')}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Target goal
                              </span>
                              <div className="font-mono text-sm sm:text-base font-bold text-slate-700 whitespace-nowrap tabular-nums mt-0.5">
                                {formatCurrency(b.target_amount, b.currency)}
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <div className="flex items-center gap-1.5">
                              <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-700">
                                {b.contributors_count || 0} contributors
                              </span>
                            </div>
                            <span className="font-medium text-slate-400">
                              Direct M-Pesa automated
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {b.is_public ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBomaForModal(b);
                                setIsContributeModalOpen(true);
                              }}
                              className="inline-flex min-h-9 flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 text-xs font-bold text-white shadow-2xs transition-all active:scale-98"
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                              <span>Contribute</span>
                            </button>
                          ) : (
                            <span className="inline-flex min-h-9 flex-1 sm:flex-none items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-600">
                              Private
                            </span>
                          )}

                          <Link
                            href={`/bomas/${b.id}?tab=members`}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                          >
                            <UsersIcon className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Members</span>
                          </Link>

                          {b.is_public && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBomaForShare(b);
                                setIsShareModalOpen(true);
                              }}
                              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100/80 px-3 text-xs font-bold text-emerald-800 shadow-2xs transition-colors"
                              title="Share to WhatsApp"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-700" />
                              <span>Share</span>
                            </button>
                          )}

                          <Link
                            href={`/bomas/${b.id}`}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                          >
                            <span>Details</span>
                            <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                // If multiple funds: grid cards
                return (
                  <div
                    key={b.id}
                    className="group rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:bg-white hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative mb-3.5 h-44 sm:h-48 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200/70 shadow-2xs">
                        <BomaCover
                          boma={b}
                          className="h-full w-full"
                          imageClassName="h-full w-full object-cover object-[center_28%] transition-transform duration-500 group-hover:scale-[1.02]"
                          sizes="(min-width: 768px) 50vw, 100vw"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                          <span className="rounded-lg bg-slate-950/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                            {b.category}
                          </span>
                          {b.verified && (
                            <span className="rounded-lg bg-emerald-700/90 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                              <ShieldCheckIcon className="w-3 h-3 text-emerald-200" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        {pct > 0 && (
                          <div className="absolute bottom-2.5 right-2.5 z-10 rounded-lg bg-slate-950/80 px-2.5 py-0.5 font-mono text-[11px] font-black text-white backdrop-blur-md shadow-xs">
                            {pct}%
                          </div>
                        )}
                      </div>

                      <Link href={`/bomas/${b.id}`} className="group/title inline-block">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 group-hover/title:text-emerald-700 transition-colors line-clamp-1">
                          {b.title}
                        </h3>
                      </Link>

                      {/* Progress box */}
                      <div className="mt-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs space-y-2">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-slate-950 whitespace-nowrap tabular-nums">
                            {formatCurrency(b.current_amount, b.currency)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap tabular-nums">
                            of {formatCurrency(b.target_amount, b.currency)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                      {b.is_public ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBomaForModal(b);
                            setIsContributeModalOpen(true);
                          }}
                          className="inline-flex min-h-8 flex-1 items-center justify-center rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 text-xs font-bold text-white shadow-2xs transition"
                        >
                          <span>Contribute</span>
                        </button>
                      ) : null}

                      <Link
                        href={`/bomas/${b.id}?tab=members`}
                        className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition"
                        title="Members & Pledges"
                      >
                        <UsersIcon className="h-3.5 w-3.5 text-emerald-700" />
                      </Link>

                      {b.is_public && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBomaForShare(b);
                            setIsShareModalOpen(true);
                          }}
                          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 text-xs font-bold text-emerald-800 shadow-2xs transition"
                          title="Share to WhatsApp"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-700" />
                        </button>
                      )}

                      <Link
                        href={`/bomas/${b.id}`}
                        className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition"
                      >
                        <span>Details</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Secondary Section: Live Audit Ledger & Treasury Governance (Balanced 7:5 Split) */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Live Receipts Card (lg:col-span-7) */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <CreditCardIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Recent Receipts</h3>
                  <p className="text-[11px] text-slate-400">Verified member contributions</p>
                </div>
              </div>
              {loading ? (
                <span className="inline-block h-4 w-12 animate-pulse rounded bg-slate-200" />
              ) : (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60 whitespace-nowrap tabular-nums">
                  {transactions.length} total
                </span>
              )}
            </div>

            {/* Transaction list */}
            {loading ? (
              <div className="mt-3 divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between gap-3 animate-pulse">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="h-3.5 w-24 bg-slate-200 rounded" />
                      <div className="h-2.5 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No contributions recorded yet.
              </div>
            ) : (
              <div className="mt-2 divide-y divide-slate-100">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id || t.reference} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {t.contributor_name || 'Member'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="capitalize">{t.payment_method || 'M-Pesa'}</span>
                        <span>•</span>
                        <span className="whitespace-nowrap tabular-nums">{new Date(t.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-emerald-700 whitespace-nowrap tabular-nums">
                        +{formatCurrency(t.amount, t.currency || 'KES')}
                      </span>
                      <span className="block text-[11px] font-semibold text-emerald-600/80">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/activity"
              className="mt-4 block w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 py-2 text-center text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            >
              View all receipts in Central Ledger →
            </Link>
          </div>

          {/* Treasury Governance Card (lg:col-span-5) */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-3 border-b border-slate-100">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
              <span>Group Governance & Security</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              All contributions are automatically booked to the public immutable ledger and settled directly to your registered destination.
            </p>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                <span className="text-slate-500 font-medium">Organizer</span>
                <span className="font-semibold text-slate-900 truncate max-w-[160px]">{user?.name || 'Wilfred Osozi'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                <span className="text-slate-500 font-medium">Destination</span>
                <span className="font-semibold text-slate-900">M-Pesa Till (Verified)</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                <span className="text-slate-500 font-medium">Audit Reconciled</span>
                <span className="font-bold text-emerald-700">100% Automated</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <Link
                href="/admin/ledger"
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                Central Ledger →
              </Link>
              <Link
                href="/admin/subaccounts"
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                Payout Accounts →
              </Link>
            </div>
          </div>

        </div>

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

        {/* WhatsApp Broadcast & QR Share Modal */}
        {selectedBomaForShare && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            boma={selectedBomaForShare}
          />
        )}
      </div>
    </div>
  );
}
