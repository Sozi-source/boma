'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
          href: '/dashboard',
          label: 'Overview',
          icon: HomeIcon,
          exact: true,
        },
        {
          href: '/activity',
          label: 'Activity & Feed',
          icon: ClockIcon,
          exact: false,
        },
        {
          href: '/bomas',
          label: 'Funds & Campaigns',
          icon: BuildingLibraryIcon,
          exact: true,
        },
      ],
    },
    {
      title: 'CHAMA & MEMBERS',
      items: [
        {
          href: '/admin/users',
          label: 'Member Directory',
          icon: UsersIcon,
          exact: false,
        },
        {
          href: '/admin/approvals',
          label: 'Signup Approvals',
          icon: CheckCircleIcon,
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
          label: 'Payout Accounts',
          icon: SmartphoneIcon,
          exact: false,
        },
        {
          href: '/admin',
          label: 'System Operations',
          icon: ShieldCheckIcon,
          exact: true,
        },
      ],
    },
  ];

  return (
    <aside 
      className="hidden lg:flex w-64 xl:w-72 flex-col shrink-0 bg-white text-slate-700 border-r border-slate-200 h-screen sticky top-0 z-40 select-none shadow-xs"
    >
      {/* Merchant / Organization Account Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl overflow-hidden shadow-xs shrink-0 bg-white border border-slate-200/80 flex items-center justify-center p-1 transition-transform group-hover:scale-105">
            <Image
              src="/assets/icons/openhand.webp"
              alt="Openhand"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 block truncate tracking-tight">
                Clarix Innovators
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-mono text-slate-500 tabular-nums whitespace-nowrap">
                ID: 1938784
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-sm whitespace-nowrap">
                Verified
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Structured Navigation */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-3 block">
              {section.title}
            </span>

            <div className="space-y-0.5 pt-0.5">
              {section.items.map((item) => {
                const isActive = item.exact 
                  ? pathname === item.href 
                  : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-400'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 tabular-nums whitespace-nowrap ${
                        isActive 
                          ? 'bg-emerald-700 text-white' 
                          : 'bg-emerald-100 text-emerald-800'
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

        {/* Quick Action Button in Sidebar */}
        <div className="pt-2">
          <Link
            href="/bomas/create"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add New Fund</span>
          </Link>
        </div>
      </div>

      {/* Minimal Quiet Status Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800 text-xs">Live System</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 tabular-nums whitespace-nowrap">Paystack M-Pesa</span>
      </div>
    </aside>
  );
}
