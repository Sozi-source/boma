'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheckIcon } from '@/components/ui/icons';
import AuthImageCarousel, { LOGIN_AUTH_IMAGES } from '@/components/auth-image-carousel';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuthImage, setShowAuthImage] = useState(true);

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
    <div className="min-h-screen w-full bg-[#f9f4ea] lg:min-h-[calc(100svh-4rem)]">
      <div className={`mx-auto grid w-full items-center md:min-h-[calc(100svh-2rem)] ${showAuthImage ? 'md:grid-cols-2' : 'max-w-sm py-7 sm:py-12'}`}>
        {showAuthImage && (
          <div className="relative h-40 min-h-[160px] max-h-[240px] w-full overflow-hidden bg-[#f9f4ea] sm:h-56 sm:max-h-[300px] md:h-[calc(100svh-4rem)] md:min-h-0 md:max-h-none">
            <AuthImageCarousel images={LOGIN_AUTH_IMAGES} onError={() => setShowAuthImage(false)} />
          </div>
        )}

        <div className="mx-auto w-full max-w-sm px-4 py-7 sm:py-12 md:flex md:min-h-[calc(100svh-2rem)] md:max-w-none md:flex-col md:justify-center md:px-12">
          <div className="mb-6 space-y-1 text-center">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-mono text-xl font-black text-white shadow-xs">
              B
            </div>
            <h1 className="text-xl font-black text-neutral-900 sm:text-2xl">
              Welcome back
            </h1>
          </div>

          <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-neutral-700">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-neutral-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-500 active:scale-98 disabled:opacity-50 sm:text-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <p className="pt-2 text-center text-xs text-neutral-500">
              Need an organizer account?{' '}
              <Link href="/auth/signup" className="font-bold text-emerald-700 hover:text-emerald-700">
                Create an Account
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-neutral-500">
            Just making a contribution? <Link href="/bomas" className="font-semibold text-emerald-700">Explore group goals</Link> — no account needed.
          </p>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-700" />
            <span>Secure sign-in to your group workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
}
