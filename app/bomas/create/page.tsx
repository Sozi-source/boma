'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [destinationType, setDestinationType] = useState<'mpesa_till' | 'mpesa_paybill'>('mpesa_till');
  const [destinationNumber, setDestinationNumber] = useState('');
  const [hasPaystackAccount, setHasPaystackAccount] = useState(false);
  const [checkingPaystackAccount, setCheckingPaystackAccount] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [agreedToTransparency, setAgreedToTransparency] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
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
    fetch('/api/payments/paystack/subaccount').then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setHasPaystackAccount(Boolean(data.account?.subaccount_code));
    }).catch(() => {}).finally(() => setCheckingPaystackAccount(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (checkingPaystackAccount) {
      setError('Checking your Paystack payout setup. Please try again in a moment.');
      return;
    }

    const target = parseFloat(targetAmount);
    if (!title.trim()) {
      setError('Please provide a title for the fund.');
      return;
    }

    if (!target || target <= 0 || !Number.isInteger(target)) {
      setError('Enter a whole-number fundraising goal in Kenyan shillings.');
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
      if (!hasPaystackAccount) {
        const setupResponse = await fetch('/api/payments/paystack/subaccount', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination_type: destinationType,
            account_number: destinationNumber.trim(),
            business_name: creatorName.trim(),
            contact_name: creatorName.trim(),
            contact_phone: creatorPhone.trim(),
          }),
        });
        const setupResult = await setupResponse.json().catch(() => ({}));
        if (!setupResponse.ok) throw new Error(setupResult.error || 'Unable to set up your M-Pesa payout account.');
        setHasPaystackAccount(true);
      }
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
        is_public: isPublic,
      });

      router.push(`/bomas/${newBoma.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to launch Fund.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-7">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/bomas" className="hover:text-emerald-700 font-medium transition-colors">
            ← Community Funds
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Create a group fund</span>
        </div>

        <div className="border-b border-slate-200/80 pb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Create a group fund
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tell members what you are working toward. Set the amount, explain the plan, and connect the group’s M-Pesa destination.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
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

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <input
                id="publish-fund"
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <div>
                <label htmlFor="publish-fund" className="text-sm font-semibold text-slate-900">Make this group visible to everyone</label>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {isPublic
                    ? 'Anyone can find this fund, read its details and contribute without an account.'
                    : 'Private by default. Only you, the organizer, can view it. Contributions are paused until you publish it.'}
                </p>
              </div>
            </div>
          </section>

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
                step="1"
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
              </select>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">M-Pesa contributions currently support KES.</p>
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
                Organizer Contact Phone
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

          {!checkingPaystackAccount && !hasPaystackAccount && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <div>
                  <h2 className="text-xs font-bold text-slate-900">Organizer’s M-Pesa destination</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Contributors approve a payment prompt on their phone. Paystack sends 2.5% to Openhand and settles the remainder to your registered Till or Paybill. The destination must be verified in Paystack before its first payout.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Destination type *</label>
                  <select value={destinationType} onChange={(e) => setDestinationType(e.target.value as 'mpesa_till' | 'mpesa_paybill')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    <option value="mpesa_till">M-Pesa Till</option>
                    <option value="mpesa_paybill">M-Pesa Paybill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Your Till or Paybill number *</label>
                  <input type="text" inputMode="numeric" required value={destinationNumber}
                    onChange={(e) => setDestinationNumber(e.target.value)} placeholder="e.g. 1234567"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900" />
                </div>
              </div>
            </div>
          )}
          {hasPaystackAccount && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900">
              Your Paystack M-Pesa destination is registered. Verify it in the Paystack Dashboard before its first payout. This destination is used for funds you organize.
            </div>
          )}

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
              disabled={isSubmitting || checkingPaystackAccount}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Setting Up Payments...' : checkingPaystackAccount ? 'Checking Payout Setup...' : 'Launch Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
