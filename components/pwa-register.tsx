'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // In development or on localhost, proactively unregister any service worker & clear cache
    if ('serviceWorker' in navigator) {
      const isLocalhost = Boolean(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '[::1]' ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
      );

      if (process.env.NODE_ENV === 'development' || isLocalhost) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((names) => {
            for (const name of names) {
              caches.delete(name);
            }
          });
        }
        return;
      }

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            console.log('Boma SW registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('Boma SW registration failed:', err);
          });
      });
    }

    // Capture beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  // If already installed, dismissed, or no prompt available, don't show prompt banner
  if (isInstalled || isDismissed || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md border border-emerald-900/10 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/icons/icon-96x96.png"
            alt="Boma Logo"
            width={40}
            height={40}
            className="w-10 h-10 shrink-0 rounded-xl object-cover shadow-xs border border-emerald-800/10"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-neutral-900 truncate">Install Boma App</h4>
            <p className="text-[11px] text-neutral-500 truncate">Fast access & instant tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsDismissed(true)}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all active:scale-95"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
