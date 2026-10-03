'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Boma, Account, LedgerEntry, Disbursement } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import ContributionModal from '@/components/contribution-modal';
import DisbursementModal from '@/components/disbursement-modal';
import TransparentLedger from '@/components/transparent-ledger';
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'story' | 'ledger' | 'disbursements' | 'governance'>('story');
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
      const entries = await bomaService.getBomaLedger(bomaId);
      const disbs = await bomaService.getBomaDisbursements(bomaId);
      setLedgerEntries(entries);
      setDisbursements(disbs);
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
    <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-3 sm:px-6 py-3 sm:py-6 pb-28 md:pb-6 space-y-3 sm:space-y-5">
      
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Link href="/bomas" className="hover:text-emerald-700 font-bold">Funds</Link>
          <span>/</span>
          <span className="capitalize font-mono">{boma.category}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 "
          >
            <PrinterIcon className="w-3 h-3 text-emerald-700" />
            <span>Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 "
          >
            <ShareIcon className="w-3 h-3" />
            <span>Share & QR</span>
          </button>

        </div>
      </div>

      {/* Payment Confirmation / Alert Banner */}
      {paymentNotice && (
        <div
          className={`rounded-xl p-3 text-xs font-semibold flex items-center justify-between shadow-xs ${
            paymentNotice.ok
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 '
              : 'bg-rose-50 text-rose-800 border border-rose-200 '
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column (Content, Hero, Tabs) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          
          {/* Cover Media */}
          {boma.image_url ? (
            <div className="relative h-44 sm:h-72 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-100 ">
              <img
                src={boma.image_url}
                alt={boma.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="rounded-md bg-emerald-600/90 text-white px-2 py-0.5 text-[9px] font-bold uppercase backdrop-blur-xs">
                  {boma.category}
                </span>
                {boma.verified && (
                  <span className="rounded-md bg-white/90 text-neutral-900 px-2 py-0.5 text-[9px] font-bold backdrop-blur-xs flex items-center gap-0.5">
                    <ShieldCheckIcon className="w-3 h-3 text-emerald-700" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="relative h-24 sm:h-32 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-100 border border-neutral-200 flex items-end p-3">
              <div className="flex items-center gap-1">
                <span className="rounded-md bg-white text-neutral-700 border border-neutral-200 px-2 py-0.5 text-[9px] font-bold uppercase">
                  {boma.category}
                </span>
                {boma.verified && (
                  <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                    <ShieldCheckIcon className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Title & Organizer Info */}
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-neutral-900 leading-snug">
              {boma.title}
            </h1>
            <p className="text-[11px] text-neutral-400 mt-1">
              Organized by <strong className="text-neutral-700 ">{boma.creator_name}</strong>
            </p>
          </div>

          {/* Mobile-Only Progress Strip (shown on mobile above tabs) */}
          <div className="block lg:hidden rounded-xl border border-neutral-200 bg-white p-3.5 space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-lg font-black text-neutral-900 ">
                {formatCurrency(boma.current_amount, boma.currency)}
              </span>
              <span className="text-neutral-500 font-semibold text-[11px]">
                {percentage}% of {formatCurrency(boma.target_amount, boma.currency)}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 ">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-neutral-400 pt-0.5">
              <span>{boma.contributors_count} contributors</span>
              <span>{daysLeft} days remaining</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-neutral-200 ">
            <nav className="flex space-x-4">
              <button
                type="button"
                onClick={() => setActiveTab('story')}
                className={`py-2 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === 'story'
                    ? 'border-emerald-600 text-emerald-700 '
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Story
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ledger')}
                className={`py-2 text-xs font-bold border-b-2 flex items-center gap-1 transition-colors ${
                  activeTab === 'ledger'
                    ? 'border-emerald-600 text-emerald-700 '
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span>Ledger</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] ">
                  {ledgerEntries.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('disbursements')}
                className={`py-2 text-xs font-bold border-b-2 flex items-center gap-1 transition-colors ${
                  activeTab === 'disbursements'
                    ? 'border-emerald-600 text-emerald-700 '
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span>Payouts</span>
                <span className="rounded-full bg-neutral-100 text-neutral-800 px-1.5 py-0.2 text-[9px] ">
                  {disbursements.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('governance')}
                className={`py-2 text-xs font-bold border-b-2 flex items-center gap-1 transition-colors ${
                  activeTab === 'governance'
                    ? 'border-emerald-600 text-emerald-700 '
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span>Governance</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] ">
                  Multi-Sig
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Contents */}
          {activeTab === 'story' && (
            <div className="space-y-4 text-xs text-neutral-700 leading-relaxed rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 ">
              <p className="whitespace-pre-line text-xs sm:text-sm">
                {boma.description}
              </p>

              <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-800 ">
                <ShieldCheckIcon className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>All funds are held in segregated trust accounts and audited in real time.</span>
              </div>
            </div>
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
            <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h3 className="text-xs font-bold text-neutral-900 ">
                  Documented Payouts
                </h3>
                <span className="text-[11px] text-neutral-400">
                  Disbursed: {formatCurrency(account.total_disbursed, boma.currency)}
                </span>
              </div>

              {disbursements.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No disbursements requested yet. Raised funds are intact.
                </div>
              ) : (
                <div className="space-y-2">
                  {disbursements.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-neutral-200 p-2.5 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-neutral-900 block">
                          {d.recipient_name}
                        </span>
                        <p className="text-[11px] text-neutral-500">
                          {d.purpose}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-amber-600 ">
                          -{formatCurrency(d.amount, d.currency)}
                        </span>
                        <span className="block font-mono text-[9px] text-neutral-400">
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
          <div className="hidden lg:block sticky top-20 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-5">
            
            {/* Amount Stats */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Raised of {formatCurrency(boma.target_amount, boma.currency)}
              </span>
              <div className="mt-1 text-2xl font-black text-neutral-900 ">
                {formatCurrency(boma.current_amount, boma.currency)}
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100 ">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="mt-1.5 flex justify-between text-xs text-neutral-400">
                <span>{percentage}% funded</span>
                <span>{daysLeft}d left</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 border-y border-neutral-100 py-3 text-xs">
              <div className="flex items-center gap-1.5">
                <UsersIcon className="w-4 h-4 text-emerald-700" />
                <div>
                  <span className="font-bold text-neutral-900 ">
                    {boma.contributors_count}
                  </span>
                  <span className="block text-[10px] text-neutral-400">Members</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <WalletIcon className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="font-bold text-neutral-900 truncate">
                    {formatCurrency(account.available_balance, boma.currency)}
                  </span>
                  <span className="block text-[10px] text-neutral-400">Available</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsContributeModalOpen(true)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-xs transition-colors active:scale-98"
              >
                Contribute Now (M-Pesa / Card)
              </button>

              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(true)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 py-2 text-xs font-semibold text-neutral-700 "
              >
                Request Payout
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 py-2 text-xs font-semibold text-neutral-700 flex items-center justify-center gap-1.5"
                >
                  <ShareIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Share & QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStatementModalOpen(true)}
                  className="rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 py-2 text-xs font-semibold text-neutral-700 flex items-center justify-center gap-1.5"
                >
                  <PrinterIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Statement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Action Bar (Above Mobile Nav) */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 md:hidden bg-white/95 border-t border-neutral-200 p-2.5 px-3 flex items-center gap-2 backdrop-blur-md shadow-md">
        <button
          type="button"
          onClick={() => setIsContributeModalOpen(true)}
          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-sm transition-colors active:scale-98"
        >
          Contribute Now
        </button>

        <button
          type="button"
          onClick={() => setIsDisburseModalOpen(true)}
          className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-xs font-semibold text-neutral-700 "
        >
          Payout
        </button>

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-700 "
          aria-label="Share & QR"
        >
          <ShareIcon className="w-4 h-4" />
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
  );
}
