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
    <div className="w-full min-w-0 px-3.5 sm:px-8 lg:px-10 xl:px-12 py-3.5 sm:py-8">
      <div className="w-full max-w-7xl space-y-4 sm:space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-3.5 border-b border-slate-200/80">
          <div>
            <h1 className="text-base sm:text-xl font-semibold text-slate-800 tracking-tight">
              Active Funds
            </h1>
          </div>
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
          </div>
        ) : (
          <div className={`grid gap-3 sm:gap-5 ${bomas.length === 1 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3'}`}>
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
