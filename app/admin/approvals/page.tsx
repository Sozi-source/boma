'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bomaService } from '@/lib/services/boma-service';
import { SignupRequest, UserRole } from '@/lib/types/fintech';
import { formatPhoneDisplay } from '@/lib/utils/phone';
import { 
  ShieldCheckIcon, 
  CheckCircleIcon, 
  XMarkIcon, 
  ClockIcon, 
  SmartphoneIcon,
  UsersIcon 
} from '@/components/ui/icons';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [filter, setFilter] = useState<'pending_approval' | 'active' | 'rejected' | 'all'>('pending_approval');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await bomaService.getSignupRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = async (reqId: string, name: string) => {
    try {
      await bomaService.approveSignupRequest(reqId, 'Administrator');
      showToast(`${name} has been approved.`);
      await loadRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  const handleReject = async (reqId: string, name: string) => {
    const reason = prompt(`Provide a reason for rejecting ${name}:`, 'Verification details could not be validated');
    if (reason === null) return;

    try {
      await bomaService.rejectSignupRequest(reqId, 'Administrator', reason);
      showToast(`${name}'s signup request was rejected.`);
      await loadRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending_approval').length;

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
        <span className="text-slate-600 font-medium">Signup Approvals Queue</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-3.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-base sm:text-xl font-semibold text-slate-800 tracking-tight">
              Approvals
            </h1>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5">
                {pendingCount} Pending
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex max-w-full flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFilter('pending_approval')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
              filter === 'pending_approval'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
              filter === 'active'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({requests.filter((r) => r.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('rejected')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
              filter === 'rejected'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({requests.filter((r) => r.status === 'rejected').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({requests.length})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No requests in queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no registration requests matching the current status filter.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending_approval';
            const isApproved = req.status === 'active';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-xl border p-3 sm:p-5 shadow-2xs transition-all ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-200/50 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                  
                  {/* Left: User Details & Associated Phones */}
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] sm:text-xs flex items-center justify-center shrink-0">
                        {req.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">
                        {req.full_name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase">
                        Role: {req.role}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full capitalize ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isApproved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] sm:text-xs text-slate-600 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-slate-500">{req.email}</span>
                      <span>•</span>
                      <span className="text-slate-400">
                        Submitted: {new Date(req.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {req.reviewed_by && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">
                            Reviewed by: <strong>{req.reviewed_by}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Associated Mobile Lines */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 flex-wrap">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">Phones:</span>
                      <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium">
                        Primary: {formatPhoneDisplay(req.phone)}
                      </span>
                      {req.additional_phones?.map((p, idx) => (
                        <span key={idx} className="font-mono bg-slate-100 text-slate-700 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                          Line {idx + 2}: {formatPhoneDisplay(p)}
                        </span>
                      ))}
                    </div>

                    {req.rejection_reason && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                        Reason: {req.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApprove(req.id, req.full_name)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-white shadow-2xs transition-colors"
                      >
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleReject(req.id, req.full_name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-red-700 transition-colors"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Status Indicator for Processed Requests */}
                  {!isPending && (
                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 font-mono block">
                        {isApproved ? 'Approved' : 'Rejected'}
                      </span>
                      {req.reviewed_at && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(req.reviewed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
