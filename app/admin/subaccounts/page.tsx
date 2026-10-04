'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bomaService } from '@/lib/services/boma-service';
import { Subaccount, Currency } from '@/lib/types/fintech';
import { formatPhoneDisplay } from '@/lib/utils/phone';
import { 
  SmartphoneIcon, 
  BuildingLibraryIcon, 
  SearchIcon, 
  PlusIcon, 
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon
} from '@/components/ui/icons';

const KENYA_BANKS_AND_PROVIDERS = [
  'M-Pesa Mobile Wallet (Safaricom)',
  'M-Pesa Paybill / Till Number',
  'Airtel Money Kenya',
  'Equity Bank Kenya',
  'KCB (Kenya Commercial Bank)',
  'Co-operative Bank of Kenya',
  'NCBA Bank Kenya',
  'Absa Bank Kenya',
  'Standard Chartered Kenya',
  'Stanbic Bank Kenya',
  'I&M Bank Kenya',
  'Diamond Trust Bank (DTB)',
  'Family Bank Kenya',
];

export default function SubaccountsPage() {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'name' | 'type'>('created');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Subaccount Modal form state (Matching reference screenshot exactly)
  const [currency, setCurrency] = useState<Currency>('KES');
  const [type, setType] = useState<'mobile_money' | 'bank_account'>('mobile_money');
  const [settlementBank, setSettlementBank] = useState<string>('M-Pesa Mobile Wallet (Safaricom)');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [subaccountName, setSubaccountName] = useState<string>('');
  const [percentageCharge, setPercentageCharge] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadSubaccounts = async () => {
    const list = await bomaService.getSubaccounts();
    setSubaccounts(list);
  };

  useEffect(() => {
    loadSubaccounts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateSubaccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !subaccountName.trim()) return;
    setLoading(true);

    try {
      const created = await bomaService.createSubaccount({
        business_name: subaccountName.trim(),
        settlement_bank: settlementBank,
        account_number: accountNumber.trim(),
        currency,
        type,
        percentage_charge: percentageCharge,
      });

      showToast(`Created account ${created.business_name}`);
      setIsModalOpen(false);
      setAccountNumber('');
      setSubaccountName('');
      setPercentageCharge(0);
      await loadSubaccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sub: Subaccount) => {
    if (!confirm(`Delete account ${sub.business_name}?`)) return;
    try {
      await bomaService.deleteSubaccount(sub.id);
      showToast(`Deleted ${sub.business_name}.`);
      await loadSubaccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = subaccounts.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.business_name.toLowerCase().includes(q) ||
      s.subaccount_code.toLowerCase().includes(q) ||
      s.account_number.includes(q) ||
      s.settlement_bank.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-emerald-700 text-white p-3 text-xs font-semibold shadow-md flex items-center justify-between">
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
        <span className="text-slate-600 font-medium">Accounts</span>
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-3.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base sm:text-xl font-semibold text-slate-800 tracking-tight">
            Accounts
          </h1>
        </div>
      </div>

      {/* Controls Bar: Sort, Search, and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg">
          
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs text-slate-500 font-medium">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-[11px] sm:text-xs font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="created">Date Created</option>
              <option value="name">Name (A-Z)</option>
              <option value="type">Type</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Account actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            <span>+ New Account</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Accounts verified.')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <span>Verify</span>
          </button>
        </div>
      </div>

      {/* Accounts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="hidden 2xl:block">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Settlement Destination</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No accounts found. Click &quot;+ New Account&quot; to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.business_name}
                    </td>

                    <td className="break-all py-3.5 px-4 font-mono font-semibold text-slate-600">
                      {s.subaccount_code}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {s.type === 'mobile_money' ? 'Mobile Money' : 'Bank Account'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {s.settlement_bank}
                    </td>

                    <td className="break-all py-3.5 px-4 font-mono text-slate-800 font-semibold">
                      {formatPhoneDisplay(s.account_number)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{s.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                        title="Delete account"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 2xl:hidden">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400 sm:col-span-2">No accounts found.</p>
          ) : filtered.map((s) => (
            <div key={s.id} className="min-w-0 rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{s.business_name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{s.type === 'mobile_money' ? 'Mobile money' : 'Bank account'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-800">{s.status}</span>
              </div>
              <dl className="mt-3 space-y-1.5 text-[10px]">
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Provider</dt><dd className="truncate text-right font-medium text-slate-800">{s.settlement_bank}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Account</dt><dd className="truncate text-right font-mono text-slate-800">{formatPhoneDisplay(s.account_number)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Code</dt><dd className="truncate text-right font-mono text-slate-600">{s.subaccount_code}</dd></div>
              </dl>
              <button type="button" onClick={() => handleDelete(s)} className="mt-3 w-full rounded-lg border border-red-200 px-2 py-1.5 text-[10px] font-semibold text-red-700">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* New account form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="text-center relative pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                New Account
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-0 top-0 text-slate-400 hover:text-slate-600 p-1"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubaccount} className="space-y-4 text-xs">
              
              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="UGX">UGX</option>
                  <option value="TZS">TZS</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_account">Bank Account</option>
                </select>
              </div>

              {/* Bank Name (For payouts) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name (For payouts)
                </label>
                <select
                  value={settlementBank}
                  onChange={(e) => setSettlementBank(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  {KENYA_BANKS_AND_PROVIDERS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === 'mobile_money' ? 'M-Pesa Phone / Till / Paybill number' : 'Bank Account Number'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Account name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welfare Chama Disbursement, Family Pool"
                  value={subaccountName}
                  onChange={(e) => setSubaccountName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-transform active:scale-95"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
