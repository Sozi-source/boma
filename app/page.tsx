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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
      setActiveTab('pools');
      showToast('Start your first Fund to generate official statements.');
    }
  };

  const handleOpenShare = () => {
    if (bomas.length > 0) {
      setShareBoma(bomas[0]);
      setIsShareOpen(true);
    } else {
      setActiveTab('pools');
      showToast('Start your first Fund to share with members.');
    }
  };

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const totalVaultBalance = bomas.reduce((acc, b) => acc + (Number(b.current_amount) || 0), 0);
  const totalMembers = bomas.reduce((acc, b) => acc + (Number(b.contributors_count) || 0), 0) || transactions.length;

  return (
    <div className="mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-6xl px-3 sm:px-6 pt-3 sm:pt-5 lg:pt-8 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8 lg:items-start relative">
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-neutral-900 text-white px-4 py-2 text-xs font-semibold shadow-xl border border-neutral-700 animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}
      <aside className="space-y-4 lg:sticky lg:top-20">
      
      {/* 1. Fintech App Header Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black text-neutral-900 leading-none">
                {user?.name ? `Hi, ${user.name}` : 'Boma'}
              </h1>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Your funds</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/bomas"
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Search contributions"
          >
            <SearchIcon className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Activity Notifications"
          >
            <BellIcon className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white " />
          </Link>
        </div>
      </div>

      {/* 2. Vault Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 text-neutral-900 border border-emerald-200 p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 tracking-wider uppercase font-semibold">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Total raised</span>
            </div>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="hover:text-neutral-900 transition-colors p-1"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-emerald-800">
              {showBalance ? (
                formatCurrency(totalVaultBalance, 'KES')
              ) : (
                '••••••••••'
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono mt-1 font-semibold">
              <CheckCircleIcon className="w-3 h-3" />
              Across all your funds
            </span>
          </div>

          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
            <div className="flex items-center gap-3">
              <span>{bomas.length} Funds</span>
              <span>•</span>
              <span>{totalMembers} Members</span>
            </div>
            <span className="inline-flex items-center gap-1 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              M-Pesa
            </span>
          </div>
        </div>
      </div>

      {/* 3. Fintech Quick 4-Action Circular Grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 py-1">
        <Link
          href="/bomas/create"
          className="flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl hover:bg-neutral-100 transition-all active:scale-95 group text-center"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <PlusIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 whitespace-nowrap">
            Start
          </span>
        </Link>

        <Link
          href="/bomas"
          className="flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl hover:bg-neutral-100 transition-all active:scale-95 group text-center"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 flex items-center justify-center group-hover:scale-105 transition-transform">
            <SmartphoneIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 whitespace-nowrap">
            Contribute
          </span>
        </Link>

        <button
          type="button"
          onClick={handleOpenStatement}
          className="flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl hover:bg-neutral-100 transition-all active:scale-95 group text-center"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 flex items-center justify-center group-hover:scale-105 transition-transform">
            <DocumentTextIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 whitespace-nowrap">
            Statement
          </span>
        </button>

        <button
          type="button"
          onClick={handleOpenShare}
          className="flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl hover:bg-neutral-100 transition-all active:scale-95 group text-center"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 flex items-center justify-center group-hover:scale-105 transition-transform">
            <QrCodeIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 whitespace-nowrap">
            Share
          </span>
        </button>
      </div>

      </aside>
      <section className="mt-4 lg:mt-0 space-y-4 min-w-0">
      {/* 4. Fintech Segmented Switcher Tabs */}
      <div className="flex items-center gap-1 rounded-2xl bg-neutral-200/70 p-1 ">
        <button
          type="button"
          onClick={() => setActiveTab('pools')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'pools'
              ? 'bg-white text-neutral-900 shadow-xs '
              : 'text-neutral-500 hover:text-neutral-900 '
          }`}
        >
          Funds ({bomas.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'activity'
              ? 'bg-white text-neutral-900 shadow-xs '
              : 'text-neutral-500 hover:text-neutral-900 '
          }`}
        >
          Activity
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'stats'
              ? 'bg-white text-neutral-900 shadow-xs '
              : 'text-neutral-500 hover:text-neutral-900 '
          }`}
        >
          Stats
        </button>
      </div>

      {/* 5. Tab Content: Active Pools */}
      {activeTab === 'pools' && (
        <div className="space-y-3">
          {bomas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 p-8 text-center bg-white/70 space-y-3">
              <div className="h-10 w-10 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 ">No funds yet</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">Start a Fund for a family need, wedding, birthday, funeral or school fees.</p>
              </div>
              <Link
                href="/bomas/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Start your first Fund</span>
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

      {/* 6. Tab Content: Activity Ledger */}
      {activeTab === 'activity' && (
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 ">
              Recent contributions
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Ledger
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-neutral-200 rounded-2xl">
              <p className="text-xs text-neutral-400">No transactions recorded yet. Incoming Paystack receipts will stream here live.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 ">
              {transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                      <ArrowDownLeftIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-neutral-900 block truncate">
                        {t.is_anonymous ? 'Anonymous Friend' : t.contributor_name}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[9px] text-neutral-400">
                        <span>{t.reference}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(t.reference)}
                          className="hover:text-emerald-700"
                        >
                          <CopyIcon className="w-3 h-3" />
                        </button>
                        {copiedRef === t.reference && <span className="text-emerald-700 font-sans">Copied</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black font-mono text-emerald-700 block">
                      +{formatCurrency(t.amount, t.currency)}
                    </span>
                    <span className="rounded bg-neutral-100 px-1 py-0.5 text-[9px] font-bold text-neutral-500 uppercase">
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
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 ">
            <span className="text-[10px] font-semibold text-neutral-400 block">Total Volume</span>
            <span className="text-base sm:text-lg font-black font-mono text-neutral-900 mt-1 block">
              {formatCurrency(stats?.total_volume_kes || totalVaultBalance, 'KES')}
            </span>
            <span className="text-[9px] text-emerald-700 font-medium mt-1 flex items-center gap-0.5">
              <TrendingUpIcon className="w-2.5 h-2.5" />
              Total raised
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 ">
            <span className="text-[10px] font-semibold text-neutral-400 block">Contributors</span>
            <span className="text-base sm:text-lg font-black font-mono text-neutral-900 mt-1 block">
              {(stats?.total_contributions || totalMembers).toLocaleString()}
            </span>
            <span className="text-[9px] text-neutral-400 mt-1 flex items-center gap-0.5">
              <UsersIcon className="w-2.5 h-2.5" />
              Members
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 ">
            <span className="text-[10px] font-semibold text-neutral-400 block">Contributions</span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-700 mt-1 block">
              {transactions.length}
            </span>
            <span className="text-[9px] text-neutral-400 mt-1 block">
              Recorded
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 ">
            <span className="text-[10px] font-semibold text-neutral-400 block">Funds</span>
            <span className="text-base sm:text-lg font-black font-mono text-neutral-900 mt-1 block">
              {bomas.length}
            </span>
            <span className="text-[9px] text-neutral-400 mt-1 block">
              Contributions
            </span>
          </div>
        </div>
      )}

      </section>

      {/* Modals */}
      <ContributionModal
        boma={selectedBomaForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
