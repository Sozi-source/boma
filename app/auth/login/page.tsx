'use client';

import React, { useState } from 'react';
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

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Set local demo session so testing works immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('bomapay_auth_user', JSON.stringify({
          id: 'user-001',
          name: 'David Omondi (Demo Organizer)',
          email: 'david.omondi@bomapay.com',
          phone: '+254 712 345 678',
        }));
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Failed to initialize demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-8 sm:py-16">
      <div className="text-center mb-6 space-y-1">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-mono font-black text-xl shadow-xs mb-2">
          B
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 ">
          Welcome to Boma
        </h1>
        <p className="text-xs text-neutral-500">
          Sign in to manage your michango and inspect ledger activity.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 ">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-semibold text-neutral-700 ">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-neutral-100 w-full" />
          <span className="bg-white px-2 text-[10px] text-neutral-400 uppercase font-semibold absolute">
            or instant test
          </span>
        </div>

        {/* Quick Demo Organizer Login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 py-2 text-xs font-semibold text-neutral-700 transition-colors"
        >
          Quick Demo Organizer Sign In
        </button>

        <p className="text-center text-xs text-neutral-500 pt-2">
          New to Boma?{' '}
          <Link href="/auth/signup" className="font-bold text-emerald-600 hover:text-emerald-500">
            Create an Account
          </Link>
        </p>
      </div>

      <div className="mt-6 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
        <span>Protected by Supabase Auth & Double-Entry Ledger</span>
      </div>
    </div>
  );
}
