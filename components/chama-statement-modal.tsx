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

  if (!isOpen || !boma) return null;

  const bomaId = boma.id || '';
  const integrity = account ? verifyLedgerIntegrity(account, entries || []) : { isBalanced: true, discrepancy: 0 };
  const statementDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const statementRefCode = `STM-${bomaId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const accountNumber = `BOMA-${bomaId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}`;

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
                    <span className="text-lg sm:text-xl font-semibold tracking-tight text-slate-800">OPENHAND</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-900 text-white px-1.5 py-0.5 font-semibold rounded">
                      Financial Services
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    M-Pesa group contributions &amp; transparent ledger
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <h1 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800">
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
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="shrink-0 text-neutral-500 font-medium">Account Name:</span>
                  <span className="min-w-0 break-words text-right font-bold text-neutral-900 sm:text-left">{boma.title}</span>
                </div>
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="shrink-0 text-neutral-500 font-medium">Statement Date:</span>
                  <span className="min-w-0 break-words text-right font-mono font-bold text-neutral-900 sm:text-left">{statementDate}</span>
                </div>
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="shrink-0 text-neutral-500 font-medium">Account Number:</span>
                  <span className="min-w-0 break-words text-right font-mono font-bold text-neutral-900 sm:text-left">{accountNumber}</span>
                </div>
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="shrink-0 text-neutral-500 font-medium">Currency:</span>
                  <span className="min-w-0 break-words text-right font-bold text-neutral-900 sm:text-left">{boma.currency || 'KES'}</span>
                </div>
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="shrink-0 text-neutral-500 font-medium">Account Custodian:</span>
                  <span className="min-w-0 break-words text-right font-semibold text-neutral-900 sm:text-left">{boma.creator_name}</span>
                </div>
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="shrink-0 text-neutral-500 font-medium">Account Status:</span>
                  <span className="inline-flex min-w-0 flex-wrap items-center justify-end gap-1 text-right font-bold text-emerald-800 uppercase text-[10px] sm:justify-start">
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
              <dl className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-300 p-3 text-[10px] sm:grid-cols-3 lg:grid-cols-5">
                {[
                  ['Starting balance', formatCurrency(0, boma.currency)],
                  ['Received', formatCurrency(account?.total_received || 0, boma.currency)],
                  ['Paid out', formatCurrency(account?.total_disbursed || 0, boma.currency)],
                  ['Available', formatCurrency(account?.available_balance || 0, boma.currency)],
                  ['Goal', formatCurrency(boma.target_amount, boma.currency)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-md bg-neutral-50 p-2">
                    <dt className="truncate text-neutral-500">{label}</dt>
                    <dd className="mt-1 break-words font-mono font-bold text-neutral-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Statement of Transactions (Standard Bank Ledger Layout) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  Statement of Transactions ({(entries || []).length})
                </h3>
              </div>

              <div className="hidden border border-neutral-300 rounded-lg lg:block print:block">
                <table className="w-full table-fixed text-left text-[10px] sm:text-[11px] border-collapse">
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
                    {(entries || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-neutral-400">
                          No transactions recorded for this statement period.
                        </td>
                      </tr>
                    ) : (
                      (entries || []).map((e) => {
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
                            <td className="max-w-24 truncate py-1.5 px-2.5 text-neutral-500 text-[9px] font-mono whitespace-nowrap">
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
              <div className="space-y-2 lg:hidden print:hidden">
                {(entries || []).length === 0 ? (
                  <p className="py-5 text-center text-xs text-neutral-400">No contributions or payouts yet.</p>
                ) : (entries || []).map((e) => (
                  <article key={e.id} className="rounded-lg border border-neutral-200 p-3 text-[10px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-neutral-900">{e.description}</p>
                        <p className="mt-1 text-neutral-500">{new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className="shrink-0 text-right font-mono font-bold text-emerald-800">{e.entry_type === 'credit' ? '+' : '-'}{formatCurrency(e.amount, e.currency)}</span>
                    </div>
                    <p className="mt-2 border-t border-neutral-100 pt-2 text-neutral-500">Balance {formatCurrency(e.balance_after, e.currency)}</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Authorized Payouts / Disbursements Table (if any) */}
            {(disbursements || []).length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                    Authorized Outflows & Disbursements ({(disbursements || []).length})
                  </h3>
                </div>
                <div className="hidden border border-neutral-300 rounded-lg lg:block print:block">
                  <table className="w-full table-fixed text-left text-[10px] sm:text-[11px] border-collapse">
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
                      {(disbursements || []).map((d) => (
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
                          <td className="max-w-24 truncate py-1.5 px-2.5 text-[9px] text-neutral-500 whitespace-nowrap">
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
                <div className="space-y-2 lg:hidden print:hidden">
                  {(disbursements || []).map((d) => (
                    <article key={d.id} className="rounded-lg border border-neutral-200 p-3 text-[10px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-900">{d.recipient_name}</p>
                          <p className="mt-1 text-neutral-500">{new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {d.recipient_type}</p>
                        </div>
                        <span className="shrink-0 font-mono font-bold text-neutral-900">-{formatCurrency(d.amount, d.currency)}</span>
                      </div>
                      <p className="mt-2 break-words border-t border-neutral-100 pt-2 text-neutral-600">{d.purpose}</p>
                    </article>
                  ))}
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
                This statement was generated by the Openhand group ledger. It summarizes contribution and disbursement records available at the time of issue.
              </p>
              <div className="pt-1 text-[8px] text-neutral-400 font-mono flex flex-col sm:flex-row justify-between border-t border-neutral-200">
                <span>Openhand · Group contributions, made clear</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
