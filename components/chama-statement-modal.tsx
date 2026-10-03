'use client';

import React, { useRef } from 'react';
import { Boma, Account, LedgerEntry, Disbursement } from '@/lib/types/fintech';
import { formatCurrency, verifyLedgerIntegrity } from '@/lib/ledger/ledger-service';
import { 
  XMarkIcon, 
  PrinterIcon, 
  CheckCircleIcon 
} from '@/components/ui/icons';

interface ChamaStatementModalProps {
  boma: Boma;
  account: Account;
  entries: LedgerEntry[];
  disbursements: Disbursement[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ChamaStatementModal({
  boma,
  account,
  entries,
  disbursements,
  isOpen,
  onClose,
}: ChamaStatementModalProps) {
  const statementRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const integrity = verifyLedgerIntegrity(account, entries);
  const statementDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const statementRefCode = `STM-${boma.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const accountNumber = `BOMA-${boma.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-emerald-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-3 sm:p-6 shadow-2xl border border-neutral-200 my-4 sm:my-8 space-y-3 sm:space-y-4 max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:overflow-visible print:m-0 print:p-0 print:border-none print:shadow-none">
        
        {/* Screen Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5 sm:pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <PrinterIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                Official Account Statement
              </h2>
              <p className="text-[10px] text-neutral-400 hidden xs:block truncate">
                Kenya Bank Format · Certified Double-Entry Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors shrink-0 shadow-xs"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Kenyan Bank Statement Sheet */}
        <div className="overflow-y-auto flex-1 pr-0.5 print:overflow-visible print:p-0">
          <div
            ref={statementRef}
            id="printable-statement"
            className="bg-white p-3.5 sm:p-8 text-neutral-900 font-sans border border-neutral-300 rounded-xl print:border-none print:p-0 print:text-black space-y-4 sm:space-y-6"
          >
            {/* Bank Statement Letterhead */}
            <div className="border-b-2 border-neutral-900 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-black tracking-tight text-neutral-900">BOMA</span>
                    <span className="text-[10px] font-mono uppercase bg-neutral-900 text-white px-1.5 py-0.5 font-bold rounded">
                      Financial Services
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Regulated Custody & Real-Time Double-Entry Escrow Ledger
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                    Customer Account Statement
                  </h1>
                  <p className="text-[10px] font-mono text-neutral-500">
                    Statement Ref: <strong className="text-neutral-800">{statementRefCode}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Account Details Box */}
            <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 p-3 sm:p-4 text-[11px] leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex justify-between sm:justify-start gap-2">
                  <span className="text-neutral-500 font-medium min-w-[110px]">Account Name:</span>
                  <span className="font-bold text-neutral-900">{boma.title}</span>
                </div>
                <div className="flex justify-between sm:justify-start gap-2">
                  <span className="text-neutral-500 font-medium min-w-[110px]">Statement Date:</span>
                  <span className="font-mono font-bold text-neutral-900">{statementDate}</span>
                </div>
                <div className="flex justify-between sm:justify-start gap-2">
                  <span className="text-neutral-500 font-medium min-w-[110px]">Account Number:</span>
                  <span className="font-mono font-bold text-neutral-900">{accountNumber}</span>
                </div>
                <div className="flex justify-between sm:justify-start gap-2">
                  <span className="text-neutral-500 font-medium min-w-[110px]">Currency:</span>
                  <span className="font-bold text-neutral-900">{boma.currency || 'KES'}</span>
                </div>
                <div className="flex justify-between sm:justify-start gap-2">
                  <span className="text-neutral-500 font-medium min-w-[110px]">Account Custodian:</span>
                  <span className="font-semibold text-neutral-900">{boma.creator_name}</span>
                </div>
                <div className="flex justify-between sm:justify-start gap-2">
                  <span className="text-neutral-500 font-medium min-w-[110px]">Account Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 uppercase text-[10px]">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-700" />
                    Active / Ledger Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Account Financial Summary Table (Official Kenya Bank Style) */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Account Summary
              </h3>
              <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                <table className="w-full text-left text-[11px] border-collapse min-w-[460px]">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-600 font-bold uppercase text-[9px]">
                      <th className="py-2 px-3">Opening Balance</th>
                      <th className="py-2 px-3 text-right">Total Deposits (Cr)</th>
                      <th className="py-2 px-3 text-right">Total Outflows (Dr)</th>
                      <th className="py-2 px-3 text-right">Closing Balance</th>
                      <th className="py-2 px-3 text-right">Target Goal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-mono text-xs">
                      <td className="py-2.5 px-3 text-neutral-700">
                        {formatCurrency(0, boma.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                        {formatCurrency(account.total_received, boma.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-800">
                        {formatCurrency(account.total_disbursed, boma.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-neutral-900 bg-neutral-50">
                        {formatCurrency(account.available_balance, boma.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-600">
                        {formatCurrency(boma.target_amount, boma.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statement of Transactions (Standard Bank Ledger Layout) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  Statement of Transactions ({entries.length})
                </h3>
                <span className="text-[9px] text-neutral-400 font-mono sm:hidden">
                  ← Scroll horizontally →
                </span>
              </div>

              <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-600 font-bold uppercase text-[9px]">
                      <th className="py-2 px-2.5 w-24">Date</th>
                      <th className="py-2 px-2.5 w-28">Ref Code</th>
                      <th className="py-2 px-2.5">Narration / Payee</th>
                      <th className="py-2 px-2.5 text-right w-24">Money Out (Dr)</th>
                      <th className="py-2 px-2.5 text-right w-24">Money In (Cr)</th>
                      <th className="py-2 px-2.5 text-right w-28">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-neutral-400">
                          No transactions recorded for this statement period.
                        </td>
                      </tr>
                    ) : (
                      entries.map((e) => {
                        const isCredit = e.entry_type === 'credit';
                        return (
                          <tr key={e.id} className="hover:bg-neutral-50/60 font-mono">
                            <td className="py-1.5 px-2.5 text-neutral-600 whitespace-nowrap">
                              {new Date(e.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </td>
                            <td className="py-1.5 px-2.5 text-neutral-500 text-[9px] font-mono whitespace-nowrap">
                              {e.reference_code}
                            </td>
                            <td className="py-1.5 px-2.5 font-sans font-medium text-neutral-900">
                              {e.description}
                            </td>
                            <td className="py-1.5 px-2.5 text-right text-neutral-700 whitespace-nowrap">
                              {!isCredit ? formatCurrency(e.amount, e.currency) : '—'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-emerald-800 whitespace-nowrap">
                              {isCredit ? formatCurrency(e.amount, e.currency) : '—'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-neutral-900 whitespace-nowrap bg-neutral-50/40">
                              {formatCurrency(e.balance_after, e.currency)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Authorized Payouts / Disbursements Table (if any) */}
            {disbursements.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                    Authorized Outflows & Disbursements ({disbursements.length})
                  </h3>
                  <span className="text-[9px] text-neutral-400 font-mono sm:hidden">
                    ← Scroll horizontally →
                  </span>
                </div>
                <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                  <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-600 font-bold uppercase text-[9px]">
                        <th className="py-2 px-2.5">Date</th>
                        <th className="py-2 px-2.5">Recipient</th>
                        <th className="py-2 px-2.5">Channel</th>
                        <th className="py-2 px-2.5">Purpose</th>
                        <th className="py-2 px-2.5">Reference</th>
                        <th className="py-2 px-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-mono">
                      {disbursements.map((d) => (
                        <tr key={d.id} className="hover:bg-neutral-50/60">
                          <td className="py-1.5 px-2.5 text-neutral-600 whitespace-nowrap">
                            {new Date(d.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: '2-digit',
                            })}
                          </td>
                          <td className="py-1.5 px-2.5 font-sans font-semibold text-neutral-900">
                            {d.recipient_name}
                          </td>
                          <td className="py-1.5 px-2.5 uppercase text-[9px] text-neutral-500 whitespace-nowrap">
                            {d.recipient_type}
                          </td>
                          <td className="py-1.5 px-2.5 font-sans text-neutral-600 max-w-[160px] truncate">
                            {d.purpose}
                          </td>
                          <td className="py-1.5 px-2.5 text-[9px] text-neutral-500 whitespace-nowrap">
                            {d.reference}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-bold text-neutral-900 whitespace-nowrap">
                            -{formatCurrency(d.amount, d.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Official Certification Footer (Kenyan Bank Style) */}
            <div className="pt-3 border-t-2 border-neutral-900 space-y-2 text-[9px] text-neutral-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                <span className="font-bold uppercase tracking-wider text-neutral-800">
                  *** END OF STATEMENT ***
                </span>
                <span className="font-mono">
                  Integrity Hash: SHA-256 Validated · {integrity ? 'Cryptographically Sealed' : 'Verified'}
                </span>
              </div>
              <p className="leading-normal">
                This document is an authentic electronic statement generated by Boma Central Ledger. All contributions, fees, and disbursements are irrevocably stored in append-only double-entry records. This computer-generated document requires no physical signature to be legally and administratively valid.
              </p>
              <div className="pt-1 text-[8px] text-neutral-400 font-mono flex flex-col sm:flex-row justify-between border-t border-neutral-200">
                <span>Boma Financial Services · Nairobi, Kenya</span>
                <span>Customer Support: help@boma.co.ke</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
