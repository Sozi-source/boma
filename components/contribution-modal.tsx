'use client';

import React, { useState, useEffect } from 'react';
import { Boma, Transaction, LedgerEntry, UserProfile } from '../lib/types/fintech';
import { formatCurrency } from '../lib/ledger/ledger-service';
import { createClient } from '../lib/supabase/client';
import { bomaService } from '../lib/services/boma-service';
import { formatPhoneDisplay, normalizePhoneNumber } from '../lib/utils/phone';
import { 
  XMarkIcon, 
  ShieldCheckIcon, 
  CheckCircleIcon,
  CopyIcon,
  WhatsAppIcon,
  PlusIcon
} from './ui/icons';

interface ContributionModalProps {
  boma: Boma | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function ContributionModal({
  boma,
  isOpen,
  onClose,
  onSuccess,
}: ContributionModalProps) {
  const [step, setStep] = useState<'input' | 'processing' | 'receipt'>('input');
  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [contributorEmail, setContributorEmail] = useState<string>('');
  const [contributorPhone, setContributorPhone] = useState<string>('');
  const [contributorName, setContributorName] = useState<string>('');
  const [userPhones, setUserPhones] = useState<string[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [showAddLine, setShowAddLine] = useState<boolean>(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [receiptData, setReceiptData] = useState<{ transaction: Transaction; ledgerEntry: LedgerEntry } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Members have accounts: use signed-in identity & load all associated phone lines
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;

        let email = '';
        let name = '';
        let initialPhone = '';

        if (user) {
          email = user.email || '';
          name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Member';
          initialPhone = user.user_metadata?.phone || '';
        } else {
          // Check local guest or default
          const current = await bomaService.getCurrentUser();
          if (current.id !== 'user-guest') {
            email = current.email || '';
            name = current.name || '';
            initialPhone = current.phone || '';
          }
        }

        if (email) setContributorEmail(email);
        if (name) setContributorName(name);

        // Fetch user profile from bomaService to get all registered phone numbers
        const users = await bomaService.getUsers();
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (found) {
          setCurrentUserProfile(found);
          setUserPhones(found.phones);
          setContributorName(found.full_name);
          if (found.phones.length > 0) {
            setContributorPhone(found.phones[0]);
          } else if (initialPhone) {
            setContributorPhone(initialPhone);
          }
        } else if (initialPhone) {
          setContributorPhone(initialPhone);
          setUserPhones([initialPhone]);
        }
      } catch {
        // stays signed-out; handled on submit
      }
    })();
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen || !boma) return null;

  const selectedAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedAmount <= 0 || !Number.isInteger(selectedAmount)) {
      setErrorMessage('Enter a whole-number amount in KES.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contributorEmail.trim())) {
      setErrorMessage('Enter an email address so we can send your receipt.');
      return;
    }

    setStep('processing');
    setProcessingStatus('Sending an M-Pesa payment prompt to your phone...');

    try {
      // Auto-link newly entered phone to user profile if logged in
      if (currentUserProfile && contributorPhone.trim()) {
        const cleanPhone = contributorPhone.trim();
        const alreadyLinked = userPhones.some(
          (p) => normalizePhoneNumber(p) === normalizePhoneNumber(cleanPhone)
        );
        if (!alreadyLinked) {
          try {
            await bomaService.addPhoneToUser(currentUserProfile.id, cleanPhone);
          } catch {
            // Ignore minor linking error, proceed with payment
          }
        }
      }

      const initRes = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boma_id: boma.id,
          amount: selectedAmount,
          contributor_name: contributorName || 'Member',
          contributor_email: contributorEmail,
          contributor_phone: contributorPhone,
          is_anonymous: isAnonymous,
          currency: boma.currency,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to initialize payment');
      }

      const initData = await initRes.json();
      if (typeof initData.reference !== 'string') throw new Error('M-Pesa could not start. Please try again.');
      setProcessingStatus(typeof initData.display_text === 'string'
        ? initData.display_text
        : 'Check your phone and approve the M-Pesa prompt.');
      for (let attempt = 0; attempt < 18; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        const verifyRes = await fetch('/api/payments/paystack/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: initData.reference }),
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        if (verifyRes.ok && verifyData.status === 'success') {
          window.location.assign(`/bomas/${boma.id}?reference=${encodeURIComponent(initData.reference)}&paystack=true`);
          return;
        }
        if (!verifyRes.ok && ![202, 503].includes(verifyRes.status)) {
          throw new Error(verifyData.error || 'Unable to confirm your payment.');
        }
      }
      setStep('input');
      setErrorMessage('Payment is still pending. Check your M-Pesa messages before starting another payment.');
    } catch (err: unknown) {
      setStep('input');
      setErrorMessage(err instanceof Error ? err.message : 'Contribution failed.');
    }
  };

  const copyReceiptCode = () => {
    if (receiptData?.transaction.reference) {
      navigator.clipboard.writeText(receiptData.transaction.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    if (receiptData && onSuccess) {
      onSuccess();
    }
    setStep('input');
    setReceiptData(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-xl bg-white shadow-xl border-t sm:border border-slate-200"
        role="dialog"
      >
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                {step === 'receipt' ? 'Receipt' : 'Contribute'}
              </h2>
              <p className="text-[10px] text-slate-500 truncate max-w-[220px]">
                {boma.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        {step === 'input' && (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
            {errorMessage && (
              <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                {errorMessage}
              </div>
            )}

            {/* Amount Selection */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Amount ({boma.currency})
              </span>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAmountSelect(val)}
                    className={`rounded-lg py-2 px-1 text-center text-xs font-semibold font-mono transition-all ${
                      amount === val && !customAmount
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Custom Amount ({boma.currency})
                </label>
                <input
                  type="number"
                  aria-label="Custom Amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  step="1"
                  min="10"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">BomaPay keeps 2.5% of each contribution. The remaining share settles to the organizer’s registered M-Pesa destination.</p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    M-Pesa number for STK prompt *
                  </label>
                  {userPhones.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pb-2">
                      {userPhones.map((ph, idx) => {
                        const isSelected = normalizePhoneNumber(contributorPhone) === normalizePhoneNumber(ph);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setContributorPhone(ph);
                              setShowAddLine(false);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>{formatPhoneDisplay(ph)}</span>
                            {isSelected && <span className="text-[9px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <input
                    type="tel"
                    required
                    aria-label="Mobile Phone Number"
                    value={contributorPhone}
                    onChange={(e) => setContributorPhone(e.target.value)}
                    placeholder="0712 345 678"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
              </div>

              {!contributorEmail && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700" htmlFor="contribution-email">
                    Email for your receipt *
                  </label>
                  <input
                    id="contribution-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={contributorEmail}
                    onChange={(e) => setContributorEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">No account needed to contribute.</p>
                </div>
              )}

              {/* Contributor Display & Anonymous Option */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                    {contributorName ? contributorName.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block truncate text-xs">
                      {isAnonymous ? 'Anonymous Friend' : (contributorName || 'Member')}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Give anonymously</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-semibold text-white shadow-2xs transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                <span>Pay with M-Pesa {formatCurrency(selectedAmount, boma.currency)}</span>
              </button>
            </div>
          </form>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Processing Payment
            </h3>
            <p className="text-xs text-slate-500">
              {processingStatus}
            </p>
          </div>
        )}

        {/* Receipt State - Simple and Free of Transaction Jargon */}
        {step === 'receipt' && receiptData && (
          <div className="p-5 space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Thank You!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your contribution has been received
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Contributor:</span>
                <span className="font-semibold text-slate-900">
                  {receiptData.transaction.is_anonymous ? 'Anonymous Friend' : receiptData.transaction.contributor_name}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Amount Given:</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  {formatCurrency(receiptData.transaction.amount, receiptData.transaction.currency)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  const msg = `I just contributed ${formatCurrency(receiptData.transaction.amount, receiptData.transaction.currency)} to *${boma.title}* on Boma! Join me in supporting:\n👉 ${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
