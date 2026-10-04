'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boma, Transaction, PlatformStats, Account, LedgerEntry, Disbursement } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { formatPhoneDisplay } from '@/lib/utils/phone';
import BomaCard from '@/components/boma-card';
import ContributionModal from '@/components/contribution-modal';
import ShareModal from '@/components/share-modal';
import ChamaStatementModal from '@/components/chama-statement-modal';
import { 
  BuildingLibraryIcon, 
  WalletIcon, 
  UsersIcon, 
  CreditCardIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  DocumentTextIcon,
  SmartphoneIcon,
  SearchIcon
} from '@/components/ui/icons';

export default function HomePage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedBomaForModal, setSelectedBomaForModal] = useState<Boma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareBoma, setShareBoma] = useState<Boma | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [statementData, setStatementData] = useState<{
    boma: Boma;
    account: Account;
    entries: LedgerEntry[];
    disbursements: Disbursement[];
  } | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  const loadData = async () => {
    try {
      const [list, platformStats] = await Promise.all([
        bomaService.getBomas(),
        bomaService.getPlatformStats(),
      ]);
      setBomas(list);
      setStats(platformStats);

      const allTxns: Transaction[] = [];
      for (const b of list) {
        const txns = await bomaService.getBomaTransactions(b.id);
        allTxns.push(...txns);
      }
      allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTxns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleContribute = (boma: Boma) => {
    setSelectedBomaForModal(boma);
    setIsModalOpen(true);
  };

  const handleOpenStatement = async () => {
    if (bomas.length > 0) {
      const targetBoma = bomas[0];
      const result = await bomaService.getBomaById(targetBoma.id);
      if (result) {
        const entries = await bomaService.getBomaLedger(targetBoma.id);
        const disbs = await bomaService.getBomaDisbursements(targetBoma.id);
        setStatementData({
          boma: result.boma,
          account: result.account,
          entries,
          disbursements: disbs,
        });
        setIsStatementOpen(true);
      }
    } else {
      alert('Start a fund first to generate official audit statements.');
    }
  };

  const totalVaultBalance = bomas.reduce((acc, b) => acc + (Number(b.current_amount) || 0), 0);
  const totalMembers = bomas.reduce((acc, b) => acc + (Number(b.contributors_count) || 0), 0);

  return (
    <div className="w-full min-w-0 px-5 sm:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
      <div className="w-full max-w-7xl space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight">
              Platform Overview
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenStatement}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <DocumentTextIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Statement</span>
            </button>

            <Link
              href="/bomas/create"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Start a Fund</span>
            </Link>
          </div>
        </div>

        {/* 4 Key Executive Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Capital Raised</span>
              <WalletIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {formatCurrency(totalVaultBalance, 'KES')}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Audited across all funds
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Campaigns</span>
              <BuildingLibraryIcon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {bomas.length}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Transparent community pools
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Contributors</span>
              <UsersIcon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {totalMembers}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Verified legal identities
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Ledger Transactions</span>
              <CreditCardIcon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
              {transactions.length}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Zero anonymous transactions
            </span>
          </div>
        </div>

        {/* 2-Column Enterprise Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main 8-Column Area: Active Funds Grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Active Funds Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Active Community Funds
                  </h2>
                </div>

                <Link
                  href="/bomas"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Explore all</span>
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-mono">
                  Loading campaigns...
                </div>
              ) : bomas.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
                  <BuildingLibraryIcon className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-800">No active campaigns</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Start your first community fund or chama to begin tracking pooled contributions transparently.
                  </p>
                  <Link
                    href="/bomas/create"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Start a Fund</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bomas.slice(0, 4).map((boma) => (
                    <BomaCard
                      key={boma.id}
                      boma={boma}
                      onContributeClick={handleContribute}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Ledger Entries Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Recent Contribution Ledger
                  </h2>
                </div>

                <Link
                  href="/admin/ledger"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Full Ledger</span>
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-2">Contributor</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Reference</th>
                        <th className="pb-2 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 5).map((tx) => (
                        <tr key={tx.id || tx.reference} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-semibold">
                                {tx.contributor_name.charAt(0).toUpperCase()}
                              </span>
                              <span>{tx.contributor_name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 font-mono font-semibold text-slate-900">
                            {formatCurrency(tx.amount, tx.currency)}
                          </td>
                          <td className="py-2.5 font-mono text-[11px] text-slate-500">
                            {tx.reference}
                          </td>
                          <td className="py-2.5 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right 4-Column Area: Treasury & Settlement Status */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Settlement Status Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settlement Status</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Clearing
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">M-Pesa Gateway</span>
                  <span className="font-semibold text-slate-800">Safaricom Direct</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Central Merchant ID</span>
                  <span className="font-mono text-slate-800">1938784</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Disbursement Mode</span>
                  <span className="font-semibold text-slate-800">Subaccount Splits</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/admin/subaccounts"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <SmartphoneIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Configure Subaccounts</span>
                </Link>
              </div>
            </div>

            {/* Quick Access Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Navigation</span>
              
              <div className="space-y-1 pt-1">
                <Link
                  href="/admin/users"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs text-slate-700 transition-colors group"
                >
                  <span className="font-medium group-hover:text-slate-900">Member Directory</span>
                  <ArrowUpRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </Link>
                <Link
                  href="/admin/approvals"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs text-slate-700 transition-colors group"
                >
                  <span className="font-medium group-hover:text-slate-900">Signup Approvals Queue</span>
                  <ArrowUpRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </Link>
                <Link
                  href="/admin/ledger"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs text-slate-700 transition-colors group"
                >
                  <span className="font-medium group-hover:text-slate-900">Double-Entry Ledger Audit</span>
                  <ArrowUpRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* Modals */}
        {selectedBomaForModal && (
          <ContributionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            boma={selectedBomaForModal}
            onSuccess={loadData}
          />
        )}

        {shareBoma && (
          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            boma={shareBoma}
          />
        )}

        {statementData && statementData.boma && (
          <ChamaStatementModal
            isOpen={isStatementOpen}
            onClose={() => setIsStatementOpen(false)}
            boma={statementData.boma}
            account={statementData.account}
            entries={statementData.entries}
            disbursements={statementData.disbursements}
          />
        )}

      </div>
    </div>
  );
}
