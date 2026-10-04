'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Currency } from '@/lib/types/fintech';
import { formatCurrency } from '@/lib/ledger/ledger-service';
import { bomaService } from '@/lib/services/boma-service';
import { normalizePhoneNumber } from '@/lib/utils/phone';
import { UsersIcon, SearchIcon } from './ui/icons';

export interface ContributorGroup {
  key: string;
  name: string;
  is_anonymous: boolean;
  totalAmount: number;
  currency: Currency;
  count: number;
  lastPaymentAt: string;
}

interface ContributorTrackerProps {
  transactions: Transaction[];
  targetAmount?: number;
  currency?: Currency;
  bomaTitle?: string;
}

export default function ContributorTracker({
  transactions,
  currency = 'KES',
}: ContributorTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Group transactions by contributor identity
  const contributorGroups = useMemo(() => {
    const map = new Map<string, ContributorGroup>();

    transactions.forEach((tx) => {
      const resolution = bomaService.resolveSenderIdentity(
        tx.contributor_phone,
        tx.contributor_email,
        tx.contributor_name
      );

      const isRegistered = Boolean(resolution.matchedUser);
      const isAnonymous = isRegistered ? false : tx.is_anonymous;
      const displayName = isRegistered
        ? resolution.matchedUser!.full_name
        : isAnonymous
        ? 'Anonymous Friend'
        : resolution.name || 'Friend';

      const key = isAnonymous
        ? `anon-${tx.id || tx.reference}`
        : isRegistered
        ? `user-${resolution.matchedUser!.id}`
        : (tx.contributor_email?.toLowerCase().trim() ||
           normalizePhoneNumber(tx.contributor_phone) ||
           tx.contributor_name.toLowerCase().trim() ||
           `unknown-${tx.id}`);

      const existing = map.get(key);

      if (existing) {
        existing.totalAmount += Number(tx.amount);
        existing.count += 1;
        if (new Date(tx.created_at) > new Date(existing.lastPaymentAt)) {
          existing.lastPaymentAt = tx.created_at;
        }
      } else {
        map.set(key, {
          key,
          name: displayName,
          is_anonymous: isAnonymous,
          totalAmount: Number(tx.amount),
          currency: tx.currency || currency,
          count: 1,
          lastPaymentAt: tx.created_at,
        });
      }
    });

    const list = Array.from(map.values());
    // Sort by most recent contribution first so live payments appear at top
    list.sort((a, b) => new Date(b.lastPaymentAt).getTime() - new Date(a.lastPaymentAt).getTime());
    return list;
  }, [transactions, currency]);

  // Simple search filter
  const filteredContributors = useMemo(() => {
    if (!searchQuery.trim()) return contributorGroups;
    const q = searchQuery.toLowerCase().trim();
    return contributorGroups.filter((c) => c.name.toLowerCase().includes(q));
  }, [contributorGroups, searchQuery]);

  return (
    <div className="space-y-3">
      {/* Clean Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Contributions ({contributorGroups.length})
          </h3>
          <p className="text-[11px] text-slate-500">
            List of contributors and amounts given
          </p>
        </div>

        {contributorGroups.length > 5 && (
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              aria-label="Search contributor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Contributor List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {filteredContributors.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">No contributions yet</p>
            <p className="text-[11px] text-slate-400">
              Be the first to contribute to this fund.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredContributors.map((c) => (
              <div
                key={c.key}
                className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                {/* Sender Identity */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${
                      c.is_anonymous
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {c.is_anonymous ? '?' : c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block">
                      {new Date(c.lastPaymentAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Amount Given */}
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold font-mono text-emerald-700">
                    {formatCurrency(c.totalAmount, c.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
