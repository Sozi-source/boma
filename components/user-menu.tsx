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
    const fetchUser = async () => {
      // 1. Check Supabase Auth
      try {
        const supabase = createClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();

        if (sbUser) {
          setUser({
            id: sbUser.id,
            name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Organizer',
            email: sbUser.email || '',
            phone: sbUser.user_metadata?.phone,
          });
          return;
        }
      } catch {
        // Fall back to demo session
      }

      // 2. Check local demo session
      if (typeof window !== 'undefined') {
        const demo = localStorage.getItem('bomapay_auth_user');
        if (demo) {
          try {
            setUser(JSON.parse(demo));
          } catch {
            setUser(null);
          }
        }
      }
    };

    fetchUser();
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
        className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 transition-colors"
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
        className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
          <div className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {user.email}
              </p>
            </div>

            <div className="py-1">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <WalletIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dashboard & Wallet</span>
              </Link>
            </div>

            <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
