'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boma, BomaCategory } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import BomaCard from '@/components/boma-card';
import ContributionModal from '@/components/contribution-modal';
import { SearchIcon, SparklesIcon, PlusIcon } from '@/components/ui/icons';

const CATEGORIES: { id: BomaCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Pools', icon: '✨' },
  { id: 'medical', label: 'Medical', icon: '🏥' },
  { id: 'chama', label: 'Chama', icon: '🤝' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'emergency', label: 'Urgent', icon: '⚡' },
  { id: 'community', label: 'Community', icon: '🌿' },
  { id: 'wedding', label: 'Wedding', icon: '💍' },
];

export default function ExploreBomasPage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BomaCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBomaForModal, setSelectedBomaForModal] = useState<Boma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBomas = async () => {
    const data = await bomaService.getBomas({
      category: selectedCategory,
      query: searchQuery,
    });
    setBomas(data);
  };

  useEffect(() => {
    fetchBomas();
  }, [selectedCategory, searchQuery]);

  const handleContribute = (boma: Boma) => {
    setSelectedBomaForModal(boma);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-5">
      
      {/* App Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-white">
            Discover Pools
          </h1>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono">
            Verified Community Escrow Vaults ({bomas.length})
          </p>
        </div>

        <Link
          href="/bomas/create"
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>New Cause</span>
        </Link>
      </div>

      {/* Filter and Search controls */}
      <div className="space-y-2">
        {/* Compact Search Input */}
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search pools by keyword or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-900 dark:text-white font-medium"
          />
        </div>

        {/* Compact Category Pills with horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Causes Grid (2 cols on mobile, up to 4 cols on desktop) */}
      {bomas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-8 sm:p-12 text-center space-y-2.5 bg-white/60 dark:bg-neutral-900/60">
          <SparklesIcon className="mx-auto h-7 w-7 text-neutral-400" />
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
            {searchQuery || selectedCategory !== 'all' ? 'No matching causes found' : 'No causes yet'}
          </h3>
          <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try changing your search terms or category filter.'
              : 'Create your first cause to start pooling funds transparently.'}
          </p>
          <div>
            <Link
              href="/bomas/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Create Cause</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bomas.map((boma) => (
            <BomaCard
              key={boma.id}
              boma={boma}
              onContributeClick={handleContribute}
            />
          ))}
        </div>
      )}

      {/* Contribution Modal */}
      <ContributionModal
        boma={selectedBomaForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBomas}
      />
    </div>
  );
}
