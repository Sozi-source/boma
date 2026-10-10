'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { bomaService } from '@/lib/services/boma-service';
import { CheckCircleIcon } from '@/components/ui/icons';
import AuthImageCarousel, { SIGNUP_AUTH_IMAGES } from '@/components/auth-image-carousel';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [showSecondary, setShowSecondary] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuthImage, setShowAuthImage] = useState(true);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 12) {
      setError('Use at least 12 characters for your password.');
      setLoading(false);
      return;
    }

    try {
      const additionalPhones = secondaryPhone.trim() ? [secondaryPhone.trim()] : [];
      await bomaService.submitSignupRequest({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        additional_phones: additionalPhones,
        role: 'organizer',
      });

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
        // Keep the request confirmation available if auth is temporarily unavailable.
      }

      setRequestSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not submit your request. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f9f4ea] lg:min-h-[calc(100svh-4rem)]">
      <div className={`mx-auto grid w-full items-center md:min-h-[calc(100svh-2rem)] ${showAuthImage ? 'md:grid-cols-2' : 'max-w-sm py-7 sm:py-12'}`}>
        {showAuthImage && (
          <div className="relative h-32 min-h-[128px] max-h-[128px] w-full overflow-hidden bg-[#f9f4ea] sm:h-56 sm:min-h-[224px] sm:max-h-[300px] md:h-[calc(100svh-4rem)] md:min-h-0 md:max-h-none">
            <AuthImageCarousel images={SIGNUP_AUTH_IMAGES} onError={() => setShowAuthImage(false)} />
          </div>
        )}

        <div className="mx-auto w-full max-w-sm px-4 py-4 sm:py-12 md:flex md:min-h-[calc(100svh-2rem)] md:max-w-none md:flex-col md:justify-center md:px-12">
          <div className="mb-4 space-y-1 text-center sm:mb-6">
            <Link href="/" aria-label="Openhand home" className="mb-2 hidden h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl font-black text-white shadow-xs sm:inline-flex">O</Link>
            <h1 className="text-xl font-black text-neutral-900 sm:text-2xl">Get started</h1>
            <p className="text-xs text-neutral-500">Create an organizer account</p>
          </div>

          <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:space-y-4 sm:p-6">
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</div>}

            {requestSubmitted ? (
              <div className="space-y-4 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircleIcon className="h-6 w-6" /></span>
                <div><h2 className="text-base font-bold text-neutral-900">Request submitted</h2><p className="mt-1 text-xs leading-5 text-neutral-600">You can sign in after your organizer account is approved.</p></div>
                <Link href="/auth/login" className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 sm:text-sm">Go to sign in</Link>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="grid grid-cols-1 items-start gap-x-5 gap-y-3 lg:grid-cols-2 lg:gap-y-4">
                <div>
                  <label htmlFor="full-name" className="mb-1 block text-[11px] font-semibold text-neutral-700">Full name</label>
                  <input id="full-name" type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 sm:py-2 sm:text-sm" />
                </div>

                <div>
                  <label htmlFor="signup-email" className="mb-1 block text-[11px] font-semibold text-neutral-700">Email address</label>
                  <input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 sm:py-2 sm:text-sm" />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1 block text-[11px] font-semibold text-neutral-700">M-Pesa phone number</label>
                  <input id="phone" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 sm:py-2 sm:text-sm" />

                  {!showSecondary ? (
                    <button type="button" onClick={() => setShowSecondary(true)} className="mt-2 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800">+ Add another phone</button>
                  ) : (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="secondary-phone" className="block text-[11px] font-semibold text-neutral-700">Other phone number <span className="font-normal text-neutral-400">(optional)</span></label>
                        <button type="button" onClick={() => { setShowSecondary(false); setSecondaryPhone(''); }} className="text-[10px] text-neutral-400 hover:text-neutral-600">Remove</button>
                      </div>
                      <input id="secondary-phone" type="tel" autoComplete="tel" value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 sm:py-2 sm:text-sm" />
                    </div>
                  )}

                </div>

                <div>
                  <label htmlFor="signup-password" className="mb-1 block text-[11px] font-semibold text-neutral-700">Password <span className="font-normal text-neutral-400">(12+ characters)</span></label>
                  <input id="signup-password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-emerald-500 sm:py-2 sm:text-sm" />
                </div>

                <button type="submit" disabled={loading} className="mt-1 w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-500 active:scale-98 disabled:opacity-50 sm:py-2.5 sm:text-sm lg:col-span-2">
                  {loading ? 'Submitting…' : 'Request organizer access'}
                </button>
              </form>
            )}

            <p className="pt-2 text-center text-xs text-neutral-500">Already have an account? <Link href="/auth/login" className="font-bold text-emerald-700 hover:text-emerald-800">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
