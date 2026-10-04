'use client';

import React from 'react';
import Link from 'next/link';
import { Boma } from '../lib/types/fintech';
import { formatCurrency } from '../lib/ledger/ledger-service';
import { ArrowUpRightIcon, PlusIcon, ShieldCheckIcon } from './ui/icons';
import BomaCover from './boma-cover';

interface BomaCardProps {
  boma: Boma;
  onContributeClick?: (boma: Boma) => void;
  coverSizes?: string;
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

export default function BomaCard({ boma, onContributeClick, coverSizes }: BomaCardProps) {
  const percentage = Math.min(100, Math.round((boma.current_amount / boma.target_amount) * 100));
  const categoryLabel = CATEGORY_LABELS[boma.category] || boma.category;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(boma.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <article className="group flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-emerald-50/40 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 sm:text-[10px]">
            {categoryLabel}
          </span>

          {boma.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
              <span>Active</span>
            </span>
          )}
        </div>

        <BomaCover
          boma={boma}
          className="mb-4 h-32 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-40 lg:h-44"
          imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          sizes={coverSizes}
        />

        {/* Title & Description */}
        <Link href={`/bomas/${boma.id}`} className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <h3 className="text-base font-bold tracking-tight text-slate-950 transition-colors group-hover:text-emerald-800 sm:text-lg">
            {boma.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {boma.description || 'Community support fund.'}
          </p>
        </Link>
      </div>

      <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-end justify-between gap-3 rounded-xl border border-slate-100 bg-white/80 p-3.5">
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">Collected</span>
            <span className="font-mono text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              {formatCurrency(boma.current_amount, boma.currency)}
            </span>
          </div>
          <div className="max-w-[48%] pb-0.5 text-right">
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-slate-400">Goal</span>
            <span className="block truncate font-mono text-xs font-semibold text-slate-600 sm:text-sm">
              {formatCurrency(boma.target_amount, boma.currency)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
            <span className="font-semibold text-emerald-800">{percentage}% of goal</span>
            <span className="text-slate-500">{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onContributeClick?.(boma)}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Contribute</span>
          </button>
          
          <Link
            href={`/bomas/${boma.id}`}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            <span>Details</span>
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>
      </div>
    </article>
  );
}
