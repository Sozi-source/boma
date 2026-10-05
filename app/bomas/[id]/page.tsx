'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Boma, Account, LedgerEntry, Disbursement, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import ContributionModal from '@/components/contribution-modal';
import ContributorTracker from '@/components/contributor-tracker';
import ShareModal from '@/components/share-modal';
import DisbursementModal from '@/components/disbursement-modal';
import { 
  ShieldCheckIcon, 
  UsersIcon, 
  ShareIcon, 
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
  const [activeTab, setActiveTab] = useState<'story' | 'contributors'>('story');
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [paymentNotice, setPaymentNotice] = useState<{ ok: boolean; text: string } | null>(null);

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
  const canRequestPayout = currentUserId === boma.creator_id && /^[0-9a-f-]{36}$/i.test(boma.id);
  const daysLeft = Math.max(
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

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ShareIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>Share</span>
        </button>
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
          {boma.image_url ? (
            <div className="relative h-56 sm:h-80 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
              <img
                src={boma.image_url}
                alt={boma.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="rounded-md bg-slate-900/80 text-white px-2.5 py-1 text-[10px] font-semibold uppercase backdrop-blur-xs">
                  {boma.category}
                </span>
                {boma.verified && (
                  <span className="rounded-md bg-amber-500/90 text-amber-950 font-bold px-2.5 py-1 text-[10px] backdrop-blur-xs flex items-center gap-1 shadow-xs">
                    <ShieldCheckIcon className="w-3 h-3 text-amber-950" />
                    Verified Fund
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-200 flex items-end p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white text-slate-700 border border-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase shadow-2xs">
                  {boma.category}
                </span>
                {boma.verified && (
                  <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1">
                    <ShieldCheckIcon className="w-3 h-3 text-amber-600" />
                    Verified Fund
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Title & Organizer Info */}
          <div className="pb-3 border-b border-slate-200/80">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight leading-snug">
              {boma.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Organized by <strong className="text-slate-700 font-semibold">{boma.creator_name}</strong>
            </p>
          </div>

          {/* Mobile-Only Progress Strip (shown on mobile above tabs) */}
          <div className="block lg:hidden rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-xl font-semibold font-mono text-slate-900">
                {formatCurrency(boma.current_amount, boma.currency)}
              </span>
              <span className="text-slate-500 font-medium text-xs font-mono">
                {percentage}% of {formatCurrency(boma.target_amount, boma.currency)}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('contributors')}
                className="hover:text-emerald-700 font-semibold transition-colors text-left"
              >
                {boma.contributors_count || transactions.length} contributors →
              </button>
              <span>{daysLeft} days remaining</span>
            </div>
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
                onClick={() => setActiveTab('contributors')}
                className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'contributors'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Contributions</span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-mono">
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

          {activeTab === 'contributors' && (
            <ContributorTracker
              transactions={transactions}
              targetAmount={boma.target_amount}
              currency={boma.currency}
              bomaTitle={boma.title}
            />
          )}

          {/* Discreet link to Admin for administrators and organizers */}
          <div className="pt-2 text-center">
            <Link
              href="/admin"
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Organizer &amp; Admin Dashboard →
            </Link>
          </div>
        </div>

        {/* Right Column (Financial Progress & Contribute Card - Desktop Sticky) */}
        <div className="space-y-4">
          <div className="hidden lg:block sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            {/* Amount Stats */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Collected of {formatCurrency(boma.target_amount, boma.currency)}
              </span>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                {formatCurrency(boma.current_amount, boma.currency)}
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono">
                <span>{percentage}% reached</span>
                <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
              </div>
            </div>

            {/* Quick Contributors count */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('contributors')}
                className="flex items-center gap-1.5 text-left hover:text-emerald-700 transition-colors"
              >
                <UsersIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold font-mono text-slate-900">
                  {transactions.length}
                </span>
                <span className="text-slate-500">contributions →</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ShareIcon className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

            {/* Simple Pay Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsContributeModalOpen(true)}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-2xs transition-all active:scale-98"
              >
                Contribute to this Fund
              </button>
              {canRequestPayout && (
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-white py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors"
                >
                  Request payout · {formatCurrency(account.available_balance, boma.currency)} available
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Action Bar (Above Mobile Nav) */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 md:hidden bg-white/95 border-t border-slate-200 p-2.5 px-4 flex items-center gap-2.5 backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={() => setIsContributeModalOpen(true)}
          className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-2xs transition-colors"
        >
          Contribute Now
        </button>

        {canRequestPayout ? (
          <button
            type="button"
            onClick={() => setIsPayoutModalOpen(true)}
            className="rounded-lg border border-emerald-700 bg-white px-3 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
          >
            Payout
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Share"
          >
            <ShareIcon className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Modals */}
      <ContributionModal
        boma={boma}
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
      />

      <ShareModal
        boma={boma}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <DisbursementModal
        boma={boma}
        account={account}
        isOpen={isPayoutModalOpen && canRequestPayout}
        onClose={() => setIsPayoutModalOpen(false)}
        onSuccess={() => { void loadBomaData(); }}
      />
      </div>
    </div>
  );
}
