'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const audiences = [
  { label: 'Chamas', detail: 'Plan together', image: '/assets/images/funds/community/pexels-pixabay-53958.webp' },
  { label: 'Families', detail: 'Show up for each other', image: '/assets/images/funds/family/family_1080w_web.webp' },
  { label: 'Community groups', detail: 'Make local goals happen', image: '/assets/images/funds/community/community_1080w_web.webp' },
] as const;

const steps = [
  {
    number: '01',
    title: 'Set a goal',
    detail: "Give your group a clear purpose and milestone. It's simple and quick to start a shared fund.",
    icon: '/assets/icons/target.webp',
  },
  {
    number: '02',
    title: 'Bring people in',
    detail: 'Share with your members instantly. Everyone tracks contributions together without confusion.',
    icon: '/assets/icons/group.webp',
  },
  {
    number: '03',
    title: 'Follow progress',
    detail: 'One transparent group record in real time. Full accountability and momentum until the goal is met.',
    icon: '/assets/icons/records.webp',
  },
] as const;

function Icon({ name, className = 'h-6 w-6' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };

  if (name === 'people') return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.4A4.6 4.6 0 0 1 8.1 13h1.8a4.6 4.6 0 0 1 4.6 4.6V19" /><path d="M16 5.2a3 3 0 0 1 0 5.7M17 13.3a4.5 4.5 0 0 1 3.5 4.4V19" /></svg>;
  if (name === 'home') return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
  if (name === 'place') return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === 'target') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></svg>;
  if (name === 'record') return <svg {...common}><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M14 3.5v5h5M8 13h8M8 17h8" /></svg>;
  if (name === 'phone') return <svg {...common}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10 18h4" /></svg>;
  if (name === 'lock') return <svg {...common}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></svg>;
  return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
}

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data: { user } }) => {
        setAuthenticated(Boolean(user));
        setAuthChecked(true);
      }).catch(() => setAuthChecked(true));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthenticated(Boolean(session?.user));
        setAuthChecked(true);
      });
      return () => subscription.unsubscribe();
    } catch {
      // Offline fallback
      setAuthChecked(true);
    }
  }, []);

  // Until we know whether the user is signed in, send them to sign in (which links to signup)
  // so an existing user is never dropped on the signup page by mistake.
  const ctaHref = authenticated
    ? '/bomas/create'
    : authChecked
      ? '/auth/signup?role=organizer'
      : '/auth/login?next=%2Fbomas%2Fcreate';
  const ctaLabel = authenticated ? 'Add fund' : authChecked ? 'Start a group' : 'Continue';
  const ctaLabelSecondary = authenticated ? 'Add fund' : authChecked ? 'Get Started' : 'Continue';
  return (
    <div className="overflow-hidden bg-[#f4f5f7] text-[#18181b] font-sans">
      {/* Mobile Hero (Screen < sm): Native-styled compact hero */}
      <section className="relative sm:hidden overflow-hidden bg-[#071710] px-3.5 pt-3.5 pb-4 border-b border-[#183628]">
        <div className="relative rounded-3xl overflow-hidden border border-[#1f4835] bg-gradient-to-b from-[#112d22] via-[#0d251c] to-[#071a12] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.4)] p-5">
          {/* Subtle ambient light glow at top */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-36 w-64 rounded-full bg-[#99d452]/20 blur-3xl"
          />

          {/* Hero Content */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-[#99d452] border border-white/15 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#99d452]" /> Made for shared goals
            </span>

            <h1 className="mt-2.5 text-[1.8rem] font-medium leading-[1.22] tracking-tight text-white">
              Together, we can make it happen.
            </h1>

            <p className="mt-2 text-[13px] text-white/80 leading-[1.65] font-normal -tracking-[0.2px]">
              Bring your people together around a goal with transparent, shared records.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={ctaHref}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#99d452] px-4 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(153,212,82,0.32)] transition active:scale-[0.98]"
              >
                {ctaLabel} <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/bomas"
                className="flex h-10 w-full items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 text-xs font-medium text-white transition active:scale-[0.98]"
              >
                Explore goals
              </Link>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-[10px] text-white/60">
              <span>No account needed to explore</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-medium text-[#99d452] border border-white/10">
                <Icon name="record" className="h-3 w-3" /> One group record
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Hero (Screen >= sm): ZenLipa-styled landing page typography without bold */}
      <section className="relative hidden sm:block border-b border-[#dce0d3] bg-[#f4f5f7]">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-8 pb-20 pt-16 lg:min-h-[620px] lg:grid-cols-[.98fr_1.02fr] lg:gap-16 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#99d452]/40 bg-[#99d452]/10 px-3.5 py-1 text-xs font-medium uppercase tracking-[0.1em] text-[#14532d] shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#99d452] animate-pulse" /> Made for shared goals
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl xl:text-[56px] 2xl:text-[62px] font-medium leading-[1.18] tracking-tight text-[#18181b]">
              Together, we can make it happen.
            </h1>
            <p className="mt-5 max-w-lg text-base sm:text-lg leading-[1.75] -tracking-[0.3px] text-[#52525b] font-normal">
              Bring your people together around a shared goal with clear records, transparent updates, and collective momentum.
            </p>
            <div className="mt-8 flex flex-row items-center gap-3.5">
              <Link
                href={ctaHref}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#99d452] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(153,212,82,0.32)] transition hover:bg-[#8ac841] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99d452]"
              >
                {ctaLabel} <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/bomas"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#dce0d3] bg-white px-7 py-3 text-[15px] font-medium text-[#18181b] transition hover:border-[#b8c2ad] hover:bg-[#fafbfa] active:scale-[0.98]"
              >
                Explore goals
              </Link>
            </div>
            <p className="mt-3.5 text-xs text-[#71717a] font-normal -tracking-[0.2px]">No account needed to explore public goals.</p>
          </div>

          <figure className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2.25rem] bg-[#d9e9dc]/60 blur-2xl" />
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem] border-[6px] border-white bg-[#e4eee5] shadow-[0_24px_70px_rgba(24,24,27,.09)]">
              <Image
                src="/assets/images/dashboard/money-transfer-1671.webp"
                alt="A mobile money transfer scene showing a secure digital payment"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#102b20]/75 via-transparent to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-7">
                <p className="max-w-xs text-xl sm:text-2xl font-medium leading-tight tracking-tight text-white">
                  A little from each of us. A lot for all of us.
                </p>
                <p className="shrink-0 text-[11px] text-white/80 uppercase tracking-wider font-medium">Digital transfers</p>
              </figcaption>
            </div>
            <div className="absolute -bottom-5 -left-4 flex items-center gap-3.5 rounded-2xl border border-[#dce0d3] bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-lg">
              <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#eef7ec] border border-[#d6ebd5] p-2 shadow-2xs">
                <Image src="/assets/icons/openhand.webp" alt="Openhand" width={36} height={36} className="h-full w-full object-contain" />
              </span>
              <div className="leading-tight">
                <span className="text-[14px] font-medium text-[#18181b] block">One clear group record</span>
                <span className="text-[12px] text-[#71717a] font-normal block -tracking-[0.2px] mt-0.5">Transparent to all members</span>
              </div>
            </div>
          </figure>
        </div>
      </section>

      {/* Audience Section (1-Column on Mobile, 3-Column on Desktop) */}
      <section aria-label="Who Openhand is for" className="border-y border-[#dce0d3] bg-white py-4 sm:py-6">
        <div className="mx-auto grid grid-cols-1 gap-2.5 px-4 sm:max-w-7xl sm:grid-cols-3 sm:gap-3.5 sm:px-8 lg:px-12">
          {audiences.map((audience) => (
            <div
              key={audience.label}
              className="flex items-center gap-3 rounded-2xl border border-[#dce0d3] bg-white p-2.5 shadow-[0_2px_8px_rgba(24,24,27,0.03)] sm:rounded-2xl sm:p-4 lg:p-4.5 sm:gap-4 sm:hover:shadow-[0_8px_20px_rgba(24,24,27,0.06)] sm:hover:-translate-y-0.5 transition-all active:scale-[0.99]"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#eaf0e9] ring-2 ring-[#eaf2e9] sm:h-20 sm:w-20 lg:h-22 lg:w-22 sm:rounded-2xl sm:ring-0 shadow-2xs">
                <Image src={audience.image} alt="" fill sizes="(max-width: 640px) 44px, (max-width: 1024px) 80px, 88px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[#18181b] truncate sm:text-base lg:text-[17px] tracking-tight">{audience.label}</p>
                <p className="mt-0.5 text-[11px] font-normal text-[#71717a] truncate sm:text-xs lg:text-[13px] -tracking-[0.2px]">{audience.detail}</p>
              </div>
              <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4f5f7] text-[#a1a1aa] sm:hidden">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works: 3 Steps (Centralised Header without bold) */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        {/* Centralised Section Header without bold */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs sm:text-[13px] font-medium uppercase tracking-[0.12em] text-[#14532d]">
            HOW IT WORKS
          </p>
          <h2 className="mt-3 text-2xl sm:text-4xl xl:text-[42px] font-medium leading-[1.2] tracking-tight text-[#18181b]">
            From idea to shared progress.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] sm:text-[17px] leading-[1.75] -tracking-[0.3px] text-[#52525b] font-normal">
            Three clear steps. Your group stays in control from the first contribution to the final goal.
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group relative rounded-3xl bg-white p-2.5 sm:p-3 border border-[#dce0d3] shadow-[0_4px_20px_rgba(24,24,27,.03)] hover:shadow-[0_14px_32px_rgba(24,24,27,.06)] hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-[#dce0d3] p-5 sm:p-6 lg:p-7">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f2faf0] to-[#e4f3e1] border border-[#cee7cb] p-2.5 shadow-2xs">
                      <Image
                        src={step.icon}
                        alt={step.title}
                        width={48}
                        height={48}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    </span>
                    <span className="inline-block rounded-full bg-[#99d452]/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[#14532d] border border-[#99d452]/30">
                      STEP {step.number}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl sm:text-[22px] font-medium tracking-tight text-[#18181b]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] sm:text-[15px] leading-[1.65] text-[#52525b] font-normal -tracking-[0.2px]">
                    {step.detail}
                  </p>
                </div>

                <div className="mt-6 pt-2">
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center justify-center rounded-full border border-[#d4d4d8] bg-white px-6 py-2 text-[14px] font-medium text-[#18181b] hover:border-[#18181b] hover:bg-[#fafbfa] active:scale-[0.98] transition"
                  >
                    {ctaLabelSecondary}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Glance: Across Africa, Made for groups, One shared goal (Centralised Header without bold) */}
      <section aria-label="Openhand at a glance" className="border-t border-[#dce0d3] bg-[#f4f5f7] px-4 py-12 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        {/* Centralised Header for Last Cards without bold */}
        <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-14">
          <p className="text-xs sm:text-[13px] font-medium uppercase tracking-[0.12em] text-[#14532d]">
            BUILT FOR COMMUNITIES
          </p>
          <h2 className="mt-3 text-2xl sm:text-4xl xl:text-[42px] font-medium leading-[1.2] tracking-tight text-[#18181b]">
            Simple, transparent, and made for everyone.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] sm:text-[17px] leading-[1.75] -tracking-[0.3px] text-[#52525b] font-normal">
            Bring collective momentum and honest records to families, chamas, and projects wherever you are.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {[
            { iconType: 'africa', title: 'Across Africa', detail: 'Shared goals for groups wherever they are across the continent.' },
            { iconType: 'group', title: 'Made for groups', detail: 'Families, chamas, welfare groups, and vibrant communities.' },
            { iconType: 'target', title: 'One shared goal', detail: 'Keep the purpose, milestone, and progress clear to everyone.' },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl sm:rounded-3xl bg-white p-2.5 sm:p-3 border border-[#dce0d3] shadow-[0_4px_20px_rgba(24,24,27,.03)] hover:shadow-[0_14px_32px_rgba(24,24,27,.07)] transition-all hover:-translate-y-0.5"
            >
              <div className="flex min-h-40 sm:min-h-56 flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-dashed border-[#dce0d3] px-5 py-6 sm:py-8 text-center">
                <span className="flex h-14 w-14 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f2faf0] to-[#e4f3e1] border border-[#cee7cb] p-2.5 text-[#14532d] shadow-2xs">
                  {item.iconType === 'africa' && (
                    <Image
                      src="/assets/icons/africa-sunset-color-128.webp"
                      alt="Across Africa"
                      width={64}
                      height={64}
                      className="h-full w-full object-contain"
                    />
                  )}
                  {item.iconType === 'group' && (
                    <Image
                      src="/assets/icons/group.webp"
                      alt="Made for groups"
                      width={56}
                      height={56}
                      className="h-full w-full object-contain"
                    />
                  )}
                  {item.iconType === 'target' && (
                    <Image
                      src="/assets/icons/target.webp"
                      alt="One shared goal"
                      width={56}
                      height={56}
                      className="h-full w-full object-contain"
                    />
                  )}
                </span>
                <h3 className="mt-3.5 text-base sm:text-xl xl:text-[22px] font-medium tracking-tight text-[#18181b]">{item.title}</h3>
                <p className="mt-1.5 max-w-[16rem] text-xs sm:text-[14px] xl:text-[15px] leading-[1.65] text-[#52525b] -tracking-[0.2px] font-normal">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer (ZenLipa Minimalist Footer Style) */}
      <footer className="border-t border-[#dce0d3] bg-white pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center text-xs sm:text-[13px] text-[#71717a] -tracking-[0.2px] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left lg:px-12">
          <span>&copy; {new Date().getFullYear()} Openhand · Group contributions, made clear.</span>
          <div className="flex justify-center gap-5 sm:justify-start">
            <Link href="/bomas" className="text-[#18181b] hover:text-[#14532d] font-medium transition-colors">Explore goals</Link>
            <Link href="/auth/login" className="text-[#18181b] hover:text-[#14532d] font-medium transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
