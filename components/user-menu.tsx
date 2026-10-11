'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogoutIcon } from './ui/icons';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

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

  return (
    <button
      type="button"
      onClick={handleSignOut}
      title={`Sign out (${user.name})`}
      aria-label="Sign out"
      className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors shadow-2xs active:scale-95"
    >
      <LogoutIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
    </button>
  );
}
