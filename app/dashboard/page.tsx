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
      const currentUser = await bomaService.getCurrentUser();
      if (currentUser && currentUser.id !== 'user-guest') setUser(currentUser);

      const userGroup = await bomaService.getMyGroup();
      if (userGroup) setGroup(userGroup);

      const ownedBomas = await bomaService.getMyBomas();
      setBomas(ownedBomas);

      const allTxns: Transaction[] = [];
      for (const b of ownedBomas) {
        const txns = await bomaService.getBomaTransactions(b.id);
        allTxns.push(...txns);
      }
      allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTxns);
    } finally {
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

        {/* Main account / fund hero banner (Narrow & sleek on mobile, enterprise on desktop) */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-6 lg:p-8 shadow-xs">
          {/* Subtle green-yellow top accent highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9dda50] via-[#aee366] to-[#bbf07a]" />

          {/* Soft ambient corner glow in green-yellow */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#aee366]/15 blur-3xl" />

          {/* Top header row */}
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d2eda0] bg-[#f4fae6] px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-[#1c451f] shadow-2xs">
                <WalletIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#52891f]" />
                <span className="tracking-wide">Group Treasury</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#9dda50] ring-2 ring-[#aee366]/30" />
                <span>Audited</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span>Direct M-Pesa</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowBalance((v) => !v)}
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 shrink-0"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeSlashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </button>
          </div>

          {/* Core balance display + Desktop enterprise stat blocks */}
          <div className="relative mt-2.5 sm:mt-5 lg:mt-6 lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div className="text-slate-950">
              {loading ? (
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-400">KES</span>
                  <span className="inline-block h-8 sm:h-11 lg:h-14 w-40 sm:w-56 animate-pulse rounded-lg bg-slate-200 align-middle" />
                </div>
              ) : showBalance ? (
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-400">KES</span>
                  <span className="font-mono text-2xl sm:text-4xl lg:text-6xl font-black tracking-[-0.03em] leading-none text-slate-950 whitespace-nowrap tabular-nums">
                    {Number(totalRaised).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black tracking-widest leading-none text-slate-950">
                  ••••••••
                </div>
              )}
            </div>

            {/* Big-screen enterprise metric pills (Hidden on mobile to keep narrow banner) */}
            <div className="hidden lg:flex items-center gap-2.5 sm:gap-3 text-xs">
              <div className="rounded-xl border border-[#d2eda0] bg-[#f7fcee] px-3.5 py-2 font-medium text-[#1c451f] shadow-2xs">
                <span className="block text-[11px] uppercase font-bold text-[#446b1d]">Active Goals</span>
                {loading ? (
                  <span className="mt-0.5 inline-block h-4 w-14 animate-pulse rounded bg-slate-200" />
                ) : (
                  <span className="font-bold text-slate-950 font-mono text-sm whitespace-nowrap tabular-nums">{bomas.length} {bomas.length === 1 ? 'fund' : 'funds'}</span>
                )}
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2 font-medium text-slate-700 shadow-2xs">
                <span className="block text-[11px] uppercase font-bold text-slate-400">Audit Receipts</span>
                {loading ? (
                  <span className="mt-0.5 inline-block h-4 w-16 animate-pulse rounded bg-slate-200" />
                ) : (
                  <span className="font-bold text-slate-950 font-mono text-sm whitespace-nowrap tabular-nums">{transactions.length} verified</span>
                )}
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2 font-medium text-slate-700 shadow-2xs">
                <span className="block text-[11px] uppercase font-bold text-slate-400">Settlement</span>
                <span className="font-bold text-slate-950 text-sm flex items-center gap-1.5 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9dda50]" />
                  M-Pesa Till
                </span>
              </div>
            </div>
          </div>

          {/* Bottom stats & action rail (Slim & compact on mobile) */}
          <div className="relative mt-3 sm:mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 sm:pt-4 text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium truncate">
              <span className="truncate">Group: <strong className="text-slate-900">{group?.name || 'Family Support Group'}</strong></span>
              <span className="hidden sm:inline-block h-3 w-px bg-slate-200" />
              <span className="hidden sm:inline">Paystack M-Pesa automated</span>
            </div>

            <Link
              href="/bomas"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg sm:rounded-xl bg-[#0b1e16] hover:bg-[#15382a] px-2.5 py-1 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-2xs transition active:scale-95"
            >
              <span>Explore</span>
              <ArrowUpRightIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#aee366]" />
            </Link>
          </div>
        </section>

        {/* Enterprise Dashboard Grid (Main Funds + Live Audit Ledger Sidebar) */}
        <div className="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column: Group Funds */}
          <div className="lg:col-span-8">
            <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 lg:p-8 shadow-xs">
              <div className="pb-4 sm:pb-5 border-b border-slate-100">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950">Your group funds</h2>
                <p className="mt-0.5 text-xs text-slate-500">Member-visible progress, verified receipts, and direct contributions</p>
              </div>

              {loading ? (
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 sm:p-6 lg:p-7 shadow-xs animate-pulse">
                    <div className="mb-4 sm:mb-6 h-44 sm:h-72 md:h-80 lg:h-88 w-full rounded-2xl bg-slate-200" />
                    <div className="space-y-4">
                      <div className="h-6 w-3/4 bg-slate-200 rounded" />
                      <div className="h-4 w-1/2 bg-slate-200 rounded" />
                      <div className="h-2 w-full bg-slate-200 rounded-full" />
                      <div className="flex gap-3 pt-2">
                        <div className="h-11 flex-1 bg-slate-200 rounded-xl" />
                        <div className="h-11 w-36 bg-slate-200 rounded-xl" />
                      </div>
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
                <div className="mt-6 space-y-6">
                  {bomas.map((b) => {
                    const pct = Math.min(100, Math.round((Number(b.current_amount) / Number(b.target_amount || 1)) * 100));
                    return (
                      <div
                        key={b.id}
                        className="group rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 sm:p-6 lg:p-7 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                      >
                        {/* Rectangular cover image on mobile (h-44), spacious on desktop (sm:h-72 md:h-80 lg:h-88) */}
                        <div className="relative mb-4 sm:mb-6 h-44 sm:h-72 md:h-80 lg:h-88 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/70 shadow-2xs">
                          <BomaCover
                            boma={b}
                            className="h-full w-full"
                            imageClassName="h-full w-full object-cover object-[center_28%] transition-transform duration-500 group-hover:scale-[1.02]"
                            sizes="(min-width: 1024px) 65vw, 100vw"
                          />
                          {/* Image floating badges */}
                          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
                            <span className="rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                              {b.category}
                            </span>
                            {b.verified && (
                              <span className="rounded-lg bg-emerald-700/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                          {pct > 0 && (
                            <div className="absolute bottom-3.5 right-3.5 z-10 rounded-lg bg-slate-950/80 px-3 py-1 font-mono text-xs font-black text-white backdrop-blur-md shadow-xs">
                              {pct}% funded
                            </div>
                          )}
                        </div>

                        {/* Fund Details */}
                        <div className="space-y-4">
                          <div>
                            <Link href={`/bomas/${b.id}`} className="group/title inline-block">
                              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 group-hover/title:text-emerald-700 transition-colors">
                                {b.title}
                              </h3>
                            </Link>
                            {b.description && (
                              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-2xl">
                                {b.description}
                              </p>
                            )}
                          </div>

                          {/* Financial Progress Box */}
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  Raised so far
                                </span>
                                <div className="mt-0.5 flex items-baseline gap-1.5">
                                  <span className="text-sm font-bold text-slate-500">{b.currency}</span>
                                  <span className="font-mono text-2xl sm:text-3xl font-black text-slate-950">
                                    {Number(b.current_amount).toLocaleString('en-KE')}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  Target goal
                                </span>
                                <div className="mt-0.5 font-mono text-base sm:text-lg font-bold text-slate-700">
                                  {formatCurrency(b.target_amount, b.currency)}
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                                style={{ width: `${Math.max(2, pct)}%` }}
                              />
                            </div>

                            {/* Meta row */}
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-semibold text-slate-700">
                                  {b.contributors_count || 7} contributors
                                </span>
                              </div>
                              <span className="font-medium text-slate-500">
                                Direct M-Pesa automated records
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-2">
                            {b.is_public ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBomaForModal(b);
                                  setIsContributeModalOpen(true);
                                }}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 text-xs font-bold text-white shadow-sm transition-all active:scale-98"
                              >
                                <PlusIcon className="h-4 w-4" />
                                <span>Contribute</span>
                              </button>
                            ) : (
                              <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-600">
                                Private · only you can view
                              </span>
                            )}
                            <Link
                              href={`/bomas/${b.id}?tab=members`}
                              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                            >
                              <UsersIcon className="h-4 w-4 text-emerald-700" />
                              <span>Members</span>
                            </Link>
                            {b.is_public && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBomaForShare(b);
                                  setIsShareModalOpen(true);
                                }}
                                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100/80 px-3.5 text-xs font-bold text-emerald-800 shadow-2xs transition-colors"
                                title="Share to WhatsApp"
                              >
                                <WhatsAppIcon className="h-4 w-4 text-emerald-700" />
                                <span>Share</span>
                              </button>
                            )}
                            <Link
                              href={`/bomas/${b.id}`}
                              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                            >
                              <span>Details &amp; Ledger</span>
                              <ArrowUpRightIcon className="h-4 w-4 text-slate-400" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar / Right Column: Live Audit Ledger & Governance */}
          <div className="lg:col-span-4 space-y-6 sm:space-y-8">
            
            {/* Live Receipts Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    <CreditCardIcon className="h-4.5 w-4.5" />
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
                    <div key={i} className="py-3 flex items-center justify-between gap-3 animate-pulse">
                      <div className="space-y-1.5 flex-1 min-w-0">
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
                <div className="mt-3 divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id || t.reference} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {t.contributor_name || 'Member'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="capitalize">{t.payment_method || 'M-Pesa'}</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
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
                className="mt-4 block w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 py-2.5 text-center text-xs font-bold text-slate-700 transition-colors shadow-2xs"
              >
                View all {transactions.length} receipts in ledger →
              </Link>
            </div>

            {/* Treasury Governance Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                <span>Group Governance & Security</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                All contributions are automatically booked to the public immutable ledger and settled directly to your registered destination.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                  <span className="text-slate-500 font-medium">Organizer</span>
                  <span className="font-semibold text-slate-900">{user?.name || 'Wilfred Osozi'}</span>
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
