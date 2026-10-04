'use client';

import React, { useState } from 'react';
import { Boma, Account, Disbursement } from '../lib/types/fintech';
import { formatCurrency } from '../lib/ledger/ledger-service';
import { bomaService } from '../lib/services/boma-service';
import { 
  XMarkIcon, 
  SmartphoneIcon, 
  BuildingLibraryIcon, 
  ShieldCheckIcon,
  CheckCircleIcon
} from './ui/icons';

interface DisbursementModalProps {
  boma: Boma;
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (disbursement?: Disbursement) => void;
}

export default function DisbursementModal({
  boma,
  account,
  isOpen,
  onClose,
  onSuccess,
}: DisbursementModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [recipientType, setRecipientType] = useState<'mpesa' | 'bank'>('mpesa');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientBankName, setRecipientBankName] = useState<string>('Equity Bank');
  const [recipientAccountNumber, setRecipientAccountNumber] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [completedDisbursement, setCompletedDisbursement] = useState<Disbursement | null>(null);
  const [approvalRequested, setApprovalRequested] = useState<boolean>(false);

  if (!isOpen) return null;

  const availableBalance = Number(account.available_balance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    if (numericAmount > availableBalance) {
      setError(`Exceeds available balance: ${formatCurrency(availableBalance, boma.currency)}`);
      return;
    }

    if (!recipientName.trim()) {
      setError('Enter legal recipient or vendor name.');
      return;
    }

    if (!purpose.trim()) {
      setError('Purpose is required for public audit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        boma_id: boma.id,
        amount: numericAmount,
        recipient_type: recipientType,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientType === 'mpesa' ? recipientPhone.trim() : undefined,
        recipient_bank_name: recipientType === 'bank' ? recipientBankName : undefined,
        recipient_account_number: recipientType === 'bank' ? recipientAccountNumber.trim() : undefined,
        purpose: purpose.trim(),
      };

      // Committee-governed Bomas: create a request that members must approve.
      if (await bomaService.requiresApproval(boma.id)) {
        await bomaService.requestPayout(payload);
        setApprovalRequested(true);
        return;
      }

      const disbursement = await bomaService.payout(payload);
      setCompletedDisbursement(disbursement);
      onSuccess(disbursement);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Disbursement failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCompletedDisbursement(null);
    setApprovalRequested(false);
    setAmount('');
    setRecipientName('');
    setPurpose('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-xl bg-white shadow-xl border-t sm:border border-slate-200"
        role="dialog"
      >
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                {completedDisbursement ? 'Disbursement Voucher' : 'Request Payout'}
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                Avail: {formatCurrency(availableBalance, boma.currency)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {completedDisbursement ? (
          <div className="p-4 space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Payout Submitted
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Awaiting Paystack settlement confirmation
              </p>
              <div className="mt-1.5 inline-block rounded-lg bg-slate-100 border border-slate-200 px-3 py-1 font-mono text-xs font-semibold text-emerald-700">
                {completedDisbursement.reference}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Payee:</span>
                <span className="font-semibold text-slate-900">{completedDisbursement.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Amount:</span>
                <span className="font-semibold font-mono text-slate-900">{formatCurrency(completedDisbursement.amount, completedDisbursement.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Reason:</span>
                <span className="font-medium text-slate-700 truncate max-w-[200px]">{completedDisbursement.purpose}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors"
            >
              Done
            </button>
          </div>
        ) : approvalRequested ? (
          <div className="p-4 space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Sent for Committee Approval
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Funds are released once enough committee members approve. Track it in the Governance tab.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                handleClose();
                onSuccess();
              }}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
            {error && (
              <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Amount ({boma.currency})
              </label>
              <input
                type="number"
                required
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientType('mpesa')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                    recipientType === 'mpesa'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SmartphoneIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>M-Pesa B2C</span>
                </button>

                <button
                  type="button"
                  disabled
                  title="Bank payouts will be enabled after Paystack bank code validation is configured."
                  className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-400"
                >
                  <BuildingLibraryIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="text-[10px] sm:text-xs font-semibold leading-tight">Bank (Unavailable)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Payee Legal Name / Vendor
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {recipientType === 'mpesa' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Bank
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientBankName}
                    onChange={(e) => setRecipientBankName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Account #
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientAccountNumber}
                    onChange={(e) => setRecipientAccountNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Purpose / Invoice Note
              </label>
              <textarea
                rows={2}
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Authorizing...' : 'Authorize Payout'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
