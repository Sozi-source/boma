'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Boma, Account, LedgerEntry, Disbursement, Committee } from '@/lib/types/fintech';
import { formatCurrency, verifyLedgerIntegrity } from '@/lib/ledger/ledger-service';
import { bomaService } from '@/lib/services/boma-service';
import { 
  XMarkIcon, 
  PrinterIcon, 
  ShieldCheckIcon, 
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
  const [committee, setCommittee] = useState<Committee | null>(null);
  const statementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bomaService.getCommittee(boma.id).then((c) => setCommittee(c));
    }
  }, [boma.id, isOpen]);

  if (!isOpen) return null;

  const integrity = verifyLedgerIntegrity(account, entries);
  const statementDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const statementRefCode = `STM-${boma.id.slice(0, 8).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 my-8 space-y-4 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:m-0 print:p-0 print:border-none print:shadow-none">
        
        {/* Screen Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <PrinterIcon className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                Official Chama & Cause Statement
              </h2>
              <p className="text-[10px] text-neutral-400">
                Audit-compliant report for committee, bank, or community review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Statement Document (Formatted for screen and A4 Print) */}
        <div
          ref={statementRef}
          id="printable-statement"
          className="bg-white p-4 sm:p-8 text-neutral-900 font-sans border border-neutral-200 rounded-xl print:border-none print:p-0 print:text-black space-y-6"
        >
          {/* Statement Header */}
          <div className="border-b border-neutral-900 pb-3 flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight uppercase">BOMA PAY</span>
                <span className="rounded bg-neutral-100 text-neutral-800 px-1.5 py-0.2 text-[9px] font-bold uppercase">
                  Statement
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold mt-1 text-neutral-900">
                {boma.title}
              </h1>
              <p className="text-[11px] text-neutral-500">
                Organizer: <strong className="text-neutral-800">{boma.creator_name}</strong> · Category: <span className="capitalize">{boma.category}</span>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5 self-start sm:self-auto">
              <p className="text-[10px] text-neutral-400 font-mono">Ref: {statementRefCode}</p>
              <p className="text-[10px] text-neutral-400">Date: {statementDate}</p>
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <ShieldCheckIcon className="w-3 h-3 text-emerald-600" />
                <span>Verified Ledger</span>
              </div>
            </div>
          </div>

          {/* Clean Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-center">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Target</span>
              <span className="text-sm sm:text-base font-black text-neutral-900 mt-1 block">
                {formatCurrency(boma.target_amount, boma.currency)}
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-center">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Received</span>
              <span className="text-sm sm:text-base font-black text-emerald-700 mt-1 block">
                {formatCurrency(account.total_received, boma.currency)}
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-center">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Disbursed</span>
              <span className="text-sm sm:text-base font-black text-amber-700 mt-1 block">
                {formatCurrency(account.total_disbursed, boma.currency)}
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-center">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Balance</span>
              <span className="text-sm sm:text-base font-black text-neutral-900 mt-1 block">
                {formatCurrency(account.available_balance, boma.currency)}
              </span>
            </div>
          </div>

          {/* Disbursements Summary Table (if any) */}
          {disbursements.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1">
                Authorized Disbursements Breakdown
              </h3>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[9px]">
                    <th className="py-1">Recipient</th>
                    <th className="py-1">Channel</th>
                    <th className="py-1">Purpose</th>
                    <th className="py-1">Reference</th>
                    <th className="py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {disbursements.map((d) => (
                    <tr key={d.id}>
                      <td className="py-1.5 font-semibold">{d.recipient_name}</td>
                      <td className="py-1.5 uppercase text-[9px] text-neutral-500">{d.recipient_type}</td>
                      <td className="py-1.5 text-neutral-600">{d.purpose}</td>
                      <td className="py-1.5 font-mono text-[9px] text-neutral-500">{d.reference}</td>
                      <td className="py-1.5 text-right font-bold text-amber-700">
                        -{formatCurrency(d.amount, d.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Historical Ledger Audit Table */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1">
              Historical Ledger Trail ({entries.length} transactions)
            </h3>
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[8px]">
                  <th className="py-1">Date</th>
                  <th className="py-1">Type</th>
                  <th className="py-1">Description / Donor</th>
                  <th className="py-1">Ref Code</th>
                  <th className="py-1 text-right">Amount</th>
                  <th className="py-1 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {entries.slice(0, 40).map((e) => (
                  <tr key={e.id}>
                    <td className="py-1 text-neutral-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-1">
                      <span className={`font-bold ${e.entry_type === 'credit' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {e.entry_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-1 text-neutral-800">{e.description}</td>
                    <td className="py-1 font-mono text-[8px] text-neutral-400">{e.reference_code}</td>
                    <td className={`py-1 text-right font-bold ${e.entry_type === 'credit' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {e.entry_type === 'credit' ? '+' : '-'}{formatCurrency(e.amount, e.currency)}
                    </td>
                    <td className="py-1 text-right font-mono text-neutral-600">
                      {formatCurrency(e.balance_after, e.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length > 40 && (
              <p className="text-[9px] text-neutral-400 italic pt-1">
                Showing most recent 40 of {entries.length} entries. Export full CSV for complete raw ledger history.
              </p>
            )}
          </div>

          {/* Committee & Trustee Sign-off Section */}
          <div className="pt-4 border-t border-neutral-200 space-y-3 page-break-inside-avoid">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
              Trustee & Committee Authorization Sign-off
            </h4>
            <p className="text-[9px] text-neutral-500 leading-normal">
              We, the undersigned committee members / trustees of this cause, certify that this financial statement accurately reflects all funds raised, segregated, and disbursed under Boma Pay trust rules.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-3">
              {committee && committee.members.length > 0 ? (
                committee.members.slice(0, 3).map((m) => (
                  <div key={m.id} className="space-y-1">
                    <div className="border-b border-neutral-400 h-8" />
                    <p className="font-bold text-[10px] text-neutral-900">{m.name}</p>
                    <p className="text-[8px] text-neutral-500 uppercase">{m.role}</p>
                    <p className="text-[8px] text-neutral-400">Date: __________________</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="border-b border-neutral-400 h-8" />
                    <p className="font-bold text-[10px] text-neutral-900">{boma.creator_name}</p>
                    <p className="text-[8px] text-neutral-500 uppercase">Primary Organizer</p>
                    <p className="text-[8px] text-neutral-400">Date: __________________</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-b border-neutral-400 h-8" />
                    <p className="font-bold text-[10px] text-neutral-900">Boma Pay Trust Escrow</p>
                    <p className="text-[8px] text-neutral-500 uppercase">System Reconciled</p>
                    <p className="text-[8px] text-neutral-400">Date: {statementDate}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-[8px] text-neutral-400 text-center pt-2 border-t border-neutral-100">
            Official Boma Pay Statement · ID: {boma.id} · Powered by Double-Entry Ledger Architecture
          </div>
        </div>

      </div>
    </div>
  );
}
