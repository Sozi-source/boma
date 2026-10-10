'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminMobileHeader from '@/components/admin/admin-mobile-header';
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

  const isAuthPage = pathname.startsWith('/auth/');
  const isAdminRoute = pathname.startsWith('/admin');
  const isPublicPage = pathname === '/' || pathname === '/bomas'
    || (pathname.startsWith('/bomas/') && pathname !== '/bomas/create');
  const requiresSignIn = !isAuthPage && !isPublicPage;

  useEffect(() => {
    if (authReady && requiresSignIn && !hasUser) {
      router.replace('/auth/login');
    }
  }, [authReady, hasUser, requiresSignIn, router]);

  const showPage = isAuthPage || isPublicPage || (authReady && hasUser);
  const showAppChrome = !isAuthPage && !isPublicPage && authReady && hasUser;
  const showPublicChrome = isPublicPage;

  return (
    <>
      {showAppChrome && isAdminRoute && <AdminSidebar />}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {showAppChrome ? (
          isAdminRoute ? (
            <>
              <div className="lg:hidden"><AdminMobileHeader /></div>
              <div className="sticky top-0 z-30 hidden lg:block"><DesktopHeader /></div>
            </>
          ) : (
            <Navbar authenticated />
          )
        ) : showPublicChrome ? <Navbar authenticated={authReady && hasUser} /> : null}

        <main className={`w-full min-w-0 flex-1 ${showAppChrome ? 'pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-8' : ''}`}>
          {showPage ? children : (
            authReady ? null : (
              <div className="px-4 py-12 text-center text-sm text-slate-500">Checking your sign-in…</div>
            )
          )}
        </main>

        {showAppChrome && !isAdminRoute && <MobileNav authenticated />}

        {showPublicChrome && pathname !== '/' && (
          <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-500 lg:text-left">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>BomaPay — Clear contributions, together.</span>
              <span>Payments are approved on your phone through M-Pesa.</span>
            </div>
          </footer>
        )}

        {showAppChrome && (
          <footer className="hidden items-center justify-between border-t border-slate-200 bg-white px-5 py-2.5 text-[11px] text-slate-500 select-none lg:flex sm:px-8 lg:px-10 xl:px-12">
            <span>Boma — Contributions, open and transparent to every member</span>
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                Paystack M-Pesa payments
              </span>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
