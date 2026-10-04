'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bomaService } from '@/lib/services/boma-service';
import { 
  HomeIcon,
  ShieldCheckIcon,
  UsersIcon, 
  ClockIcon, 
  SmartphoneIcon, 
  CreditCardIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  PlusIcon
} from '@/components/ui/icons';

interface AdminStats {
  pendingApprovals: number;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<AdminStats>({
    pendingApprovals: 0,
  });

  const loadSidebarStats = async () => {
    try {
      const requests = await bomaService.getSignupRequests('pending_approval');
      setStats({
        pendingApprovals: requests.length,
      });
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadSidebarStats();
    const interval = setInterval(loadSidebarStats, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        {
          href: '/',
          label: 'Home Overview',
          icon: HomeIcon,
          exact: true,
        },
        {
          href: '/admin',
          label: 'Admin Dashboard',
          icon: ShieldCheckIcon,
          exact: true,
        },
        {
          href: '/bomas',
          label: 'Funds & Campaigns',
          icon: BuildingLibraryIcon,
          exact: false,
        },
      ],
    },
    {
      title: 'MEMBERS & ACCESS',
      items: [
        {
          href: '/admin/users',
          label: 'User Directory',
          icon: UsersIcon,
          exact: false,
        },
        {
          href: '/admin/approvals',
          label: 'Signup Approvals',
          icon: ClockIcon,
          exact: false,
          badge: stats.pendingApprovals > 0 ? `${stats.pendingApprovals}` : null,
        },
      ],
    },
    {
      title: 'TREASURY & AUDIT',
      items: [
        {
          href: '/admin/ledger',
          label: 'Central Ledger',
          icon: CreditCardIcon,
          exact: false,
        },
        {
          href: '/admin/subaccounts',
          label: 'Subaccounts & Banks',
          icon: SmartphoneIcon,
          exact: false,
        },
        {
          href: '/bomas/create',
          label: 'Start New Fund',
          icon: PlusIcon,
          exact: false,
        },
      ],
    },
  ];

  return (
    <>
      {/* Laptop & Desktop Vibrant Teal Green Fintech Sidebar */}
      <aside 
        className="hidden lg:flex w-64 xl:w-72 flex-col shrink-0 bg-gradient-to-b from-[#0f8579] via-[#0d766e] to-[#0a5852] text-teal-50 border-r border-teal-800/40 h-screen sticky top-0 z-40 select-none shadow-sm"
        style={{ backgroundColor: '#0f8579' }}
      >
        
        {/* Merchant / Organization Account Header */}
        <div className="p-4 border-b border-teal-600/40 bg-teal-900/25">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 font-mono font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              B
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-white block truncate tracking-tight">
                Clarix Innovators
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-teal-200/80 block truncate">
                  ID: 1938784
                </span>
                <span className="text-teal-400">•</span>
                <span className="text-[9px] font-semibold uppercase text-amber-300 bg-amber-400/15 border border-amber-400/40 px-1.5 py-0.2 rounded-sm">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Navigation — Comfortable vertical rhythm taking >= 3/4 of height */}
        <div className="p-3.5 flex-1 overflow-y-auto custom-sidebar-scrollbar space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 px-3 block">
                {section.title}
              </span>

              <div className="space-y-1 pt-0.5">
                {section.items.map((item) => {
                  const isActive = item.exact 
                    ? pathname === item.href 
                    : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                          : 'text-teal-100 hover:bg-white/10 hover:text-white font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? 'text-slate-950 stroke-[2.2]' : 'text-teal-200/80'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                          isActive 
                            ? 'bg-slate-900 text-amber-300' 
                            : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

        </div>

        {/* Minimal Quiet Status Footer */}
        <div className="p-3.5 border-t border-teal-600/40 bg-teal-900/25 flex items-center justify-between text-xs text-teal-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="font-semibold text-white text-xs">Live System</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-teal-300/80">v1.2</span>
        </div>
      </aside>
    </>
  );
}
