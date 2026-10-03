'use client';

import React, { useState } from 'react';
import { Boma, PaymentMethod, Transaction, LedgerEntry } from '../lib/types/fintech';
import { formatCurrency } from '../lib/ledger/ledger-service';
import { bomaService } from '../lib/services/boma-service';
import { 
  XMarkIcon, 
  SmartphoneIcon, 
  CreditCardIcon, 
  BuildingLibraryIcon, 
  ShieldCheckIcon, 
  CheckCircleIcon,
  CopyIcon,
  WhatsAppIcon
} from './ui/icons';

interface ContributionModalProps {
  boma: Boma | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { transaction: Transaction; ledgerEntry: LedgerEntry }) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function ContributionModal({
  boma,
  isOpen,
  onClose,
  onSuccess,
}: ContributionModalProps) {
  if (!isOpen || !boma) return null;

  const [step, setStep] = useState<'input' | 'processing' | 'receipt'>('input');
  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [contributorName, setContributorName] = useState<string>('');
  const [contributorPhone, setContributorPhone] = useState<string>('0712345678');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [note, setNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [receiptData, setReceiptData] = useState<{ transaction: Transaction; ledgerEntry: LedgerEntry } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedAmount <= 0) {
      setErrorMessage('Enter a valid amount.');
      return;
    }

    if (!contributorName.trim() && !isAnonymous) {
      setErrorMessage('Provide a name or choose anonymous.');
      return;
    }

    setStep('processing');
    setProcessingStatus(`Initiating Paystack ${paymentMethod.toUpperCase()} rail...`);

    try {
      // 1. Initialize Paystack Transaction
      const initRes = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boma_id: boma.id,
          amount: selectedAmount,
          contributor_name: contributorName.trim() || 'Member',
          contributor_phone: contributorPhone,
          is_anonymous: isAnonymous,
          payment_method: paymentMethod,
          note: note.trim() || undefined,
          currency: boma.currency,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to initialize payment');
      }

      const initData = await initRes.json();
      const reference: string = initData.reference;

      if (initData.live) {
        // Live Paystack: hand off to hosted checkout (M-Pesa STK / card / bank).
        // The boma page verifies the payment on return and books the ledger.
        setProcessingStatus('Redirecting to secure Paystack checkout...');
        window.location.href = initData.authorization_url;
        return;
      }

      // Sandbox mode (no live Paystack keys): simulate the payment prompt.
      setProcessingStatus(
        paymentMethod === 'mpesa'
          ? `[Sandbox] STK prompt sent to ${contributorPhone}. Enter PIN...`
          : '[Sandbox] Authorizing card...'
      );
      await new Promise((res) => setTimeout(res, 1200));
      setProcessingStatus('Posting double-entry ledger credit...');

      const finalResult = await bomaService.contribute({
        boma_id: boma.id,
        amount: selectedAmount,
        contributor_name: contributorName.trim() || 'Member',
        contributor_phone: contributorPhone,
        is_anonymous: isAnonymous,
        payment_method: paymentMethod,
        note: note.trim() || undefined,
        reference,
      });

      setReceiptData(finalResult);
      setStep('receipt');
      onSuccess(finalResult);
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
    setStep('input');
    setReceiptData(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-emerald-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border-t sm:border border-neutral-200 "
        role="dialog"
      >
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 ">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 leading-tight">
                {step === 'receipt' ? 'Receipt' : 'Changia'}
              </h2>
              <p className="text-[10px] text-neutral-500 truncate max-w-[220px]">
                {boma.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 "
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        {step === 'input' && (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 ">
                {errorMessage}
              </div>
            )}

            {/* Presets */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Amount ({boma.currency})
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAmountSelect(val)}
                    className={`rounded-lg py-1.5 px-1 text-center text-xs font-bold transition-all ${
                      amount === val && !customAmount
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 '
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Custom amount..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="10"
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-hidden "
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Payment Rail
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                    paymentMethod === 'mpesa'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-white '
                  }`}
                >
                  <SmartphoneIcon className="w-4 h-4 text-emerald-600 mb-0.5" />
                  <span className="text-[11px] font-bold">M-Pesa</span>
                  <span className="text-[9px] text-neutral-400">STK Push</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                    paymentMethod === 'card'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-white '
                  }`}
                >
                  <CreditCardIcon className="w-4 h-4 text-teal-600 mb-0.5" />
                  <span className="text-[11px] font-bold">Card</span>
                  <span className="text-[9px] text-neutral-400">Visa / MC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-white '
                  }`}
                >
                  <BuildingLibraryIcon className="w-4 h-4 text-neutral-500 mb-0.5" />
                  <span className="text-[11px] font-bold">Bank</span>
                  <span className="text-[9px] text-neutral-400">Direct</span>
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required={!isAnonymous}
                  placeholder="e.g. Kelvin Mutiso"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 "
                />
              </div>

              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">
                    M-Pesa Phone
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0712 345 678"
                    value={contributorPhone}
                    onChange={(e) => setContributorPhone(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 "
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">
                  Message (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Quick word of support..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 "
                />
              </div>

              {/* Anonymous Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-neutral-600 ">
                  Stay anonymous on public ledger
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-2 pb-1 space-y-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                <span>Pay {formatCurrency(selectedAmount, boma.currency)}</span>
                <span>→</span>
              </button>
              <div className="text-center text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                <ShieldCheckIcon className="w-3 h-3 text-emerald-600" />
                <span>Secured by Paystack • Instant M-Pesa & Cards</span>
              </div>
            </div>
          </form>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 ">
              Processing Payment
            </h3>
            <p className="text-xs text-neutral-500">
              {processingStatus}
            </p>
          </div>
        )}

        {/* Receipt State */}
        {step === 'receipt' && receiptData && (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-1.5">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 ">
                Payment Confirmed
              </h3>
              <p className="text-[11px] text-neutral-400">
                Booked to double-entry ledger
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-neutral-200 ">
                <span className="text-neutral-500 text-[11px]">Ref:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-neutral-900 ">
                  <span>{receiptData.transaction.reference}</span>
                  <button
                    type="button"
                    onClick={copyReceiptCode}
                    className="p-0.5 hover:text-emerald-600"
                  >
                    <CopyIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-[11px]">Amount:</span>
                <span className="font-extrabold text-emerald-600 ">
                  {formatCurrency(receiptData.transaction.amount, receiptData.transaction.currency)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-[11px]">Member:</span>
                <span className="font-medium text-neutral-800 ">
                  {receiptData.transaction.is_anonymous ? 'Anonymous' : receiptData.transaction.contributor_name}
                </span>
              </div>
            </div>

            {copied && (
              <p className="text-center text-[10px] font-semibold text-emerald-600">
                ✓ Reference copied
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  const msg = `I just contributed ${formatCurrency(receiptData.transaction.amount, receiptData.transaction.currency)} to *${boma.title}* on Boma! Join me in supporting:\n👉 ${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition-colors"
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
