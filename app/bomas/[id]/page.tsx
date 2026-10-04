'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Boma, Account, LedgerEntry, Disbursement, Transaction } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import ContributionModal from '@/components/contribution-modal';
import DisbursementModal from '@/components/disbursement-modal';
import TransparentLedger from '@/components/transparent-ledger';
import ContributorTracker from '@/components/contributor-tracker';
import GovernancePanel from '@/components/governance-panel';
import ShareModal from '@/components/share-modal';
import ChamaStatementModal from '@/components/chama-statement-modal';
import { 
  ShieldCheckIcon, 
  UsersIcon, 
  ClockIcon, 
  ShareIcon, 
  WalletIcon,
  PrinterIcon,
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
  const [activeTab, setActiveTab] = useState<'story' | 'contributors' | 'ledger' | 'disbursements' | 'governance'>('story');
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
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
      // Returning from Paystack checkout: verify, then book the ledger once.
      const params = new URLSearchParams(window.location.search);
      const reference = params.get('reference') || params.get('trxref');
      if (reference && params.get('paystack') === 'true') {
        try {
          const res = await fetch('/api/payments/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Payment could not be verified');
          setPaymentNotice({ ok: true, text: `Payment confirmed. Ref ${reference}` });
        } catch (err: unknown) {
          setPaymentNotice({
            ok: false,
            text: err instanceof Error ? err.message : 'Payment verification failed',
          });
        }
        window.history.replaceState({}, '', window.location.pathname);
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
        <p className="mt-3 text-xs text-neutral-400">Loading ledger records...</p>
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
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(boma.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="w-full min-w-0 px-5 sm:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
      <div className="w-full max-w-7xl space-y-6">
      
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Link href="/bomas" className="hover:text-emerald-700 font-medium">Funds</Link>
          <span>/</span>
          <span className="capitalize font-mono text-slate-600">{boma.category}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <PrinterIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ShareIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Share &amp; QR</span>
          </button>

        </div>
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
            <nav className="flex space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveTab('story')}
                className={`py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'story'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Story
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contributors')}
                className={`py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'contributors'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Contributors</span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[10px] font-mono">
                  {boma.contributors_count || transactions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ledger')}
                className={`py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'ledger'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Ledger</span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[10px] font-mono">
                  {ledgerEntries.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('disbursements')}
                className={`py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'disbursements'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Payouts</span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[10px] font-mono">
                  {disbursements.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('governance')}
                className={`py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'governance'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Governance</span>
                <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                  Multi-Sig
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

              <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900">
                <ShieldCheckIcon className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>All funds are held in segregated trust accounts and audited in real time.</span>
              </div>
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

          {activeTab === 'ledger' && (
            <TransparentLedger
              entries={ledgerEntries}
              currency={boma.currency}
              bomaTitle={boma.title}
              onOpenStatement={() => setIsStatementModalOpen(true)}
            />
          )}

          {activeTab === 'disbursements' && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Documented Payouts
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Disbursed: {formatCurrency(account.total_disbursed, boma.currency)}
                </span>
              </div>

              {disbursements.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No disbursements requested yet. Raised funds are intact.
                </div>
              ) : (
                <div className="space-y-2">
                  {disbursements.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-slate-200 p-3 flex justify-between items-center text-xs hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {d.recipient_name}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {d.purpose}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-semibold font-mono text-amber-700">
                          -{formatCurrency(d.amount, d.currency)}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-400">
                          {d.reference}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'governance' && (
            <GovernancePanel bomaId={boma.id} onPayoutExecuted={loadBomaData} />
          )}
        </div>

        {/* Right Column (Financial Progress Card - Desktop Sticky) */}
        <div className="space-y-4">
          <div className="hidden lg:block sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
            
            {/* Amount Stats */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Raised of {formatCurrency(boma.target_amount, boma.currency)}
              </span>
              <div className="mt-1 text-2xl font-semibold font-mono text-slate-900">
                {formatCurrency(boma.current_amount, boma.currency)}
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono">
                <span>{percentage}% funded</span>
                <span>{daysLeft}d left</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('contributors')}
                className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              >
                <UsersIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-semibold font-mono text-slate-900 block">
                    {boma.contributors_count || transactions.length}
                  </span>
                  <span className="block text-[10px] text-slate-400">Members →</span>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-slate-600 shrink-0" />
                <div>
                  <span className="font-semibold font-mono text-slate-900 truncate block">
                    {formatCurrency(account.available_balance, boma.currency)}
                  </span>
                  <span className="block text-[10px] text-slate-400">Available</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsContributeModalOpen(true)}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors"
              >
                Contribute Now (M-Pesa / Card)
              </button>

              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(true)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition-colors"
              >
                Request Payout
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ShareIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share &amp; QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStatementModalOpen(true)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <PrinterIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Statement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Action Bar (Above Mobile Nav) */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 md:hidden bg-white/95 border-t border-slate-200 p-2.5 px-3 flex items-center gap-2 backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={() => setIsContributeModalOpen(true)}
          className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors"
        >
          Contribute Now
        </button>

        <button
          type="button"
          onClick={() => setIsDisburseModalOpen(true)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700"
        >
          Payout
        </button>

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-700"
          aria-label="Share & QR"
        >
          <ShareIcon className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Modals */}
      <ContributionModal
        boma={boma}
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
      />

      <DisbursementModal
        boma={boma}
        account={account}
        isOpen={isDisburseModalOpen}
        onClose={() => setIsDisburseModalOpen(false)}
        onSuccess={loadBomaData}
      />

      <ShareModal
        boma={boma}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <ChamaStatementModal
        boma={boma}
        account={account}
        entries={ledgerEntries}
        disbursements={disbursements}
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
      />
      </div>
    </div>
  );
}
