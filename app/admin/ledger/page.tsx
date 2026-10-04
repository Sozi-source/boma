'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bomaService } from '@/lib/services/boma-service';
import { LedgerEntry, Boma, Transaction, UserProfile } from '@/lib/types/fintech';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { phoneListIncludes, formatPhoneDisplay } from '@/lib/utils/phone';
import { 
  BuildingLibraryIcon, 
  SearchIcon, 
  ArrowUpRightIcon, 
  ArrowDownLeftIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  UsersIcon
} from '@/components/ui/icons';

export default function AdminLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit' | 'unclaimed'>('all');
  const [loading, setLoading] = useState(true);
  const [linkingTx, setLinkingTx] = useState<{ phone: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadLedgerData = async () => {
    try {
      const [allBomas, localUsers] = await Promise.all([
        bomaService.getBomas(),
        bomaService.getUsers(),
      ]);
      let allUsers = localUsers;
      try {
        const response = await fetch('/api/admin/profiles', { cache: 'no-store' });
        if (response.ok) {
          const { users: profiles } = await response.json();
          const registeredUsers: UserProfile[] = profiles.map((profile: {
            id: string; full_name: string; email: string | null; phone: string | null;
            role: string; created_at: string;
          }) => ({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email || '',
            phones: profile.phone ? [profile.phone] : [],
            role: profile.role === 'admin' ? 'admin' : 'organizer',
            status: 'active',
            created_at: profile.created_at,
          }));
          allUsers = [...registeredUsers, ...localUsers.filter((user) => !registeredUsers.some((registered) => registered.id === user.id))];
        }
      } catch {
        // Keep locally managed accounts available if registered accounts cannot be loaded.
      }
      bomaService.syncRegisteredUsers(allUsers.filter((user) => /^[0-9a-f-]{36}$/i.test(user.id)));
      const allTxns = await bomaService.getAllTransactions();
      setBomas(allBomas);
      setTransactions(allTxns);
      setUsers(allUsers);

      const allEntries: LedgerEntry[] = [];
      for (const b of allBomas) {
        const bomaEntries = await bomaService.getBomaLedger(b.id);
        allEntries.push(...bomaEntries);
      }
      allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEntries(allEntries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'unclaimed') {
        setTypeFilter('unclaimed');
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLinkPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingTx || !selectedUserId) return;

    try {
      if (/^[0-9a-f-]{36}$/i.test(selectedUserId)) {
        const response = await fetch('/api/admin/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUserId, phone: linkingTx.phone }),
        });
        if (!response.ok) throw new Error('Could not link this phone to the account');
      } else {
        await bomaService.addPhoneToUser(selectedUserId, linkingTx.phone);
      }
      showToast('Phone linked to account');
      setLinkingTx(null);
      setSelectedUserId('');
      await loadLedgerData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to link phone');
    }
  };

  const getEntryTransaction = (entry: LedgerEntry) => {
    return transactions.find((t) => t.id === entry.transaction_id || t.reference === entry.reference_code);
  };

  const isEntryUnclaimed = (entry: LedgerEntry) => {
    if (entry.entry_type !== 'credit') return false;
    const tx = getEntryTransaction(entry);
    if (!tx || !tx.contributor_phone) return false;
    const hasMatchedUser = users.some((u) => phoneListIncludes(u.phones, tx.contributor_phone!));
    return !hasMatchedUser;
  };

  const unclaimedCount = entries.filter((e) => isEntryUnclaimed(e)).length;

  const totalCredits = entries.filter((e) => e.entry_type === 'credit').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalDebits = entries.filter((e) => e.entry_type === 'debit').reduce((acc, e) => acc + Number(e.amount), 0);
  const netPlatformBalance = totalCredits - totalDebits;

  const filteredEntries = entries.filter((e) => {
    if (typeFilter === 'unclaimed') {
      if (!isEntryUnclaimed(e)) return false;
    } else if (typeFilter !== 'all') {
      if (e.entry_type !== typeFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tx = getEntryTransaction(e);
      const phoneMatch = tx?.contributor_phone && tx.contributor_phone.includes(q);
      return (
        e.description.toLowerCase().includes(q) ||
        e.reference_code.toLowerCase().includes(q) ||
        Boolean(phoneMatch)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-lg bg-emerald-700 text-white p-3 text-xs font-semibold shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-emerald-700 font-medium transition-colors">
          ← Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">Central Ledger</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-3.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base sm:text-xl font-semibold text-slate-800 tracking-tight">
            Fund Activity
          </h1>
          <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono font-medium px-2 py-0.5">
            Immutable
          </span>
        </div>
      </div>

      {/* Metric Cards — Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-medium">
            <span className="truncate">Total Credits In</span>
            <ArrowDownLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <span className="text-base sm:text-2xl font-semibold text-slate-900 font-mono mt-1.5 sm:mt-2 block truncate">
            {formatCurrency(totalCredits, 'KES')}
          </span>
          <span className="text-[9.5px] sm:text-[11px] text-slate-400 mt-1 block font-mono truncate">
            {entries.filter((e) => e.entry_type === 'credit').length} credit postings
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-medium">
            <span className="truncate">Total Debits Out</span>
            <ArrowUpRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </div>
          <span className="text-base sm:text-2xl font-semibold text-slate-900 font-mono mt-1.5 sm:mt-2 block truncate">
            {formatCurrency(totalDebits, 'KES')}
          </span>
          <span className="text-[9.5px] sm:text-[11px] text-slate-400 mt-1 block font-mono truncate">
            {entries.filter((e) => e.entry_type === 'debit').length} disbursements
          </span>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-medium">
            <span className="truncate">Net Vault Available</span>
            <BuildingLibraryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <span className="text-base sm:text-2xl font-semibold text-slate-900 font-mono mt-1.5 sm:mt-2 block truncate">
            {formatCurrency(netPlatformBalance, 'KES')}
          </span>
          <span className="text-[9.5px] sm:text-[11px] text-emerald-700 font-medium mt-1 block truncate">
            Reconciled across {bomas.length} funds
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, reference, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['all', 'credit', 'debit'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold capitalize transition-all ${
                  typeFilter === t
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setTypeFilter('unclaimed')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold capitalize transition-all flex items-center gap-1.5 ${
                typeFilter === 'unclaimed'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <span>Unclaimed</span>
              {unclaimedCount > 0 && (
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  typeFilter === 'unclaimed' ? 'bg-slate-900 text-amber-300' : 'bg-amber-200 text-amber-900'
                }`}>
                  {unclaimedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2 2xl:hidden">
          {loading ? (
            <p className="py-8 text-center text-xs text-slate-400">Loading activity...</p>
          ) : filteredEntries.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">{typeFilter === 'unclaimed' ? 'All contributions are linked to member accounts.' : 'No activity found.'}</p>
          ) : filteredEntries.map((e) => {
            const isCredit = e.entry_type === 'credit';
            const tx = getEntryTransaction(e);
            const unclaimed = isEntryUnclaimed(e);
            return (
              <article key={e.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold text-slate-900">{e.description}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${isCredit ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {isCredit ? '+' : '-'}{formatCurrency(e.amount, e.currency)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px]">
                  <span className="text-slate-500">Balance {formatCurrency(e.balance_after, e.currency)}</span>
                  {unclaimed && tx?.contributor_phone ? (
                    <button type="button" onClick={() => setLinkingTx({ phone: tx.contributor_phone! })} className="font-semibold text-emerald-700">Link {formatPhoneDisplay(tx.contributor_phone)}</button>
                  ) : tx?.contributor_phone ? (
                    <span className="text-emerald-700">Member linked</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden 2xl:block">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Description &amp; Attribution</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Vault Balance After</th>
                <th className="py-2.5 px-3">Reference Code</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-mono">
                    Loading ledger entries...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    {typeFilter === 'unclaimed' ? 'All contributions are fully reconciled to registered users.' : 'No ledger entries recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => {
                  const isCredit = e.entry_type === 'credit';
                  const tx = getEntryTransaction(e);
                  const unclaimed = isEntryUnclaimed(e);

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase font-mono ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isCredit ? '+ credit' : '- debit'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-900 max-w-md">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{e.description}</span>
                            {unclaimed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-mono">
                                <AlertCircleIcon className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Unclaimed: {formatPhoneDisplay(tx?.contributor_phone || '')}</span>
                              </span>
                            ) : isCredit && tx?.contributor_phone ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                <CheckCircleIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Auto-Reconciled</span>
                              </span>
                            ) : null}
                          </div>
                          {unclaimed && tx?.contributor_phone && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <button
                                type="button"
                                onClick={() => setLinkingTx({ phone: tx.contributor_phone! })}
                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                              >
                                <UsersIcon className="w-3 h-3" />
                                <span>Link phone line to user profile &rarr;</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold">
                        <span className={isCredit ? 'text-emerald-700' : 'text-slate-900'}>
                          {isCredit ? '+' : '-'}{formatCurrency(e.amount, e.currency)}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatCurrency(e.balance_after, e.currency)}
                      </td>

                      <td className="break-all py-3 px-3 font-mono text-[11px] text-slate-500">
                        {e.reference_code}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400">
                        {new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Link Unclaimed Line Modal */}
      {linkingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Link phone
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkingTx(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">{formatPhoneDisplay(linkingTx.phone)}</p>
              <form onSubmit={handleLinkPhone} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                  >
                    <option value="">Choose account</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}{u.email ? ` · ${u.email}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setLinkingTx(null)}
                    className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
                  >
                    Link phone
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
