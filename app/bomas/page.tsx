'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boma, BomaCategory } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import BomaCard from '@/components/boma-card';
import ContributionModal from '@/components/contribution-modal';
import { SearchIcon, SparklesIcon, PlusIcon } from '@/components/ui/icons';

const CATEGORIES: { id: BomaCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Funds', icon: '✨' },
  { id: 'medical', label: 'Medical', icon: '🏥' },
  { id: 'chama', label: 'Chama', icon: '🤝' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'emergency', label: 'Urgent', icon: '⚡' },
  { id: 'community', label: 'Community', icon: '🌿' },
  { id: 'wedding', label: 'Wedding', icon: '💍' },
  { id: 'funeral', label: 'Funeral', icon: '🕊️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'family', label: 'Family', icon: '🏠' },
  { id: 'housing', label: 'Housing', icon: '🏡' },
  { id: 'food', label: 'Food & Essentials', icon: '🍲' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'religious', label: 'Faith & Religious', icon: '🙏' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'other', label: 'Other', icon: '💰' },
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
    <div className="mx-auto flex min-h-[calc(100svh-8.25rem)] w-full max-w-lg flex-col px-3 py-4 sm:px-6 sm:py-6 md:min-h-0 md:max-w-2xl md:space-y-5 lg:max-w-4xl">
      
      {/* App Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 ">
            Discover Funds
          </h1>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono">
            Contributions ({bomas.length})
          </p>
        </div>

        <Link
          href="/bomas/create"
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>New Contribution</span>
        </Link>
      </div>

      {/* Filter and Search controls */}
      <div className="mt-5 space-y-3 sm:mt-6 md:mt-0">
        {/* Compact Search Input */}
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search funds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-8 pr-3 text-sm font-medium text-neutral-900 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <label className="block">
          <span className="sr-only">Filter by category</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as BomaCategory | 'all')}
            className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 focus:border-emerald-600 focus:outline-hidden"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Contributions Grid (2 cols on mobile, up to 4 cols on desktop) */}
      {bomas.length === 0 ? (
        <div className="mt-4 flex min-h-64 flex-1 flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-neutral-200 bg-white/70 p-6 text-center sm:p-12 md:mt-0 md:flex-none">
          <SparklesIcon className="mx-auto h-8 w-8 text-neutral-400" />
          <h3 className="text-sm font-bold text-neutral-900 sm:text-base">
            {searchQuery || selectedCategory !== 'all' ? 'No matching contributions found' : 'No contributions yet'}
          </h3>
          <p className="mx-auto max-w-xs text-xs leading-relaxed text-neutral-500">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try changing your search terms or category filter.'
              : 'Create your first contribution to start pooling funds transparently.'}
          </p>
          <div>
            <Link
              href="/bomas/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-emerald-600"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Start a Contribution</span>
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
      />
    </div>
  );
}
