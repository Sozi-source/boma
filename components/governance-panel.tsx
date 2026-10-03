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
    <div className="space-y-3 sm:space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 ">
          {error}
        </div>
      )}

      {/* Status banner */}
      <div
        className={`rounded-xl border p-3 flex items-center gap-2 text-[11px] ${
          approvalActive
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 '
            : 'border-neutral-200 bg-white text-neutral-600 '
        }`}
      >
        <ShieldCheckIcon className="w-4 h-4 shrink-0" />
        <span>
          {approvalActive
            ? `Multi-sig active: ${committee.threshold} of ${memberCount} approvals release a payout.`
            : 'Multi-sig off. Add 2+ members and require 2+ approvals to protect payouts.'}
        </span>
      </div>

      {/* Committee */}
      <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
            <UsersIcon className="w-4 h-4 text-emerald-600" />
            Committee ({memberCount})
          </h3>

          {memberCount >= 2 && (
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              Approvals needed
              <select
                value={committee.threshold}
                onChange={(e) => changeThreshold(Number(e.target.value))}
                className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 text-xs "
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
          <ul className="divide-y divide-neutral-100 ">
            {committee.members.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-neutral-900 ">{m.name}</span>
                  <span className="ml-1.5 text-[10px] uppercase text-neutral-400">{m.role}</span>
                  {m.phone && <span className="block text-[10px] text-neutral-400">{m.phone}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="p-1 text-neutral-400 hover:text-red-600"
                  aria-label={`Remove ${m.name}`}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addMember} className="grid grid-cols-2 gap-2 pt-1">
          <input
            className={inputCls}
            placeholder="Member name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={inputCls}
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value as CommitteeRole)}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-bold text-white transition-colors"
          >
            Add Member
          </button>
        </form>
      </div>

      {/* Payout requests */}
      <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 ">
            Payout Requests ({requests.length})
          </h3>

          {memberCount > 0 && (
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              Vote as
              <select
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 text-xs "
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
          <p className="py-6 text-center text-xs text-neutral-400">
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
                  className="rounded-lg border border-neutral-200 p-3 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 truncate">
                        {r.recipient_name}
                      </p>
                      <p className="text-[11px] text-neutral-500">{r.purpose}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        By {r.requested_by} · {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-amber-600 ">
                        {formatCurrency(r.amount, r.currency)}
                      </p>
                      <span
                        className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-500">
                      {yes}/{committee.threshold} approvals
                      {r.approvals.length > 0 && (
                        <span className="text-neutral-400">
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
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={hasVoted || busyId === r.id}
                          onClick={() => vote(r.id, 'reject')}
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 "
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {r.status === 'executed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600">
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
