'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bomaService } from '@/lib/services/boma-service';
import { UserProfile, SignupRequest, Transaction, Boma, UserRole } from '@/lib/types/fintech';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { formatPhoneDisplay } from '@/lib/utils/phone';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  WalletIcon, 
  TrendingUpIcon, 
  CheckCircleIcon,
  ClockIcon,
  SmartphoneIcon,
  PlusIcon,
  ArrowUpRightIcon,
  XMarkIcon
} from '@/components/ui/icons';

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SignupRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Quick Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSecondaryPhone, setNewSecondaryPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('organizer');
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = async () => {
    try {
      const [u, reqs, txs, b] = await Promise.all([
        bomaService.getUsers(),
        bomaService.getSignupRequests('pending_approval'),
        bomaService.getAllTransactions(),
        bomaService.getBomas(),
      ]);
      setUsers(u);
      setPendingRequests(reqs);
      setTransactions(txs);
      setBomas(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (reqId: string, name: string) => {
    try {
      await bomaService.approveSignupRequest(reqId, 'Sozi Admin');
      setActionNotice(`Approved ${name} — account is active and all phone lines are now recognized.`);
      setTimeout(() => setActionNotice(null), 4000);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  const handleReject = async (reqId: string, name: string) => {
    if (!confirm(`Are you sure you want to reject the signup request for ${name}?`)) return;
    try {
      await bomaService.rejectSignupRequest(reqId, 'Administrative criteria not met', 'Sozi Admin');
      setActionNotice(`Declined signup request for ${name}.`);
      setTimeout(() => setActionNotice(null), 4000);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPhone) return;
    setModalLoading(true);

    try {
      const phones = [newPhone.trim()];
      if (newSecondaryPhone.trim()) phones.push(newSecondaryPhone.trim());

      await bomaService.addUser({
        full_name: newFullName.trim(),
        email: newEmail.trim(),
        phones,
        role: newRole,
        status: 'active',
        notes: 'Created directly via Admin Console',
      });

      setIsAddUserOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewSecondaryPhone('');
      setActionNotice(`User ${newFullName} successfully added with ${phones.length} linked phone lines.`);
      setTimeout(() => setActionNotice(null), 4000);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  const totalPhoneNumbers = users.reduce((acc, u) => acc + (u.phones?.length || 0), 0);
  const totalVolume = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className="rounded-xl bg-emerald-700 text-white p-3 text-xs font-semibold shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-200 hover:text-white">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight">
            Admin Control Center
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add New User</span>
          </button>

          <Link
            href="/admin/approvals"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Approvals Queue ({pendingRequests.length})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards — Dense 4-Column Layout on Laptop/Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Accounts</span>
            <UsersIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
            {users.length}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-700">{users.filter((u) => u.role === 'admin').length} Admins</span>
            <span>•</span>
            <span>{users.filter((u) => u.role === 'organizer').length} Organizers</span>
            <span>•</span>
            <span>{users.filter((u) => u.role === 'member').length} Members</span>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className={`rounded-xl border p-4 shadow-2xs transition-all ${
          pendingRequests.length > 0 
            ? 'border-amber-300 bg-amber-50/20' 
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={pendingRequests.length > 0 ? 'text-amber-900 font-semibold' : 'text-slate-500'}>
              Pending Signups
            </span>
            <ClockIcon className={`w-4 h-4 ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className={`mt-2 text-2xl font-semibold font-mono ${
            pendingRequests.length > 0 ? 'text-amber-950' : 'text-slate-900'
          }`}>
            {pendingRequests.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {pendingRequests.length > 0 
              ? `${pendingRequests.length} requests waiting for review` 
              : 'All signups reviewed'}
          </div>
        </div>

        {/* Card 3: Multi-Phone Resolution */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Linked Phone Lines</span>
            <SmartphoneIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono">
            {totalPhoneNumbers}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            ✓ Real legal identity attribution
          </div>
        </div>

        {/* Card 4: Platform Treasury Volume */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Treasury Volume</span>
            <WalletIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono truncate">
            {formatCurrency(totalVolume, 'KES')}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            {bomas.length} Active funds audited
          </div>
        </div>
      </div>

      {/* High Priority: Pending Approvals Queue */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/30 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-amber-200/70 bg-amber-100/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Action Required: Pending Signup Requests ({pendingRequests.length})
              </h2>
            </div>
            <Link
              href="/admin/approvals"
              className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ArrowUpRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-amber-200/50">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 hover:bg-white transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-neutral-900">{req.full_name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-semibold uppercase">
                      Requested: {req.role}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(req.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                    <span className="font-mono text-neutral-500">{req.email}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-sm text-[10px] font-bold">
                        Primary: {formatPhoneDisplay(req.phone)}
                      </span>
                      {req.additional_phones?.map((p, idx) => (
                        <span key={idx} className="font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded-sm text-[10px]">
                          Line {idx + 2}: {formatPhoneDisplay(p)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(req.id, req.full_name)}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Approve User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(req.id, req.full_name)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: User Directory Preview & Recent Sender Resolutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Registered Users with Multi-Phone Lines */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                User Directory &amp; Associated Phones
              </h3>
              <p className="text-[11px] text-slate-400">
                Accounts can have multiple phone numbers for sender resolution
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowUpRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-96">
            {users.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No users registered yet.
              </div>
            ) : (
              users.slice(0, 6).map((u) => (
                <div key={u.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center shrink-0 ${
                      u.role === 'admin'
                        ? 'bg-amber-500 text-white'
                        : u.role === 'organizer'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {u.full_name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-semibold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : u.role === 'organizer'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </div>

                      {/* Associated Phones */}
                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                        {u.phones.map((p, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-sm"
                          >
                            {formatPhoneDisplay(p)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Sender Name Resolution Stream */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Live Sender Resolution Stream
              </h3>
              <p className="text-[11px] text-slate-400">
                Phone numbers resolved to legal names instead of anonymous
              </p>
            </div>
            <Link
              href="/admin/senders"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Full Audit</span>
              <ArrowUpRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-96">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No transactions recorded yet.
              </div>
            ) : (
              transactions.slice(0, 6).map((tx) => (
                <div key={tx.id || tx.reference} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900">
                        {tx.contributor_name}
                      </span>
                      <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-sm font-semibold">
                        ✓ Name Resolved
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>From: {formatPhoneDisplay(tx.contributor_phone || 'M-Pesa Account')}</span>
                      <span>•</span>
                      <span>Ref: {tx.reference}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-emerald-700 block">
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add New User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                  <UsersIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">Add New User</h3>
                  <p className="text-[10px] text-neutral-400">Assign role and register multiple phone numbers</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dennis Kipchumba"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dennis@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Primary Mobile Phone (M-Pesa) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +254 712 345 678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Secondary Mobile Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0722 000 000 (Airtel / Secondary SIM)"
                  value={newSecondaryPhone}
                  onChange={(e) => setNewSecondaryPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500"
                />
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Payments sent from any of these numbers will automatically display Dennis&apos;s real name.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Platform Role
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['member', 'organizer', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`py-1.5 text-xs font-bold rounded-xl border capitalize transition-all ${
                        newRole === r
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
