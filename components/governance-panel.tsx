'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Committee, CommitteeRole, PayoutRequest } from '../lib/types/fintech';
import { bomaService } from '../lib/services/boma-service';
import { formatCurrency } from '../lib/ledger/ledger-service';
import { ShieldCheckIcon, UsersIcon, CheckCircleIcon, XMarkIcon } from './ui/icons';

interface GovernancePanelProps {
  bomaId: string;
  /** Called after a payout executes so the page can refresh balances/ledger */
  onPayoutExecuted: () => void;
}

const ROLES: { id: CommitteeRole; label: string }[] = [
  { id: 'chairperson', label: 'Chairperson' },
  { id: 'treasurer', label: 'Treasurer' },
  { id: 'secretary', label: 'Secretary' },
  { id: 'member', label: 'Member' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ',
  executed: 'bg-emerald-50 text-emerald-700 ',
  rejected: 'bg-red-50 text-red-700 ',
};

export default function GovernancePanel({ bomaId, onPayoutExecuted }: GovernancePanelProps) {
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CommitteeRole>('treasurer');
  const [voterId, setVoterId] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([
      bomaService.getCommittee(bomaId),
      bomaService.getPayoutRequests(bomaId),
    ]);
    setCommittee(c);
    setRequests(r);
    setVoterId((prev) => (c.members.some((m) => m.id === prev) ? prev : c.members[0]?.id || ''));
  }, [bomaId]);

  useEffect(() => {
    load();
  }, [load]);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    await bomaService.addCommitteeMember(bomaId, {
      name: name.trim(),
      phone: phone.trim() || undefined,
      role,
    });
    setName('');
    setPhone('');
    await load();
  };

  const removeMember = async (id: string) => {
    await bomaService.removeCommitteeMember(bomaId, id);
    await load();
  };

  const changeThreshold = async (t: number) => {
    await bomaService.setApprovalThreshold(bomaId, t);
    await load();
  };

  const vote = async (requestId: string, decision: 'approve' | 'reject') => {
    if (!voterId) {
      setError('Add a committee member to vote.');
      return;
    }
    setError('');
    setBusyId(requestId);
    try {
      const updated = await bomaService.decidePayout(requestId, voterId, decision);
      await load();
      if (updated.status === 'executed') onPayoutExecuted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Vote failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (!committee) return null;

  const memberCount = committee.members.length;
  const approvalActive = memberCount >= 2 && committee.threshold >= 2;
  const inputCls =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 ';

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* Status banner */}
      <div
        className={`rounded-xl border p-3 flex items-center gap-2 text-xs ${
          approvalActive
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        <ShieldCheckIcon className="w-4 h-4 shrink-0 text-emerald-700" />
        <span>
          {approvalActive
            ? `Multi-sig active: ${committee.threshold} of ${memberCount} approvals release a payout.`
            : 'Multi-sig off. Add 2+ members and require 2+ approvals to protect payouts.'}
        </span>
      </div>

      {/* Committee */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <UsersIcon className="w-4 h-4 text-emerald-700" />
            Committee ({memberCount})
          </h3>

          {memberCount >= 2 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              Approvals needed
              <select
                value={committee.threshold}
                onChange={(e) => changeThreshold(Number(e.target.value))}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 focus:outline-hidden"
              >
                {Array.from({ length: memberCount }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {memberCount > 0 && (
          <ul className="divide-y divide-slate-100">
            {committee.members.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900">{m.name}</span>
                  <span className="ml-2 text-[10px] uppercase font-semibold text-slate-400 font-mono">{m.role}</span>
                  {m.phone && <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{m.phone}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  aria-label={`Remove ${m.name}`}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addMember} className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                Full Name *
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                aria-label="Member name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                Phone Number (Optional)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                aria-label="Phone number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
                value={role}
                onChange={(e) => setRole(e.target.value as CommitteeRole)}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Payout requests */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
            Payout Requests ({requests.length})
          </h3>

          {memberCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              Vote as
              <select
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 focus:outline-hidden"
              >
                {committee.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {requests.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No payout requests. Use Request Payout to start one.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => {
              const yes = r.approvals.filter((a) => a.decision === 'approve').length;
              const hasVoted = r.approvals.some((a) => a.member_id === voterId);
              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-slate-200 p-3 text-xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {r.recipient_name}
                      </p>
                      <p className="text-[11px] text-slate-500">{r.purpose}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        By {r.requested_by} · {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold font-mono text-amber-700">
                        {formatCurrency(r.amount, r.currency)}
                      </p>
                      <span
                        className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      {yes}/{committee.threshold} approvals
                      {r.approvals.length > 0 && (
                        <span className="text-slate-400 font-mono">
                          {' '}
                          ({r.approvals.map((a) => `${a.member_name} ${a.decision === 'approve' ? '✓' : '✗'}`).join(', ')})
                        </span>
                      )}
                    </span>

                    {r.status === 'pending' && memberCount > 0 && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={hasVoted || busyId === r.id}
                          onClick={() => vote(r.id, 'approve')}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs disabled:opacity-40 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={hasVoted || busyId === r.id}
                          onClick={() => vote(r.id, 'reject')}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {r.status === 'executed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700">
                        <CheckCircleIcon className="w-3 h-3" />
                        {r.disbursement_reference}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
