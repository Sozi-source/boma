'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/admin-sidebar';
import DesktopHeader from '@/components/desktop-header';
import MobileNav from '@/components/mobile-nav';
import Navbar from '@/components/navbar';
import { createClient } from '@/lib/supabase/client';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let authChangeReceived = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION can contain a stale browser-cached session. Verify it
      // with getUser() below before showing authenticated navigation.
      if (event === 'INITIAL_SESSION') return;

      authChangeReceived = true;
      setHasUser(Boolean(session?.user));
      setAuthReady(true);
    });

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!authChangeReceived) {
        setHasUser(Boolean(user));
        setAuthReady(true);
      }
    }).catch(() => {
      if (!authChangeReceived) {
        setHasUser(false);
        setAuthReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const requiresSignIn = pathname === '/dashboard'
    || pathname.startsWith('/admin')
    || pathname === '/bomas/create';
  const isAuthPage = pathname.startsWith('/auth/');

  useEffect(() => {
    if (authReady && requiresSignIn && !hasUser) {
      router.replace('/auth/login');
    }
  }, [authReady, hasUser, requiresSignIn, router]);

  const showPage = !requiresSignIn || (authReady && hasUser);
  const showAppChrome = !isAuthPage && authReady && hasUser;

  return (
    <>
      {showAppChrome && <AdminSidebar />}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {showAppChrome ? (
          <>
            <div className="lg:hidden"><Navbar authenticated /></div>
            <div className="sticky top-0 z-30 hidden lg:block"><DesktopHeader /></div>
          </>
        ) : !isAuthPage && authReady ? (
          <Navbar authenticated={false} />
        ) : null}

        <main className="w-full min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-8">
          {showPage ? children : (
            <div className="px-4 py-12 text-center text-sm text-slate-500">Checking your sign-in…</div>
          )}
        </main>

        {!isAuthPage && authReady && <MobileNav authenticated={hasUser} />}

        {showAppChrome && (
          <footer className="hidden items-center justify-between border-t border-slate-200 bg-white px-5 py-2.5 text-[11px] text-slate-500 select-none lg:flex sm:px-8 lg:px-10 xl:px-12">
            <span>Boma — Contributions, open and transparent to every member</span>
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                M-Pesa &amp; Card Gateway Live
              </span>
              <span>Merchant ID: 1938784</span>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
