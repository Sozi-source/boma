'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Currency, Group } from '@/lib/types/fintech';
import { bomaService } from '@/lib/services/boma-service';
import { CheckCircleIcon } from '@/components/ui/icons';

const COVER_PRESETS = [
  { label: 'Family', url: '/assets/images/funds/family/family_1440w_web-xl.webp' },
  { label: 'Chama', url: '/assets/images/funds/community/pexels-pixabay-53958.webp' },
  { label: 'Education', url: '/assets/images/funds/education/pexels-valerie-sutton-34163824-14935332.webp' },
  { label: 'Medical', url: '/assets/images/funds/medical/medical_1080w_web.webp' },
  { label: 'Community', url: '/assets/images/funds/community/pexels-droneafrica-12431091.webp' },
];

export default function CreateBomaPage() {
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMode, setDurationMode] = useState<'monthly' | 'fixed'>('monthly');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [targetAmount, setTargetAmount] = useState('');
  const [currency] = useState<Currency>('KES');
  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');
  const [destinationType, setDestinationType] = useState<'mpesa_till' | 'mpesa_paybill'>('mpesa_till');
  const [destinationNumber, setDestinationNumber] = useState('');
  const [hasPaystackAccount, setHasPaystackAccount] = useState(false);
  const [checkingPaystackAccount, setCheckingPaystackAccount] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [agreedToTransparency, setAgreedToTransparency] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGroupAndUser = async () => {
      try {
        const user = await bomaService.getCurrentUser();
        if (user && user.id !== 'user-guest') {
          const userGroup = await bomaService.ensureUserGroup();
          setGroup(userGroup);
          setCreatorName(userGroup.name || user.name);
          if (userGroup.organizer_phone || user.phone) {
            setCreatorPhone(userGroup.organizer_phone || user.phone || '');
          }
        }
      } catch (e) {
        console.error('Failed to load group:', e);
      } finally {
        setLoadingGroup(false);
      }
    };

    void loadGroupAndUser();

    fetch('/api/payments/paystack/subaccount').then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setHasPaystackAccount(Boolean(data.account?.subaccount_code));
      if (data.account?.destination_type) {
        setDestinationType(data.account.destination_type);
      }
    }).catch(() => {}).finally(() => setCheckingPaystackAccount(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (checkingPaystackAccount) {
      setError('Checking payout setup. Please wait a moment.');
      return;
    }

    const target = parseFloat(targetAmount);
    if (!title.trim()) {
      setError('Please provide a fund title.');
      return;
    }

    if (!target || target <= 0 || !Number.isInteger(target)) {
      setError('Enter a whole-number target amount in KES.');
      return;
    }

    if (!agreedToTransparency) {
      setError('Please confirm ledger transparency.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!hasPaystackAccount && destinationNumber.trim()) {
        const setupResponse = await fetch('/api/payments/paystack/subaccount', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination_type: destinationType,
            account_number: destinationNumber.trim(),
            business_name: group?.name || creatorName.trim(),
            contact_name: group?.organizer_name || creatorName.trim(),
            contact_phone: creatorPhone.trim(),
          }),
        });
        const setupResult = await setupResponse.json().catch(() => ({}));
        if (!setupResponse.ok) throw new Error(setupResult.error || 'Unable to save M-Pesa payout account.');
        setHasPaystackAccount(true);
      }

      const isOngoing = durationMode === 'monthly';
      const newBoma = await bomaService.createBoma({
        title: title.trim(),
        description: description.trim(),
        target_amount: target,
        currency,
        deadlineDays: isOngoing ? 0 : deadlineDays,
        isOngoing,
        creator_name: group?.name || creatorName.trim(),
        creator_phone: creatorPhone.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        is_public: isPublic,
      });

      router.push(`/bomas/${newBoma.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add fund.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 bg-slate-50/50 min-h-screen">
      <div className="mx-auto w-full max-w-2xl space-y-4 sm:space-y-5">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/dashboard" className="hover:text-emerald-700 font-medium transition-colors">
            ← Workspace
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-semibold">Add fund</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            Add fund
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {loadingGroup ? 'Loading…' : group?.name || 'Group'}
          </span>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="fund-title" className="block text-xs font-semibold text-slate-800 mb-1">
              Fund title <span className="text-rose-500">*</span>
            </label>
            <input
              id="fund-title"
              type="text"
              required
              placeholder="e.g. Welfare fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 py-2.5 px-3.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          {/* Purpose / Description */}
          <div>
            <label htmlFor="fund-description" className="block text-xs font-semibold text-slate-800 mb-1">
              Purpose <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="fund-description"
              required
              rows={2}
              placeholder="What this fund will support..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400 leading-relaxed transition-colors focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          {/* Duration Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Duration <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDurationMode('monthly')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  durationMode === 'monthly'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/20 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Monthly (No end date)
              </button>
              <button
                type="button"
                onClick={() => setDurationMode('fixed')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  durationMode === 'fixed'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/20 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Fixed duration
              </button>
            </div>

            {durationMode === 'fixed' && (
              <div className="mt-2">
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={60}>60 Days (2 Months)</option>
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={180}>6 Months</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label htmlFor="target-amount" className="block text-xs font-semibold text-slate-800 mb-1">
              Target amount (KES) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <span className="text-xs font-bold font-mono text-slate-400">KES</span>
              </div>
              <input
                id="target-amount"
                type="number"
                required
                min="100"
                step="1"
                placeholder="50,000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 py-2.5 pl-12 pr-3.5 text-xs sm:text-sm font-mono font-semibold text-slate-900 placeholder:text-[11px] placeholder:font-mono placeholder:font-normal placeholder:text-slate-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>
          </div>

          {/* Payout Destination */}
          {hasPaystackAccount ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3.5 py-2.5 flex items-center gap-2 text-xs text-emerald-950">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">M-Pesa payout destination connected</span>
            </div>
          ) : !checkingPaystackAccount ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 space-y-2.5">
              <span className="text-xs font-semibold text-slate-800 block">Payout destination</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="payout-type" className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                  <select
                    id="payout-type"
                    value={destinationType}
                    onChange={(e) => setDestinationType(e.target.value as 'mpesa_till' | 'mpesa_paybill')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="mpesa_till">M-Pesa Till</option>
                    <option value="mpesa_paybill">M-Pesa Paybill</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="payout-num" className="block text-[11px] font-medium text-slate-600 mb-1">Number *</label>
                  <input
                    id="payout-num"
                    type="text"
                    inputMode="numeric"
                    required={!hasPaystackAccount}
                    value={destinationNumber}
                    onChange={(e) => setDestinationNumber(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-[11px] placeholder:font-mono placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Cover Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="cover-image-url" className="block text-xs font-semibold text-slate-800">
                Cover image <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[11px] text-slate-400 hover:text-rose-600 underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    imageUrl === preset.url
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              id="cover-image-url"
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 py-2.5 px-3.5 text-xs text-slate-900 placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />

            {imageUrl && (
              <div className="relative h-20 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-1 space-y-3">
            {/* Visibility */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">List in Explore</span>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#99d452]"></div>
              </label>
            </div>

            {/* Transparency Pledge */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTransparency}
                onChange={(e) => setAgreedToTransparency(e.target.checked)}
                className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-600">
                Record all contributions to the group ledger
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || checkingPaystackAccount}
              className="w-full rounded-full bg-[#99d452] hover:bg-[#8ac841] py-3 text-xs sm:text-sm font-bold text-[#18181b] shadow-[0_4px_14px_rgba(153,212,82,0.32)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Adding fund…' : 'Add fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
