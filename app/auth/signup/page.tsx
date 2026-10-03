'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheckIcon } from '@/components/ui/icons';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 12) {
      setError('Password must be at least 12 characters long.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccessMessage('Registration successful! Please check your email to verify your account or proceed to sign in.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-8 sm:py-14">
      <div className="text-center mb-6 space-y-1">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-mono font-black text-xl shadow-xs mb-2">
          B
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 ">
          Create Organizer Account
        </h1>
        <p className="text-xs text-neutral-500">
          Start pooling funds with verified transparency.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 ">
            {error}
          </div>
        )}

        {successMessage ? (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 space-y-2 text-center">
            <p className="font-semibold">{successMessage}</p>
            <Link
              href="/auth/login"
              className="inline-block rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white text-xs mt-2"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                M-Pesa / Mobile Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 "
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                required
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
              {loading ? 'Creating Account...' : 'Sign Up'}
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
        <span>Strict KYC & Double-Entry Ledger Protection</span>
      </div>
    </div>
  );
}
