import Image from 'next/image';
import Link from 'next/link';

const audiences = [
  { label: 'Chamas', detail: 'Plan together', image: '/assets/images/funds/community/pexels-pixabay-53958.webp' },
  { label: 'Families', detail: 'Show up for each other', image: '/assets/images/funds/family/family_1080w_web.webp' },
  { label: 'Community groups', detail: 'Make local goals happen', image: '/assets/images/funds/community/community_1080w_web.webp' },
] as const;

const steps = [
  { number: '01', title: 'Set a goal', detail: 'Give your group a clear purpose.', icon: '/assets/icons/target.webp' },
  { number: '02', title: 'Bring people in', detail: 'Share the goal with your members.', icon: '/assets/icons/group.webp' },
  { number: '03', title: 'Follow progress', detail: 'Keep contributions in one record.', icon: '/assets/icons/records.webp' },
] as const;

const testimonials = [
  { quote: 'We know what we are raising for, and everyone can follow the progress.', group: 'Family group' },
  { quote: 'Contributing together feels more organized when the records are easy to see.', group: 'Chama' },
  { quote: 'We can bring people around one goal, even when they are far apart.', group: 'Welfare group' },
  { quote: 'Our group has one clear place to see how we are moving toward the plan.', group: 'Community group' },
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
  return (
    <div className="overflow-hidden bg-[#fbfcfa] text-[#17251f]">
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10.5px] font-bold text-[#b5f269] border border-white/15 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#99d452]" /> Made for shared goals
            </span>

            <h1 className="mt-2.5 text-[1.65rem] font-extrabold leading-[1.12] tracking-tight text-white">
              Together, we can make it happen.
            </h1>

            <p className="mt-1.5 text-xs text-white/80 leading-relaxed font-normal">
              Bring your people together around a goal with transparent, shared records.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/auth/signup?role=organizer"
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#a2e85a] to-[#88d73b] px-4 text-xs font-bold text-[#0f281c] shadow-[0_4px_16px_rgba(162,232,90,0.32)] transition active:scale-[0.98]"
              >
                Start a group <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/bomas"
                className="flex h-10 w-full items-center justify-center rounded-xl bg-white/10 border border-white/20 px-4 text-xs font-semibold text-white transition active:scale-[0.98]"
              >
                Explore goals
              </Link>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-[10px] text-white/60">
              <span>No account needed to explore</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-medium text-[#b5f269] border border-white/10">
                <Icon name="record" className="h-3 w-3" /> One group record
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Hero (Screen >= sm): Preserved 100% untouched */}
      <section className="relative hidden sm:block border-b border-[#e8ece7] bg-[#f5f6f4]">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-8 pb-20 pt-16 lg:min-h-[620px] lg:grid-cols-[.95fr_1.05fr] lg:gap-16 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e4da] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#32644b]">
              <span className="h-2 w-2 rounded-full bg-[#91ce4c]" /> Made for shared goals
            </span>
            <h1 className="mt-3.5 text-6xl lg:text-[4.35rem] font-semibold leading-[1.06] tracking-[-.06em] text-[#18352a]">
              Together, we can make it happen.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-7 text-[#52665b]">
              Bring your people together around a goal. See what Openhand makes easier.
            </p>
            <div className="mt-7 flex flex-row items-center gap-3">
              <Link
                href="/auth/signup?role=organizer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#99d452] px-6 text-sm font-semibold text-[#19352c] shadow-[0_8px_18px_rgba(125,175,65,.16)] transition hover:bg-[#8ac841] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6da72e]"
              >
                Start a group <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/bomas"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#dce2dc] bg-white px-6 text-sm font-semibold text-[#294638] transition hover:border-[#b8c8b9] hover:bg-[#fbfcfa] active:scale-[0.98]"
              >
                Explore goals
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#718076]">No account needed to explore public goals.</p>
          </div>

          <figure className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2.25rem] bg-[#d9e9dc]/75 blur-2xl" />
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem] border-[6px] border-white bg-[#e4eee5] shadow-[0_24px_70px_rgba(27,66,46,.18)]">
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
                <p className="max-w-xs text-2xl font-semibold leading-tight tracking-tight text-white">
                  A little from each of us. A lot for all of us.
                </p>
                <p className="shrink-0 text-[10px] text-white/80">Digital transfers</p>
              </figcaption>
            </div>
            <div className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-2xl border border-[#e4ece5] bg-white/95 backdrop-blur-xs px-4 py-3 shadow-md">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f3eb] text-[#176b4e]">
                <Icon name="record" className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-[#244333]">One clear group record</span>
            </div>
          </figure>
        </div>
      </section>

      {/* Audience Section (1-Column on Mobile, 3-Column on Desktop) */}
      <section aria-label="Who Openhand is for" className="border-y border-[#e7eee7] bg-gradient-to-b from-[#f7faf7] to-[#fbfdfb] py-3.5 sm:py-5">
        <div className="mx-auto grid grid-cols-1 gap-2.5 px-4 sm:max-w-7xl sm:grid-cols-3 sm:gap-3 sm:px-8 lg:px-12">
          {audiences.map((audience) => (
            <div
              key={audience.label}
              className="flex items-center gap-3 rounded-2xl border border-[#e1eae1] bg-white p-2.5 shadow-[0_2px_8px_rgba(18,50,30,0.04)] sm:rounded-2xl sm:border-[#e8ece7] sm:bg-[#fbfcfa] sm:p-3.5 sm:shadow-none transition-transform active:scale-[0.99]"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#eaf0e9] ring-2 ring-[#eaf2e9] sm:h-16 sm:w-16 sm:rounded-xl sm:ring-0">
                <Image src={audience.image} alt="" fill sizes="(max-width: 640px) 44px, 64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#1a382b] truncate sm:text-sm sm:font-semibold sm:text-[#294638]">{audience.label}</p>
                <p className="mt-0.5 text-[11px] font-normal text-[#667a6d] truncate sm:text-xs sm:text-[#78867c]">{audience.detail}</p>
              </div>
              <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4f7f4] text-[#809587] sm:hidden">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works: 3 Steps (1-Column on Mobile, 3-Column on Desktop) */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        {/* Mobile Section Header: Clear, concise without below details */}
        <h2 className="text-xl font-bold tracking-tight text-[#143226] sm:hidden">
          Simple by design
        </h2>

        {/* Desktop Section Header: Preserved 100% */}
        <div className="hidden sm:flex sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#4d8061]">Simple by design</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-.045em] text-[#19372b]">
              From idea to shared progress.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#718076]">
            Three clear steps. Your group stays in control.
          </p>
        </div>

        <div className="relative mt-4 grid grid-cols-1 gap-2.5 sm:mt-8 sm:grid-cols-3 sm:gap-0">
          <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-[#dce8de] sm:block" />
          {steps.map((step) => (
            <article
              key={step.number}
              className="relative flex items-center gap-3.5 rounded-2xl border border-[#e1eae1] bg-white p-3 shadow-[0_2px_10px_rgba(18,50,30,0.04)] sm:mx-2 sm:flex-col sm:items-start sm:gap-4 sm:rounded-2xl sm:border-0 sm:bg-transparent sm:p-4 sm:shadow-none active:bg-slate-50/70 transition-colors"
            >
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d6ebd5] bg-[#f2faf1] shadow-2xs sm:h-16 sm:w-16 sm:rounded-2xl sm:border-[#dce8de] sm:bg-white sm:shadow-sm p-1.5 sm:p-2.5">
                <Image src={step.icon} alt={step.title} width={48} height={48} className="h-full w-full object-contain" />
              </span>
              <div className="min-w-0 sm:pt-2">
                <span className="inline-block rounded-md bg-[#eef7ea] px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-[#2e6d3f] border border-[#d5edd2] sm:border-0 sm:bg-transparent sm:p-0 sm:text-[10px] sm:font-bold sm:tracking-[.14em] sm:text-[#729179]">
                  STEP {step.number}
                </span>
                <h3 className="mt-0.5 text-[13px] font-bold text-[#193628] sm:mt-1 sm:text-base sm:font-semibold sm:text-[#233d2f]">{step.title}</h3>
                <p className="mt-0.5 text-[11px] leading-snug text-[#63776a] sm:mt-1 sm:text-sm sm:leading-5 sm:text-[#718076]">{step.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust & Confidence Section (Hidden on Mobile, 3-Column on Desktop) */}
      <section id="trust" className="hidden sm:block bg-[#f3f6f1] py-20 border-t border-[#e8ece7]">
        <div className="mx-auto grid max-w-7xl gap-8 px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#4d8061]">Clarity builds confidence</p>
            <h2 className="mt-2 max-w-md text-4xl font-semibold leading-tight tracking-[-.045em] text-[#19372b]">
              Everyone can see how the group is doing.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#68796e]">
              A clear purpose. A shared record. Progress members can follow.
            </p>
            <Link
              href="/bomas"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#176b4e] hover:text-[#104d38]"
            >
              See how group goals work <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5 active:scale-[0.99] transition-transform">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f6e9] text-[#4c7628]">
                <Icon name="target" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#284535]">Clear purpose</h3>
              <p className="mt-1 text-xs leading-5 text-[#748278]">Know what the group is working toward.</p>
            </article>

            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5 active:scale-[0.99] transition-transform">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f6e9] text-[#4c7628]">
                <Icon name="record" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#284535]">Shared record</h3>
              <p className="mt-1 text-xs leading-5 text-[#748278]">Keep contributions together in one place.</p>
            </article>

            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5 active:scale-[0.99] transition-transform">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f6e9] text-[#4c7628]">
                <Icon name="lock" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#284535]">Your choice to share</h3>
              <p className="mt-1 text-xs leading-5 text-[#748278]">Groups stay private until organizers publish them.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Testimonials (Hidden on Mobile to keep view clean, Grid on Desktop) */}
      <section aria-labelledby="testimonials-heading" className="hidden sm:block mx-auto max-w-6xl px-8 py-20 lg:px-12 lg:py-24">
        <div className="mb-8 flex flex-row items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#58804d]">Sample testimonials</p>
            <h2 id="testimonials-heading" className="mt-2 text-3xl font-semibold tracking-[-.04em] text-[#19372b]">
              Good things grow when we do them together.
            </h2>
          </div>
          <span className="w-fit rounded-full border border-[#dce8d6] bg-white px-3 py-1 text-[10px] font-semibold text-[#6b7d6b]">
            Illustrative copy
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.group}
              className="flex min-h-48 flex-col rounded-2xl border border-[#e3ebe4] bg-white p-6 shadow-[0_8px_24px_rgba(27,66,46,.045)] transition-transform active:scale-[0.99]"
            >
              <span aria-hidden="true" className="text-3xl font-bold leading-none text-[#84bd42]">“</span>
              <blockquote className="mt-2 flex-1 text-sm leading-6 text-[#405347]">
                {testimonial.quote}
              </blockquote>
              <div className="mt-5 flex items-center gap-2 border-t border-[#edf1ec] pt-4">
                <span className="h-2 w-2 rounded-full bg-[#99d452]" aria-hidden="true" />
                <span className="text-xs font-semibold text-[#294638]">{testimonial.group}</span>
                <span className="ml-auto text-[9px] font-medium uppercase tracking-[.12em] text-[#89958a]">Sample</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Glance: Across Africa (Hidden on Mobile, 3-Column on Desktop) */}
      <section aria-label="Openhand at a glance" className="hidden sm:block bg-[#f3f5f1] px-8 py-12 lg:px-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: 'place', title: 'Across Africa', detail: 'Shared goals for groups wherever they are.' },
            { icon: 'people', title: 'Made for groups', detail: 'Families, chamas, welfare groups, and communities.' },
            { icon: 'target', title: 'One shared goal', detail: 'Keep the purpose and progress clear to everyone.' },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.4rem] bg-white p-2 shadow-[0_8px_28px_rgba(27,66,46,.055)]"
            >
              <div className="flex min-h-52 flex-col items-center justify-center rounded-[1rem] border border-dashed border-[#d9e4d6] px-5 py-6 text-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[#19352c]">
                  <Icon name={item.icon} className="h-8 w-8" />
                </span>
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-[#17251f]">{item.title}</h2>
                <p className="mt-1 max-w-[15rem] text-sm leading-5 text-[#66756b]">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e7ece8] bg-white pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center text-[11px] text-[#78867c] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left sm:text-xs lg:px-12">
          <span>&copy; {new Date().getFullYear()} Openhand · Group contributions, made clear.</span>
          <div className="flex justify-center gap-4 sm:justify-start sm:gap-5">
            <Link href="/bomas" className="hover:text-[#176b4e] transition-colors">Explore goals</Link>
            <Link href="/auth/login" className="hover:text-[#176b4e] transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
