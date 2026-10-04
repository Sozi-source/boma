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
      setError('Please provide a title for the fund.');
      return;
    }

    if (!target || target <= 0) {
      setError('Enter a valid fundraising goal target.');
      return;
    }

    if (!creatorName.trim()) {
      setError('Enter the organizer full legal name.');
      return;
    }

    if (!agreedToTransparency) {
      setError('You must agree to transparent ledger accounting.');
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
      setError(err instanceof Error ? err.message : 'Failed to launch Fund.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 px-5 sm:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="pb-3.5 border-b border-slate-200/80">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight">
            Start a Community Fund
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kiprono Family Medical Relief Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BomaCategory)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="medical">Medical Relief</option>
                <option value="education">Education &amp; Tuition</option>
                <option value="chama">Chama &amp; Savings</option>
                <option value="community">Community Development</option>
                <option value="wedding">Wedding</option>
                <option value="funeral">Funeral</option>
                <option value="emergency">Urgent Relief</option>
                <option value="business">Business &amp; Ventures</option>
                <option value="family">Family &amp; Welfare</option>
                <option value="housing">Housing</option>
                <option value="other">General Fund</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Duration *
              </label>
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value={7}>7 Days (Urgent)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (Quarterly)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose &amp; Objective *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Explain the purpose of this fund and how contributions will be allocated..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden resize-none"
            />
          </div>

          {/* Financial Target & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Fundraising Goal *
              </label>
              <input
                type="number"
                required
                min="100"
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Organizer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organizer Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Faith Muthoni"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                M-Pesa Primary Contact Line
              </label>
              <input
                type="tel"
                placeholder="0712345678"
                value={creatorPhone}
                onChange={(e) => setCreatorPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Transparency Pledge */}
          <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTransparency}
              onChange={(e) => setAgreedToTransparency(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-emerald-600"
            />
            <span className="text-xs text-slate-600 leading-snug">
              I commit to full financial transparency: all member contributions and disbursement allocations will be recorded on the platform ledger.
            </span>
          </label>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Launching Fund...' : 'Launch Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
