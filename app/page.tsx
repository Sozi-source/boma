import Image from 'next/image';
import Link from 'next/link';

const audiences = [
  { label: 'Chamas', detail: 'Plan together', image: '/assets/images/funds/community/pexels-pixabay-53958.webp' },
  { label: 'Families', detail: 'Show up for each other', image: '/assets/images/funds/family/family_1080w_web.webp' },
  { label: 'Community groups', detail: 'Make local goals happen', image: '/assets/images/funds/community/community_1080w_web.webp' },
] as const;

const steps = [
  { number: '01', title: 'Set a goal', detail: 'Give your group a clear purpose.', icon: 'target' },
  { number: '02', title: 'Bring people in', detail: 'Share the goal with your members.', icon: 'people' },
  { number: '03', title: 'Follow progress', detail: 'Keep contributions in one record.', icon: 'record' },
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
      <section className="relative border-b border-[#e8ece7] bg-[#f5f6f4]">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:min-h-[620px] lg:grid-cols-[.95fr_1.05fr] lg:gap-16 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d5e4da] bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#32644b]">
              <span className="h-2 w-2 rounded-full bg-[#91ce4c]" /> Made for shared goals
            </span>
            <h1 className="mt-5 max-w-[11ch] text-[2.8rem] font-semibold leading-[1.02] tracking-[-.06em] text-[#18352a] sm:text-6xl lg:text-[4.35rem]">
              Together, we can make it happen.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#52665b] sm:text-lg">
              Bring your people together around a goal. See what Openhand makes easier.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/auth/signup?role=organizer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#99d452] px-6 text-sm font-semibold text-[#19352c] shadow-[0_8px_18px_rgba(125,175,65,.16)] transition hover:bg-[#8ac841] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6da72e]">
                Start a group <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link href="/bomas" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#dce2dc] bg-white px-6 text-sm font-semibold text-[#294638] transition hover:border-[#b8c8b9] hover:bg-[#fbfcfa]">
                Explore goals
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#718076]">No account needed to explore public goals.</p>
          </div>

          <figure className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2.25rem] bg-[#d9e9dc]/75 blur-2xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border-[6px] border-white bg-[#e4eee5] shadow-[0_24px_70px_rgba(27,66,46,.18)] sm:aspect-[5/4]">
              <Image src="/assets/images/funds/community/pexels-droneafrica-12431091.webp" alt="A diverse group of people joining hands in a circle" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#102b20]/75 via-transparent to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                <p className="max-w-xs text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">A little from each of us. A lot for all of us.</p>
                <p className="shrink-0 text-[10px] text-white/80">Photo: Drone Africa / Pexels</p>
              </figcaption>
            </div>
            <div className="absolute -bottom-4 -left-3 hidden items-center gap-2.5 rounded-2xl border border-[#e4ece5] bg-white px-4 py-3 shadow-lg sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f3eb] text-[#176b4e]"><Icon name="record" className="h-5 w-5" /></span>
              <span className="text-xs font-semibold text-[#244333]">One clear group record</span>
            </div>
          </figure>
        </div>
      </section>

      <section aria-label="Who Openhand is for" className="border-y border-[#e9eeea] bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-5 sm:grid-cols-3 sm:px-8 lg:px-12">
          {audiences.map((audience) => (
            <div key={audience.label} className="flex items-center gap-3 rounded-2xl border border-[#e8ece7] bg-[#fbfcfa] p-3 sm:p-3.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#eaf0e9] sm:h-16 sm:w-16"><Image src={audience.image} alt="" fill sizes="64px" className="object-cover" /></div>
              <div><p className="text-sm font-semibold text-[#294638]">{audience.label}</p><p className="mt-0.5 text-xs text-[#78867c]">{audience.detail}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#4d8061]">Simple by design</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#19372b] sm:text-4xl">From idea to shared progress.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-[#718076]">Three clear steps. Your group stays in control.</p>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-3 sm:gap-0">
          <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-[#dce8de] sm:block" />
          {steps.map((step) => (
            <article key={step.number} className="relative flex items-start gap-4 rounded-2xl border border-[#e6ede7] bg-white p-5 sm:mx-2 sm:flex-col sm:border-0 sm:bg-transparent sm:p-4">
              <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#dce8de] bg-white text-[#176b4e] shadow-sm"><Icon name={step.icon} className="h-7 w-7" /></span>
              <div className="pt-1 sm:pt-2"><p className="text-[10px] font-bold tracking-[.14em] text-[#729179]">STEP {step.number}</p><h3 className="mt-1 text-base font-semibold text-[#233d2f]">{step.title}</h3><p className="mt-1 text-sm leading-5 text-[#718076]">{step.detail}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="trust" className="bg-[#f4f6f1]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-12 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#4d8061]">Clarity builds confidence</p>
            <h2 className="mt-2 max-w-md text-3xl font-semibold leading-tight tracking-[-.045em] text-[#19372b] sm:text-4xl">Everyone can see how the group is doing.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#68796e]">A clear purpose. A shared record. Progress members can follow.</p>
            <Link href="/bomas" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#176b4e] hover:text-[#104d38]">See how group goals work <span aria-hidden="true">&rarr;</span></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f6e9] text-[#4c7628]"><Icon name="target" /></span><h3 className="mt-4 text-sm font-semibold text-[#284535]">Clear purpose</h3><p className="mt-1 text-xs leading-5 text-[#748278]">Know what the group is working toward.</p></article>
            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f6e9] text-[#4c7628]"><Icon name="record" /></span><h3 className="mt-4 text-sm font-semibold text-[#284535]">Shared record</h3><p className="mt-1 text-xs leading-5 text-[#748278]">Keep contributions together in one place.</p></article>
            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f6e9] text-[#4c7628]"><Icon name="lock" /></span><h3 className="mt-4 text-sm font-semibold text-[#284535]">Your choice to share</h3><p className="mt-1 text-xs leading-5 text-[#748278]">Groups stay private until organizers publish them.</p></article>
          </div>
        </div>
      </section>

      <section aria-labelledby="testimonials-heading" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#58804d]">Sample testimonials</p>
            <h2 id="testimonials-heading" className="mt-2 text-2xl font-semibold tracking-[-.04em] text-[#19372b] sm:text-3xl">Good things grow when we do them together.</h2>
          </div>
          <span className="w-fit rounded-full border border-[#dce8d6] bg-white px-3 py-1 text-[10px] font-semibold text-[#6b7d6b]">Illustrative copy</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {testimonials.map((testimonial) => (
            <article key={testimonial.group} className="flex min-h-48 flex-col rounded-2xl border border-[#e3ebe4] bg-white p-5 shadow-[0_8px_24px_rgba(27,66,46,.045)] sm:p-6">
              <span aria-hidden="true" className="text-3xl font-semibold leading-none text-[#84bd42]">“</span>
              <blockquote className="mt-2 flex-1 text-sm leading-6 text-[#405347]">{testimonial.quote}</blockquote>
              <div className="mt-5 flex items-center gap-2 border-t border-[#edf1ec] pt-4">
                <span className="h-2 w-2 rounded-full bg-[#99d452]" aria-hidden="true" />
                <span className="text-xs font-semibold text-[#294638]">{testimonial.group}</span>
                <span className="ml-auto text-[9px] font-medium uppercase tracking-[.12em] text-[#89958a]">Sample</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Openhand at a glance" className="bg-[#f3f5f1] px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: 'place', title: 'Across Africa', detail: 'Shared goals for groups wherever they are.' },
            { icon: 'people', title: 'Made for groups', detail: 'Families, chamas, welfare groups, and communities.' },
            { icon: 'target', title: 'One shared goal', detail: 'Keep the purpose and progress clear to everyone.' },
          ].map((item) => (
            <article key={item.title} className="rounded-[1.4rem] bg-white p-2 shadow-[0_8px_28px_rgba(27,66,46,.055)]">
              <div className="flex min-h-48 flex-col items-center justify-center rounded-[1rem] border border-dashed border-[#d9e4d6] px-5 py-6 text-center sm:min-h-52">
                <span className="flex h-10 w-10 items-center justify-center text-[#19352c]"><Icon name={item.icon} className="h-8 w-8" /></span>
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-[#17251f]">{item.title}</h2>
                <p className="mt-1.5 max-w-[15rem] text-sm leading-5 text-[#66756b]">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#e7ece8] bg-white"><div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-6 text-center text-xs text-[#78867c] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left lg:px-12"><span>&copy; {new Date().getFullYear()} Openhand · Group contributions, made clear.</span><div className="flex justify-center gap-5 sm:justify-start"><Link href="/bomas" className="hover:text-[#176b4e]">Explore goals</Link><Link href="/auth/login" className="hover:text-[#176b4e]">Sign in</Link></div></div></footer>
    </div>
  );
}
