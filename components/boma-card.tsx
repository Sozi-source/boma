'use client';

import React from 'react';
import Link from 'next/link';
import { Boma } from '../lib/types/fintech';
import { formatCurrency } from '../lib/ledger/ledger-service';
import { ShieldCheckIcon } from './ui/icons';

interface BomaCardProps {
  boma: Boma;
  onContributeClick?: (boma: Boma) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  medical: 'Medical',
  education: 'Education',
  chama: 'Chama',
  community: 'Community',
  wedding: 'Wedding',
  funeral: 'Funeral',
  emergency: 'Urgent',
  business: 'Business',
  family: 'Family',
  housing: 'Housing',
  food: 'Food & Essentials',
  travel: 'Travel',
  religious: 'Faith',
  sports: 'Sports',
  technology: 'Technology',
  other: 'General Fund',
};

export default function BomaCard({ boma, onContributeClick }: BomaCardProps) {
  const percentage = Math.min(100, Math.round((boma.current_amount / boma.target_amount) * 100));
  const categoryLabel = CATEGORY_LABELS[boma.category] || boma.category;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(boma.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
      
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {categoryLabel}
          </span>

          {boma.verified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Active</span>
            </span>
          )}
        </div>

        {/* Optional Cover Banner */}
        {boma.image_url && (
          <div className="h-28 w-full overflow-hidden rounded-lg mb-3 bg-slate-100">
            <img
              src={boma.image_url}
              alt={boma.title}
              className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-200"
              loading="lazy"
            />
          </div>
        )}

        {/* Title & Description */}
        <Link href={`/bomas/${boma.id}`} className="block group-hover:text-emerald-700 transition-colors">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
            {boma.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {boma.description || 'Community pooled fund with transparent real-time ledger accounting.'}
          </p>
        </Link>
      </div>

      {/* Financial Numbers & Progress */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Raised</span>
            <span className="text-base font-semibold font-mono text-slate-900">
              {formatCurrency(boma.current_amount, boma.currency)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Target</span>
            <span className="text-xs font-medium font-mono text-slate-500">
              {formatCurrency(boma.target_amount, boma.currency)}
            </span>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span className="text-emerald-700 font-semibold">{percentage}% Funded</span>
            <span>{boma.contributors_count || 0} members • {daysLeft}d left</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onContributeClick?.(boma)}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-1.5 text-center text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            Contribute
          </button>
          
          <Link
            href={`/bomas/${boma.id}`}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
