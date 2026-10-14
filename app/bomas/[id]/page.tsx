'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Boma, Account, LedgerEntry, Disbursement, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import ContributionModal from '@/components/contribution-modal';
import ContributorTracker from '@/components/contributor-tracker';
import MemberRoster from '@/components/member-roster';
import ShareModal from '@/components/share-modal';
import BomaCover from '@/components/boma-cover';
import { 
  ShieldCheckIcon, 
  UsersIcon, 
  ShareIcon,
  WhatsAppIcon,
} from '@/components/ui/icons';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BomaDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const bomaId = resolvedParams.id;

  const [boma, setBoma] = useState<Boma | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'story' | 'members' | 'contributors'>('story');
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [paymentNotice, setPaymentNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilityError, setVisibilityError] = useState('');

  const changeVisibility = async () => {
    if (!boma || currentUserId !== boma.creator_id || visibilitySaving) return;
    setVisibilitySaving(true);
    setVisibilityError('');
    const result = await bomaService.updateBomaVisibility(boma.id, !boma.is_public);
    if (result.success) setBoma({ ...boma, is_public: !boma.is_public });
    else setVisibilityError(result.error || 'Could not update group visibility.');
    setVisibilitySaving(false);
  };

  // Reloads data in place (no spinner) so open tabs keep their state.
  const loadBomaData = async () => {
    const result = await bomaService.getBomaById(bomaId);
    if (result) {
      setBoma(result.boma);
      setAccount(result.account);
      const [entries, disbs, txns] = await Promise.all([
        bomaService.getBomaLedger(bomaId),
        bomaService.getBomaDisbursements(bomaId),
        bomaService.getBomaTransactions(bomaId),
      ]);
      setLedgerEntries(entries);
      setDisbursements(disbs);
      setTransactions(txns);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const currentUser = await bomaService.getCurrentUser();
      if (currentUser && currentUser.id !== 'user-guest') setCurrentUserId(currentUser.id);
      // Returning from Paystack checkout: verify, then book the ledger once.
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || urlParams.get('trxref');
      let verifiedPayment = false;
      if (reference && urlParams.get('paystack') === 'true') {
        try {
          const res = await fetch('/api/payments/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference }),
          });
          if (!res.ok) throw new Error('Payment could not be confirmed');
          verifiedPayment = true;
          setPaymentNotice({ ok: true, text: 'Your contribution was received. Thank you!' });
        } catch {
          setPaymentNotice({
            ok: false,
            text: 'We couldn\'t confirm your payment. Please check again shortly.',
          });
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
      // If we just settled a payment, wait briefly so the DB write propagates
      // before re-fetching — otherwise we race the settle_paystack_payment RPC
      // and read stale balance/transaction data.
      if (verifiedPayment) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      const tabParam = urlParams.get('tab');
      if (tabParam === 'members' || tabParam === 'contributors' || tabParam === 'story') {
        setActiveTab(tabParam);
      }

      await loadBomaData();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bomaId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs text-neutral-400">Loading fund...</p>
      </div>
    );
  }

  if (!boma || !account) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-neutral-900 ">Contribution Not Found</h2>
        <Link
          href="/bomas"
          className="mt-4 inline-flex rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white"
        >
          Back to Contributions
        </Link>
      </div>
    );
  }

  const percentage = Math.min(100, Math.round((boma.current_amount / boma.target_amount) * 100));
  const isFundOrganizer = Boolean(
    currentUserId && currentUserId !== 'user-guest'
  );
  const isOngoing = !boma.deadline || new Date(boma.deadline).getFullYear() >= 2050;
  const daysLeft = isOngoing
    ? null
    : Math.max(
        0,
        Math.ceil((new Date(boma.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

  return (
    <div className="w-full min-w-0 px-3.5 sm:px-8 lg:px-10 xl:px-12 py-3.5 sm:py-8">
      <div className="w-full max-w-7xl space-y-4 sm:space-y-6">
      
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/bomas" className="hover:text-emerald-700 font-medium transition-colors">← Funds</Link>
          <span className="text-slate-300">/</span>
          <span className="capitalize font-mono text-slate-600 truncate max-w-[140px] sm:max-w-none">{boma.category}</span>
        </div>

        {boma.is_public && <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ShareIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>Share</span>
        </button>}
      </div>

      {/* Payment Confirmation / Alert Banner */}
      {paymentNotice && (
        <div
          className={`rounded-lg p-3 text-xs font-semibold flex items-center justify-between shadow-2xs ${
            paymentNotice.ok
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{paymentNotice.text}</span>
          <button
            type="button"
            onClick={() => setPaymentNotice(null)}
            className="text-xs px-1.5 py-0.5 opacity-75 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Content, Hero, Tabs) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cover Media */}
          <div className="relative h-48 sm:h-64 lg:h-72 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-xs">
            <BomaCover
              boma={boma}
              className="h-full w-full"
              imageClassName="h-full w-full object-cover object-center"
              sizes="(min-width: 1024px) 66vw, 100vw"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
              <span className="rounded-md bg-slate-900/80 text-white px-2.5 py-1 text-[11px] font-semibold uppercase backdrop-blur-xs">
                {boma.category}
              </span>
              {boma.verified && (
                <span className="rounded-md bg-amber-500/90 text-amber-950 font-bold px-2.5 py-1 text-[11px] backdrop-blur-xs flex items-center gap-1 shadow-xs">
                  <ShieldCheckIcon className="w-3 h-3 text-amber-950" />
                  Verified Fund
                </span>
              )}
            </div>
          </div>

          {/* Title & Organizer Info */}
          <div className="pb-3 border-b border-slate-200/80">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight leading-snug">
              {boma.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Organized by <strong className="text-slate-700 font-semibold">{boma.creator_name}</strong>
            </p>
          </div>

          {isFundOrganizer && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="visibility-title">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="visibility-title" className="text-sm font-semibold text-slate-900">Group visibility: {boma.is_public ? 'Public' : 'Private'}</h2>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                    {boma.is_public
                      ? 'Anyone can find this group, view its progress and contribution record, and contribute.'
                      : 'Only you can view this group. It will not appear in Explore and contributions are paused until you publish it.'}
                  </p>
                  {visibilityError && <p role="alert" className="mt-2 text-xs text-rose-700">{visibilityError}</p>}
                </div>
                <button type="button" onClick={changeVisibility} disabled={visibilitySaving} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                  {visibilitySaving ? 'Saving…' : boma.is_public ? 'Make group private' : 'Publish group'}
                </button>
              </div>
            </section>
          )}

          {/* Mobile-Only Progress & Live Activity Strip */}
          <div className="block lg:hidden rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-xl font-bold font-mono text-slate-900 whitespace-nowrap tabular-nums">
                {formatCurrency(boma.current_amount, boma.currency)}
              </span>
              <span className="text-slate-500 font-medium text-xs font-mono whitespace-nowrap tabular-nums">
                {percentage}% of {formatCurrency(boma.target_amount, boma.currency)}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('contributors')}
                className="hover:text-emerald-700 font-semibold transition-colors text-left whitespace-nowrap"
              >
                {boma.contributors_count || transactions.length} contributors →
              </button>
              <span className="whitespace-nowrap">{isOngoing ? 'Monthly contribution' : `${daysLeft} days remaining`}</span>
            </div>

            {/* Mobile Latest Contribution Summary */}
            {transactions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-700">Latest contribution:</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                  <span className="font-medium text-slate-800 truncate">
                    {transactions[0].is_anonymous ? 'Anonymous Friend' : (transactions[0].contributor_name || 'Member')}
                  </span>
                  <span className="font-mono font-bold text-emerald-700 whitespace-nowrap tabular-nums">
                    +{formatCurrency(transactions[0].amount, transactions[0].currency || boma.currency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex flex-wrap gap-x-6">
              <button
                type="button"
                onClick={() => setActiveTab('story')}
                className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'story'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                About this Fund
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'members'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UsersIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Members &amp; Pledges</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contributors')}
                className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'contributors'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Contributions</span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-mono">
                  {transactions.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Contents */}
          {activeTab === 'story' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <p className="whitespace-pre-line text-xs sm:text-sm text-slate-600 leading-relaxed">
                {boma.description}
              </p>
            </div>
          )}

          {activeTab === 'members' && (
            <MemberRoster
              bomaId={boma.id}
              bomaTitle={boma.title}
              currency={boma.currency}
              transactions={transactions}
              isOrganizer={isFundOrganizer}
              onContributeWithPhone={(_phone) => {
                setIsContributeModalOpen(true);
              }}
            />
          )}

          {activeTab === 'contributors' && (
            <ContributorTracker
              transactions={transactions}
              targetAmount={boma.target_amount}
              currency={boma.currency}
              bomaTitle={boma.title}
            />
          )}

          {/* Discreet link to Admin for administrators and organizers */}
          {isFundOrganizer && <div className="pt-2 text-center">
            <Link
              href="/admin"
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Organizer &amp; Admin Dashboard →
            </Link>
          </div>}
        </div>

        {/* Right Column (Financial Progress & Contribute Card - Desktop Sticky) */}
        <div className="space-y-4">
          <div className="hidden lg:block sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            {/* Amount Stats */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Collected of {formatCurrency(boma.target_amount, boma.currency)}
              </span>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 whitespace-nowrap tabular-nums">
                {formatCurrency(boma.current_amount, boma.currency)}
              </div>

              {/* Progress Bar with Milestone Markers */}
              <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="mt-1.5 flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono">
                <span className="font-semibold text-emerald-800 whitespace-nowrap tabular-nums">{percentage}% reached</span>
                <span className="whitespace-nowrap">{isOngoing ? 'Monthly contribution' : (daysLeft ?? 0) > 0 ? `${daysLeft} days left` : 'Ended'}</span>
              </div>
            </div>

            {/* Quick Contributors count */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              {boma.is_public && <button
                type="button"
                onClick={() => setActiveTab('contributors')}
                className="flex items-center gap-1.5 text-left hover:text-emerald-700 transition-colors"
              >
                <UsersIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold font-mono text-slate-900 whitespace-nowrap tabular-nums">
                  {transactions.length}
                </span>
                <span className="text-slate-500 whitespace-nowrap">contributions →</span>
              </button>}

              {boma.is_public && <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ShareIcon className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>}
            </div>

            {/* Contribute & Share Actions */}
            <div className="pt-1 space-y-2">
              {boma.is_public && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsContributeModalOpen(true)}
                    className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-bold text-white shadow-2xs transition-all active:scale-98"
                  >
                    Contribute
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100/80 py-2.5 text-xs font-bold text-emerald-800 transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-700" />
                    <span>Share on WhatsApp</span>
                  </button>
                </>
              )}
              {isFundOrganizer && (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-relaxed text-emerald-900">
                  {boma.is_public ? "The group's share settles directly to its verified Paystack M-Pesa destination." : 'Publish this group when you are ready to accept contributions.'}
                </p>
              )}
            </div>
          </div>

          {/* Live Activity Feed Card (Desktop) */}
          <div className="hidden lg:block rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Activity</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-full px-2 py-0.5 whitespace-nowrap tabular-nums">
                {transactions.length} verified
              </span>
            </div>

            {transactions.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-500">
                No contributions yet. Be the first to contribute!
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 4).map((tx) => (
                  <div key={tx.id || tx.reference} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {tx.is_anonymous ? 'Anonymous Friend' : (tx.contributor_name || 'Member')}
                      </p>
                      <p className="text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-emerald-700 whitespace-nowrap tabular-nums">
                        +{formatCurrency(tx.amount, tx.currency || boma.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('contributors')}
              className="w-full pt-1 text-center text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View full ledger →
            </button>
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Action Bar (Above Mobile Nav) */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 md:hidden bg-white/95 border-t border-slate-200 p-2.5 px-4 flex items-center gap-2.5 backdrop-blur-md shadow-lg">
        {isFundOrganizer && !boma.is_public ? (
          <button type="button" onClick={changeVisibility} disabled={visibilitySaving} className="flex-1 rounded-lg bg-emerald-700 py-3 text-xs font-bold text-white disabled:opacity-60">
            {visibilitySaving ? 'Saving…' : 'Publish group to accept contributions'}
          </button>
        ) : boma.is_public ? <button
          type="button"
          onClick={() => setIsContributeModalOpen(true)}
          className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-2xs transition-colors"
        >
          Contribute
        </button> : null}

        {boma.is_public && (
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shrink-0 shadow-2xs"
            aria-label="Share on WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 text-emerald-700" />
            <span>Share</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <ContributionModal
        boma={boma}
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        onSuccess={() => { void loadBomaData(); }}
      />

      <ShareModal
        boma={boma}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      </div>
    </div>
  );
}
