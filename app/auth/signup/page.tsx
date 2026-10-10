'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { bomaService } from '@/lib/services/boma-service';
import { ShieldCheckIcon, CheckCircleIcon, SmartphoneIcon } from '@/components/ui/icons';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [showSecondary, setShowSecondary] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 12) {
      setError('Choose a password with at least 12 characters.');
      setLoading(false);
      return;
    }

    try {
      // 1. Submit to Boma Approval Queue & User Store
      const additionalPhones = secondaryPhone.trim() ? [secondaryPhone.trim()] : [];
      await bomaService.submitSignupRequest({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        additional_phones: additionalPhones,
        role: 'organizer',
      });

      // 2. Register with Supabase if configured
      try {
        const supabase = createClient();
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
              additional_phones: additionalPhones,
              role: 'organizer',
            },
          },
        });
      } catch {
        // Continue even if Supabase offline
      }

      setRequestSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-5 sm:px-8 sm:py-10">
      <Link href="/" className="mx-auto mb-8 inline-flex items-center gap-2.5 text-sm font-bold text-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 font-mono text-sm text-white">B</span>
        BomaPay <span className="ml-1 text-xs font-normal text-slate-500">· Back to home</span>
      </Link>
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Bring your group together
        </h1>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-600">Create an organizer account to set up a shared goal, invite members and keep everyone up to date. Organizer requests are reviewed before you can create a fund.</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 ">
            {error}
          </div>
        )}

        {requestSubmitted ? (
          <div className="rounded-xl bg-emerald-50/80 p-4 text-xs text-neutral-800 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3 className="font-bold text-sm">Signup Request Submitted</h3>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Your request is with the BomaPay team for review. Once approved, you can sign in and create your group fund.
            </p>
            <div className="rounded-lg bg-white p-3 border border-emerald-100 space-y-1.5 text-[11px]">
              <div><span className="text-neutral-400">Name:</span> <strong className="text-neutral-800">{fullName}</strong></div>
              <div><span className="text-neutral-400">Email:</span> <span className="font-mono text-neutral-800">{email}</span></div>
              <div>
                <span className="text-neutral-400">Registered Phone Lines:</span>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <span className="bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                    Primary: {phone}
                  </span>
                  {secondaryPhone && (
                    <span className="bg-neutral-100 text-neutral-700 font-mono px-2 py-0.5 rounded text-[10px]">
                      Secondary: {secondaryPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800">
              💡 <em>Once an administrator approves your account, contributions sent from any of your registered phone numbers will automatically display your full legal name.</em>
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/auth/login"
                className="w-full text-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 font-bold text-white text-xs transition-colors"
              >
                Proceed to Sign In
              </Link>
              <Link
                href="/"
                className="w-full text-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-2 font-semibold text-neutral-700 text-xs transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Your full name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grace Achieng Omondi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Primary M-Pesa / Mobile Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
              />
            </div>

            {/* Multi-phone: Add secondary line */}
            <div>
              {!showSecondary ? (
                <button
                  type="button"
                  onClick={() => setShowSecondary(true)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>+ Add Alternative / Secondary Phone Line</span>
                </button>
              ) : (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-neutral-700">
                      Secondary Phone Line (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSecondary(false);
                        setSecondaryPhone('');
                      }}
                      className="text-[10px] text-neutral-400 hover:text-neutral-600"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="tel"
                    placeholder="e.g. 0722000000 (Airtel / Secondary SIM)"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
                  />
                  <p className="text-[10px] text-neutral-400">
                    You can have multiple phone numbers; contributions from any of them will resolve to your name.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="grace@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Password (at least 12 characters) *
              </label>
              <input
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors active:scale-98 disabled:opacity-50 mt-1"
            >
              {loading ? 'Sending your request…' : 'Create account and request access'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-neutral-500 pt-2">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-emerald-700 hover:text-emerald-700">
            Sign In
          </Link>
        </p>
      </div>

      <div className="mt-6 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-700" />
        <span>Your account details are protected. We review organizer requests before fund creation.</span>
      </div>
    </div>
  );
}
