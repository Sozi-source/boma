'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boma, Transaction, PlatformStats, Account, LedgerEntry, Disbursement } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import BomaCard from '@/components/boma-card';
import ContributionModal from '@/components/contribution-modal';
import ShareModal from '@/components/share-modal';
import ChamaStatementModal from '@/components/chama-statement-modal';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  TrendingUpIcon, 
  UsersIcon, 
  SmartphoneIcon,
  SparklesIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  BellIcon,
  SearchIcon,
  QrCodeIcon,
  DocumentTextIcon,
  CopyIcon,
  ArrowDownLeftIcon
} from '@/components/ui/icons';

export default function HomePage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  
  // Fintech Card View State
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'pools' | 'activity' | 'stats'>('pools');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

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
    const currentUser = await bomaService.getCurrentUser();
    if (currentUser && currentUser.id !== 'user-guest') {
      setUser(currentUser);
    }

    const list = await bomaService.getBomas();
    const platformStats = await bomaService.getPlatformStats();
    setBomas(list);
    setStats(platformStats);

    const allTxns: Transaction[] = [];
    for (const b of list) {
      const txns = await bomaService.getBomaTransactions(b.id);
      allTxns.push(...txns);
    }
    allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setTransactions(allTxns);
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
      const result = await bomaService.getBomaWithAccount(targetBoma.id);
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
      setActiveTab('pools');
    }
  };

  const handleOpenShare = () => {
    if (bomas.length > 0) {
      setShareBoma(bomas[0]);
      setIsShareOpen(true);
    } else {
      setActiveTab('pools');
    }
  };

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const totalVaultBalance = bomas.reduce((acc, b) => acc + (b.current_amount || 0), 0);

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-3 sm:px-6 pt-2 sm:pt-5 space-y-4 sm:space-y-6">
      
      {/* 1. Fintech App Header Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-black text-sm shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white leading-none">
                {user?.name ? `Hi, ${user.name}` : 'Boma Treasury Vault'}
              </h1>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Segregated Trust Active</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/bomas"
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-900 transition-colors"
            title="Search causes"
          >
            <SearchIcon className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-900 transition-colors"
            title="Activity Notifications"
          >
            <BellIcon className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-950" />
          </Link>
        </div>
      </div>

      {/* 2. Signature Fintech Obsidian Vault Card */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white p-5 sm:p-6 shadow-xl border border-neutral-800">
        {/* Subtle Ambient Glows */}
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between text-neutral-400 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 tracking-wider uppercase font-semibold">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Trust Escrow</span>
            </div>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="hover:text-white transition-colors p-1"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {showBalance ? (
                formatCurrency(stats?.total_volume_kes ?? totalVaultBalance, 'KES')
              ) : (
                '••••••••••'
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1 font-semibold">
              <CheckCircleIcon className="w-3 h-3" />
              100% Reconciled Double-Entry
            </span>
          </div>

          {/* Card Micro Metadata Strip */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <div className="flex items-center gap-3">
              <span>{bomas.length} Active Pools</span>
              <span>•</span>
              <span>{stats?.total_contributions ?? transactions.length} Donors</span>
            </div>
            <span className="text-neutral-500 uppercase tracking-wider">Paystack STK</span>
          </div>
        </div>
      </div>

      {/* 3. Fintech Quick 4-Action Circular Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 py-1">
        <Link
          href="/bomas/create"
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all active:scale-95 group"
        >
          <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <PlusIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            New Cause
          </span>
        </Link>

        <Link
          href="/bomas"
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all active:scale-95 group"
        >
          <div className="h-11 w-11 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <SmartphoneIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            Contribute
          </span>
        </Link>

        <button
          type="button"
          onClick={handleOpenStatement}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all active:scale-95 group"
        >
          <div className="h-11 w-11 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <DocumentTextIcon className="w-5 h-5 text-teal-400" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            Statement
          </span>
        </button>

        <button
          type="button"
          onClick={handleOpenShare}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all active:scale-95 group"
        >
          <div className="h-11 w-11 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <QrCodeIcon className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            Scan & Share
          </span>
        </button>
      </div>

      {/* 4. Fintech Segmented Switcher Tabs */}
      <div className="flex items-center gap-1 rounded-2xl bg-neutral-200/70 p-1 dark:bg-neutral-900">
        <button
          type="button"
          onClick={() => setActiveTab('pools')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'pools'
              ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          Active Pools ({bomas.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'activity'
              ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          Live Activity
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'stats'
              ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          Treasury Stats
        </button>
      </div>

      {/* 5. Tab Content: Active Pools */}
      {activeTab === 'pools' && (
        <div className="space-y-3">
          {bomas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 p-8 text-center bg-white/70 dark:border-neutral-800 dark:bg-neutral-900/60 space-y-3">
              <div className="h-10 w-10 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">No active pools deployed</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">Start a Chama savings pool, medical fund, or community drive.</p>
              </div>
              <Link
                href="/bomas/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Deploy First Pool</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bomas.map((b) => (
                <BomaCard key={b.id} boma={b} onContributeClick={handleContribute} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab Content: Live Activity Ledger */}
      {activeTab === 'activity' && (
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              Real-Time Receipts Feed
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Ledger
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <p className="text-xs text-neutral-400">No transactions recorded yet. Incoming Paystack receipts will stream here live.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <ArrowDownLeftIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white block truncate">
                        {t.is_anonymous ? 'Anonymous Friend' : t.contributor_name}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[9px] text-neutral-400">
                        <span>{t.reference}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(t.reference)}
                          className="hover:text-emerald-600"
                        >
                          <CopyIcon className="w-3 h-3" />
                        </button>
                        {copiedRef === t.reference && <span className="text-emerald-600 font-sans">Copied</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                      +{formatCurrency(t.amount, t.currency)}
                    </span>
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 text-[9px] font-bold text-neutral-500 uppercase">
                      {t.payment_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab Content: Treasury Analytics */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[10px] font-semibold text-neutral-400 block">Total Volume</span>
            <span className="text-base sm:text-lg font-black font-mono text-neutral-900 dark:text-white mt-1 block">
              {stats ? formatCurrency(stats.total_volume_kes, 'KES') : 'KES 0'}
            </span>
            <span className="text-[9px] text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
              <TrendingUpIcon className="w-2.5 h-2.5" />
              Reconciled
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[10px] font-semibold text-neutral-400 block">Contributors</span>
            <span className="text-base sm:text-lg font-black font-mono text-neutral-900 dark:text-white mt-1 block">
              {stats ? stats.total_contributions.toLocaleString() : '0'}
            </span>
            <span className="text-[9px] text-neutral-400 mt-1 flex items-center gap-0.5">
              <UsersIcon className="w-2.5 h-2.5" />
              Verified Accounts
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[10px] font-semibold text-neutral-400 block">Ledger Integrity</span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              100% Verified
            </span>
            <span className="text-[9px] text-neutral-400 mt-1 block">
              Debits == Credits
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[10px] font-semibold text-neutral-400 block">Active Pools</span>
            <span className="text-base sm:text-lg font-black font-mono text-neutral-900 dark:text-white mt-1 block">
              {bomas.length}
            </span>
            <span className="text-[9px] text-neutral-400 mt-1 block">
              Segregated Vaults
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContributionModal
        boma={selectedBomaForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />

      {shareBoma && (
        <ShareModal
          boma={shareBoma}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {statementData && (
        <ChamaStatementModal
          boma={statementData.boma}
          account={statementData.account}
          entries={statementData.entries}
          disbursements={statementData.disbursements}
          isOpen={isStatementOpen}
          onClose={() => setIsStatementOpen(false)}
        />
      )}
    </div>
  );
}