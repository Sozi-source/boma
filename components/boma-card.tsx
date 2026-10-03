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

const CATEGORY_META: Record<string, { bg: string; icon: string; label: string }> = {
  medical: { bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: '🏥', label: 'Medical' },
  education: { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: '🎓', label: 'Education' },
  chama: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: '🤝', label: 'Chama' },
  community: { bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icon: '🌿', label: 'Community' },
  wedding: { bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: '💍', label: 'Wedding' },
  funeral: { bg: 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20', icon: '🕊️', label: 'Funeral' },
  emergency: { bg: 'bg-red-500/10 text-red-600 border-red-500/20', icon: '⚡', label: 'Urgent' },
  business: { bg: 'bg-teal-500/10 text-teal-600 border-teal-500/20', icon: '💼', label: 'Enterprise' },
  family: { bg: 'bg-pink-500/10 text-pink-600 border-pink-500/20', icon: '🏠', label: 'Family' },
  housing: { bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: '🏡', label: 'Housing' },
  food: { bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: '🍲', label: 'Food & Essentials' },
  travel: { bg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: '✈️', label: 'Travel' },
  religious: { bg: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: '🙏', label: 'Faith & Religious' },
  sports: { bg: 'bg-lime-500/10 text-lime-700 border-lime-500/20', icon: '⚽', label: 'Sports' },
  technology: { bg: 'bg-sky-500/10 text-sky-600 border-sky-500/20', icon: '💻', label: 'Technology' },
  other: { bg: 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20', icon: '💰', label: 'Other' },
};

export default function BomaCard({ boma, onContributeClick }: BomaCardProps) {
  const percentage = Math.min(100, Math.round((boma.current_amount / boma.target_amount) * 100));
  const category = CATEGORY_META[boma.category] || {
    bg: 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20',
    icon: '💰',
    label: boma.category,
  };

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(boma.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-xs hover:border-neutral-300 hover:shadow-md transition-all duration-200 ">
      
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${category.bg}`}>
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        {/* Optional Cover Banner */}
        {boma.image_url && (
          <div className="h-20 w-full overflow-hidden rounded-xl mb-2.5 bg-neutral-100 ">
            <img
              src={boma.image_url}
              alt={boma.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Title */}
        <Link href={`/bomas/${boma.id}`} className="block group-hover:text-emerald-700 transition-colors">
          <h3 className="text-xs sm:text-sm font-black text-neutral-900 line-clamp-1 leading-snug">
            {boma.title}
          </h3>
          <p className="mt-0.5 text-[10px] text-neutral-400 line-clamp-1">
            {boma.description || 'A Fund for our community'}
          </p>
        </Link>
      </div>

      {/* Financial Numbers & Progress */}
      <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[10px] text-neutral-400 font-medium block">Raised</span>
            <span className="text-xs sm:text-sm font-black font-mono tracking-tight text-neutral-900 ">
              {formatCurrency(boma.current_amount, boma.currency)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 font-medium block">Target</span>
            <span className="text-[11px] font-bold font-mono text-neutral-500">
              {formatCurrency(boma.target_amount, boma.currency)}
            </span>
          </div>
        </div>

        {/* Micro Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 ">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] text-neutral-400 font-medium">
            <span className="text-emerald-700 font-bold">{percentage}% Funded</span>
            <span>{boma.contributors_count} members • {daysLeft}d left</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => onContributeClick?.(boma)}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-1.5 text-center text-[11px] font-bold text-white shadow-xs transition-all active:scale-95"
          >
            Contribute
          </button>
          
          <Link
            href={`/bomas/${boma.id}`}
            className="rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1.5 text-center text-[11px] font-bold text-neutral-700 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
