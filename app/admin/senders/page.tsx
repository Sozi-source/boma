'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SenderResolutionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/ledger?tab=unclaimed');
  }, [router]);

  return (
    <div className="py-16 text-center text-xs text-slate-500 font-mono">
      Redirecting to Central Ledger...
    </div>
  );
}
