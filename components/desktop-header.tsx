'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './user-menu';

const sectionNames: Array<[string, string]> = [
  ['/admin/approvals', 'Organizer requests'],
  ['/admin/subaccounts', 'Settlement destinations'],
  ['/admin/ledger', 'Ledger records'],
  ['/admin/funds', 'Group funds'],
  ['/admin/senders', 'Contributor records'],
  ['/admin/users', 'People and accounts'],
  ['/admin', 'Operations overview'],
];

export default function DesktopHeader() {
  const pathname = usePathname();
  const title = sectionNames.find(([path]) => path === '/admin'
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`))?.[1] ?? 'Openhand operations';

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 xl:px-10">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">Openhand workspace</p>
        <h1 className="mt-0.5 truncate text-sm font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/bomas/create" className="inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white transition hover:bg-emerald-800">Start a group fund</Link>
        <div className="border-l border-slate-200 pl-3"><UserMenu /></div>
      </div>
    </header>
  );
}
