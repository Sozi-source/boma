'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheckIcon } from '@/components/ui/icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw authError;
      }

      const next = new URLSearchParams(window.location.search).get('next');
      const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      router.push(destination);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[#f9f4ea] text-[#18181b] font-sans md:overflow-hidden">
      <div className="grid h-full w-full md:grid-cols-[1fr_1.1fr] lg:grid-cols-[1fr_1.15fr]">
        {/* Minimalistic Left Brand Panel (Desktop only, retaining same #f9f4ea bg color) */}
        <aside className="relative hidden md:flex flex-col justify-between p-6 lg:p-8 xl:p-10 bg-[#f9f4ea] border-r border-[#ebdcc5] h-full overflow-hidden">
          {/* Centered Minimal Message + Rectangular Image */}
          <div className="relative z-10 max-w-md my-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#99d452]/40 bg-[#99d452]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-[#14532d] shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#99d452]" /> Clear & honest
            </span>

            <h2 className="mt-3 text-2xl lg:text-3xl xl:text-[34px] font-medium leading-[1.22] tracking-tight text-[#18181b]">
              Every contribution clear to everyone.
            </h2>

            <p className="mt-2 text-xs sm:text-[14px] leading-relaxed text-[#52525b] font-normal">
              Transparent group records and instant updates for your members.
            </p>

            {/* Rectangular Image Space */}
            <div className="mt-4 lg:mt-5 relative w-full aspect-[16/11] max-h-64 lg:max-h-72 xl:max-h-80 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#ebdcc5] shadow-xs bg-[#e8eee7]">
              <Image
                src="/assets/images/funds/community/pexels-droneafrica-12431091.webp"
                alt="Community members joining hands around a shared goal"
                fill
                sizes="(max-width: 1024px) 50vw, 40vw"
                className="object-cover object-center"
                priority
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                <span className="text-xs font-medium tracking-tight">One group record</span>
                <span className="text-[11px] text-white/80 font-normal">Transparent to all members</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-[#71717a] pt-2">
            <ShieldCheckIcon className="h-4 w-4 text-[#14532d]" />
            <span>Bank-grade 256-bit encryption</span>
          </div>
        </aside>

        {/* Right Form Area */}
        <main className="flex flex-col justify-center px-4 py-4 sm:px-8 lg:px-12 h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-sm sm:max-w-md my-auto">
            {/* Form Card */}
            <div className="rounded-3xl border border-[#ebdcc5] bg-white p-5 sm:p-7 shadow-[0_4px_24px_rgba(24,24,27,0.03)]">
              <div className="mb-4 sm:mb-5">
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#18181b]">
                  Welcome back
                </h1>
                <p className="mt-1 text-xs sm:text-[13px] text-[#52525b] font-normal">
                  Sign in to your group organizer workspace
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-3.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-[#18181b]">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#dce0d3] bg-[#fafbfa] px-3.5 py-2 text-xs sm:text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#99d452] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#99d452]/20 transition-all"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-medium text-[#18181b]">
                      Password
                    </label>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-[#dce0d3] bg-[#fafbfa] px-3.5 py-2 text-xs sm:text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#99d452] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#99d452]/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex min-h-10 w-full items-center justify-center rounded-full bg-[#99d452] py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_14px_rgba(153,212,82,0.32)] transition hover:bg-[#8ac841] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] text-center text-xs text-[#52525b]">
                Need an organizer account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-medium text-[#14532d] hover:text-[#166534] underline underline-offset-2"
                >
                  Create an account
                </Link>
              </div>
            </div>

            <p className="mt-3.5 text-center text-xs text-[#71717a]">
              Just making a contribution?{' '}
              <Link href="/bomas" className="font-medium text-[#14532d] hover:underline">
                Explore goals
              </Link>{' '}
              — no account needed.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
