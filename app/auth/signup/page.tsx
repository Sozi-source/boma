'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { bomaService } from '@/lib/services/boma-service';
import { CheckCircleIcon, ShieldCheckIcon } from '@/components/ui/icons';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [showSecondary, setShowSecondary] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="h-screen max-h-screen w-full bg-[#f9f4ea] text-[#18181b] font-sans md:overflow-hidden">
      <div className="grid h-full w-full md:grid-cols-[1fr_1.1fr] lg:grid-cols-[1fr_1.15fr]">
        {/* Minimalistic Left Brand Panel (Desktop only, retaining exact #f9f4ea bg color) */}
        <aside className="relative hidden md:flex flex-col justify-between p-6 lg:p-8 xl:p-10 bg-[#f9f4ea] border-r border-[#ebdcc5] h-full overflow-hidden">
          {/* Centered Minimal Message + Rectangular Image */}
          <div className="relative z-10 max-w-md my-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#99d452]/40 bg-[#99d452]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-[#14532d] shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#99d452]" /> Made for shared goals
            </span>

            <h2 className="mt-3 text-2xl lg:text-3xl xl:text-[34px] font-medium leading-[1.22] tracking-tight text-[#18181b]">
              A little from each of us. A lot for all of us.
            </h2>

            <p className="mt-2 text-xs sm:text-[14px] leading-relaxed text-[#52525b] font-normal">
              When people unite around a shared goal, progress becomes simple. Bring your chama, family, or community together with honest records.
            </p>

            {/* Rectangular Image Space */}
            <div className="mt-4 lg:mt-5 relative w-full aspect-[16/11] max-h-64 lg:max-h-72 xl:max-h-80 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#ebdcc5] shadow-xs bg-[#e8eee7]">
              <Image
                src="/assets/images/funds/family/family_1440w_web-xl.webp"
                alt="Family and community members gathered around a phone tracking their goal"
                fill
                sizes="(max-width: 1024px) 50vw, 40vw"
                className="object-cover object-center"
                priority
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                <span className="text-xs font-medium tracking-tight">One group record</span>
                <span className="text-[11px] text-white/80 font-normal">Together for every milestone</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Note */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-[#71717a] pt-2">
            <ShieldCheckIcon className="h-4 w-4 text-[#14532d]" />
            <span>Zero setup fees · Bank-grade security</span>
          </div>
        </aside>

        {/* Right Form Area */}
        <main className="flex flex-col justify-center px-4 py-4 sm:px-8 lg:px-12 h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-lg my-auto">
            {/* Form Card */}
            <div className="rounded-3xl border border-[#ebdcc5] bg-white p-5 sm:p-7 shadow-[0_4px_24px_rgba(24,24,27,0.03)]">
              <div className="mb-4 sm:mb-5">
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#18181b]">
                  Get started
                </h1>
                <p className="mt-0.5 text-xs sm:text-[13px] text-[#52525b] font-normal">
                  Create an organizer account for your group
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-3.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {requestSubmitted ? (
                <div className="space-y-3.5 py-2 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#99d452]/20 text-[#14532d]">
                    <CheckCircleIcon className="h-6 w-6 text-[#14532d]" />
                  </span>
                  <div>
                    <h2 className="text-base font-medium text-[#18181b]">Request submitted</h2>
                    <p className="mt-1 text-xs text-[#52525b] leading-relaxed max-w-sm mx-auto">
                      Your request has been received. You can sign in as soon as your organizer account is reviewed.
                    </p>
                  </div>
                  <Link
                    href="/auth/login"
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#99d452] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_14px_rgba(153,212,82,0.3)] transition hover:bg-[#8ac841]"
                  >
                    Go to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-3.5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="full-name" className="mb-1 block text-xs font-medium text-[#18181b]">
                        Full name
                      </label>
                      <input
                        id="full-name"
                        type="text"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Mary Wanjiku"
                        className="w-full rounded-xl border border-[#dce0d3] bg-[#fafbfa] px-3.5 py-2 text-xs sm:text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#99d452] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#99d452]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="signup-email" className="mb-1 block text-xs font-medium text-[#18181b]">
                        Email address
                      </label>
                      <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full rounded-xl border border-[#dce0d3] bg-[#fafbfa] px-3.5 py-2 text-xs sm:text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#99d452] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#99d452]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label htmlFor="phone" className="block text-xs font-medium text-[#18181b]">
                          M-Pesa phone
                        </label>
                        {!showSecondary && (
                          <button
                            type="button"
                            onClick={() => setShowSecondary(true)}
                            className="text-[11px] font-medium text-[#14532d] hover:text-[#166534]"
                          >
                            + Extra
                          </button>
                        )}
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        className="w-full rounded-xl border border-[#dce0d3] bg-[#fafbfa] px-3.5 py-2 text-xs sm:text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#99d452] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#99d452]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="signup-password" className="mb-1 block text-xs font-medium text-[#18181b]">
                        Password <span className="font-normal text-[#71717a]">(12+ chars)</span>
                      </label>
                      <input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={12}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 12 characters"
                        className="w-full rounded-xl border border-[#dce0d3] bg-[#fafbfa] px-3.5 py-2 text-xs sm:text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#99d452] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#99d452]/20 transition-all"
                      />
                    </div>
                  </div>

                  {showSecondary && (
                    <div className="space-y-1 rounded-xl bg-[#f4f5f7] p-2.5 border border-[#dce0d3]">
                      <div className="flex items-center justify-between">
                        <label htmlFor="secondary-phone" className="block text-xs font-medium text-[#18181b]">
                          Other phone number <span className="font-normal text-[#71717a]">(optional)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSecondary(false);
                            setSecondaryPhone('');
                          }}
                          className="text-[11px] text-[#71717a] hover:text-[#18181b]"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        id="secondary-phone"
                        type="tel"
                        autoComplete="tel"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        placeholder="Secondary contact phone"
                        className="w-full rounded-xl border border-[#dce0d3] bg-white px-3 py-1.5 text-xs text-[#18181b] focus:border-[#99d452] focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 flex min-h-10 w-full items-center justify-center rounded-full bg-[#99d452] py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_14px_rgba(153,212,82,0.32)] transition hover:bg-[#8ac841] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? 'Submitting…' : 'Request organizer access'}
                  </button>
                </form>
              )}

              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] text-center text-xs text-[#52525b]">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-[#14532d] hover:text-[#166534] underline underline-offset-2"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
