'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BomaCategory, Currency } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';

export default function CreateBomaPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BomaCategory>('medical');
  const [targetAmount, setTargetAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('KES');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [agreedToTransparency, setAgreedToTransparency] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const user = await bomaService.getCurrentUser();
      if (user && user.id !== 'user-guest') {
        setCreatorName(user.name);
        if (user.phone) setCreatorPhone(user.phone);
      }
    };
    loadUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const target = parseFloat(targetAmount);
    if (!title.trim()) {
      setError('Provide a title.');
      return;
    }

    if (!target || target <= 0) {
      setError('Enter a valid target goal.');
      return;
    }

    if (!creatorName.trim()) {
      setError('Enter organizer name.');
      return;
    }

    if (!agreedToTransparency) {
      setError('You must agree to transparency.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBoma = await bomaService.createBoma({
        title: title.trim(),
        description: description.trim(),
        category,
        target_amount: target,
        currency,
        deadlineDays,
        creator_name: creatorName.trim(),
        creator_phone: creatorPhone.trim() || undefined,
        image_url: imageUrl,
      });

      router.push(`/bomas/${newBoma.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create Boma.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg md:max-w-xl px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-white">
          Create Cause
        </h1>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono">
          Deploy an audited community pool with real-time ledger
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        {error && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {/* Cause Details */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Baby Liam Pediatric Surgery Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BomaCategory)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="chama">Chama</option>
                <option value="community">Community</option>
                <option value="wedding">Wedding</option>
                <option value="funeral">Welfare</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Duration *
              </label>
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value={7}>7 Days (Urgent)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Purpose & Story *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Why are funds needed, who benefits, and how will disbursements be verified..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Financial Target */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Target Goal *
            </label>
            <input
              type="number"
              required
              min="100"
              placeholder="e.g. 350000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Organizer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Organizer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grace Mutua"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              M-Pesa Phone
            </label>
            <input
              type="tel"
              placeholder="0712 345 678"
              value={creatorPhone}
              onChange={(e) => setCreatorPhone(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div className="pt-1">
          <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Cover Image URL (Optional)
          </label>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
          <p className="mt-1 text-[10px] text-neutral-400">
            Leave blank if you prefer a clean category gradient card. You can add your image later.
          </p>
        </div>

        {/* Transparency Checkbox */}
        <label className="flex items-start gap-2 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTransparency}
            onChange={(e) => setAgreedToTransparency(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded-sm border-neutral-300 text-emerald-600"
          />
          <span className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-tight">
            I pledge full transparency: all contributions and payouts will be published on the public ledger.
          </span>
        </label>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Cause...' : 'Publish Boma'}
          </button>
        </div>
      </form>
    </div>
  );
}
