'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boma } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import BomaCard from '@/components/boma-card';
import ContributionModal from '@/components/contribution-modal';
import { BuildingLibraryIcon } from '@/components/ui/icons';

export default function ExploreBomasPage() {
  const [bomas, setBomas] = useState<Boma[]>([]);
  const [selectedBomaForModal, setSelectedBomaForModal] = useState<Boma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBomas = async () => {
    try {
      const data = await bomaService.getBomas();
      setBomas(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBomas();
  }, []);

  const handleContribute = (boma: Boma) => {
    setSelectedBomaForModal(boma);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full min-w-0 px-4 py-7 sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto w-full max-w-7xl space-y-7 sm:space-y-9">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-7">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Move forward, together</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Explore group goals</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">See what each group is raising for, follow its progress, and contribute when you are ready. No account is needed to contribute.</p>
          </div>
          <Link href="/auth/signup?role=organizer" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:self-auto">Start a group fund <span aria-hidden="true">→</span></Link>
        </div>

        {/* Funds Grid / Empty State */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-mono">
            Loading funds...
          </div>
        ) : bomas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <BuildingLibraryIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No active funds</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              Active family and community campaigns will appear here.
            </p>
            <Link href="/auth/signup?role=organizer" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800">Start a group fund</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {bomas.map((boma) => (
              <BomaCard
                key={boma.id}
                boma={boma}
                onContributeClick={handleContribute}
                coverSizes={bomas.length === 1
                  ? '(max-width: 639px) calc(100vw - 60px), (max-width: 1023px) calc(50vw - 64px), 33vw'
                  : '(max-width: 639px) calc(50vw - 38px), (max-width: 1023px) calc(50vw - 64px), 33vw'}
              />
            ))}
          </div>
        )}

        {/* Contribution Modal */}
        {selectedBomaForModal && (
          <ContributionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            boma={selectedBomaForModal}
            onSuccess={fetchBomas}
          />
        )}
      </div>
    </div>
  );
}
