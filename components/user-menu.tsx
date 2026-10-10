'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WalletIcon } from './ui/icons';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let authEventReceived = false;
    const applyUser = (sbUser: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']) => {
      setUser(sbUser ? {
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Organizer',
        email: sbUser.email || '',
        phone: sbUser.user_metadata?.phone,
      } : null);
      if (!sbUser) setMenuOpen(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      applyUser(session?.user ?? null);
    });

    const fetchUser = async () => {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!authEventReceived) applyUser(sbUser);
      } catch {
        if (!authEventReceived) applyUser(null);
      }
    };

    void fetchUser();
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('bomapay_auth_user');
    }

    setUser(null);
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-100 transition-colors"
        aria-label="User Account Menu"
      >
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-[11px] shadow-xs">
          {initials}
        </div>
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.email}
              </p>
            </div>

            <div className="py-1 space-y-0.5">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <WalletIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dashboard &amp; Wallet</span>
              </Link>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
