import Link from 'next/link';

const principles = [
  { number: '01', title: 'Start with a shared goal', text: 'Create a fund for your chama, family, school, welfare group or community project.' },
  { number: '02', title: 'Invite people to take part', text: 'Share one simple link. Members can see the purpose, the target and the latest progress.' },
  { number: '03', title: 'Every contribution is visible', text: 'Members can follow contributions in a clear group record, so everyone stays informed.' },
];

const benefits = [
  { icon: '↗', title: 'A shared place to give', text: 'Bring your group together around a goal everyone understands.' },
  { icon: '◎', title: 'A record everyone can follow', text: 'See contributions and fund progress in one easy-to-read place.' },
  { icon: '⌁', title: 'M-Pesa made straightforward', text: 'Contributors approve a payment prompt on their phone. BomaPay keeps 2.5%; the rest settles to the organizer’s verified Till or Paybill.' },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden bg-[#fbfcfa] text-[#15251f]">
      <section className="relative border-b border-[#e6ede8] bg-[#f3f7f2]">
        <div className="pointer-events-none absolute -right-28 -top-28 h-[34rem] w-[34rem] rounded-full bg-[#d9eee4] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:min-h-[610px] lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:px-12 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d5e4da] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#32644b]">
              <span className="h-2 w-2 rounded-full bg-[#17815e]" />
              A clearer way to contribute together
            </div>
            <h1 className="mt-6 max-w-[12ch] text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#18352a] sm:text-6xl lg:text-[4.25rem]">
              Big goals feel closer when we move together.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#52665b] sm:text-lg sm:leading-8">
              Boma helps families, chamas and communities collect toward a shared goal, keep a clear record, and see the difference every contribution makes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/auth/signup?role=organizer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#176b4e] px-6 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(23,107,78,.16)] transition hover:bg-[#12583f]">
                Start a group fund <span aria-hidden="true">→</span>
              </Link>
              <Link href="/bomas" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cfdcd2] bg-white/80 px-6 text-sm font-semibold text-[#294638] transition hover:bg-white">
                Explore active goals
              </Link>
            </div>
            <p className="mt-3 text-xs text-[#718076]">Organizer requests are reviewed before fund creation. You can explore and contribute without an account.</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#63766a]">
              <span className="inline-flex items-center gap-2"><span className="text-[#176b4e]">✓</span> Clear group records</span>
              <span className="inline-flex items-center gap-2"><span className="text-[#176b4e]">✓</span> M-Pesa payment prompts</span>
              <span className="inline-flex items-center gap-2"><span className="text-[#176b4e]">✓</span> Made for shared goals</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
            <div className="absolute -inset-5 rounded-[2.25rem] bg-[#d9e9dc]/70 blur-2xl" />
            <div className="relative rounded-[1.75rem] border border-white bg-white p-3 shadow-[0_24px_70px_rgba(27,66,46,.14)] sm:p-4">
              <div className="overflow-hidden rounded-[1.25rem] bg-[#f8faf7]">
                <div className="flex items-center justify-between border-b border-[#e8eee9] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176b4e] text-sm font-bold text-white">B</span>
                    <div><p className="text-sm font-semibold text-[#18352a]">Example school fund</p><p className="mt-0.5 text-[11px] text-[#75847a]">Education · Shared goal</p></div>
                  </div>
                  <span className="rounded-full bg-[#e4f2e9] px-2.5 py-1 text-[10px] font-semibold text-[#286044]">Active</span>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium text-[#738178]">Sample fund preview · Raised together</p>
                  <div className="mt-1 flex items-baseline gap-2"><p className="text-3xl font-semibold tracking-tight text-[#18352a] sm:text-4xl">KES 184,500</p><span className="text-xs text-[#718076]">of 250,000</span></div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e6ece7]"><div className="h-full w-[74%] rounded-full bg-[#19815a]" /></div>
                  <div className="mt-2 flex justify-between text-[11px] text-[#78867c]"><span>74% of the goal</span><span>32 contributors</span></div>
                  <div className="mt-6 rounded-xl border border-[#e5ece6] bg-white p-4">
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#243d30]">Recent contributions</p><span className="text-[10px] text-[#87938a]">View all</span></div>
                    <div className="mt-4 space-y-3">
                      {[
                        ['JM', 'Jane M.', 'KES 2,000', 'Today'],
                        ['AO', 'A. Otieno', 'KES 1,000', 'Today'],
                        ['MK', 'Member contribution', 'KES 500', 'Yesterday'],
                      ].map(([initials, name, amount, date]) => <div key={`${name}-${date}`} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f1e9] text-[10px] font-semibold text-[#3e7252]">{initials}</span><span className="min-w-0 flex-1 text-xs font-medium text-[#405347]">{name}</span><span className="text-right"><span className="block text-xs font-semibold text-[#233b2e]">{amount}</span><span className="text-[10px] text-[#94a097]">{date}</span></span></div>)}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#176b4e] py-3 text-xs font-semibold text-white"><span>Contribute with M-Pesa</span><span aria-hidden="true">→</span></div>
                  <p className="mt-3 text-center text-[10px] leading-4 text-[#819087]">The organizer’s verified Till or Paybill receives the group’s share. Contributions are recorded for members to follow.</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-[#e4ece5] bg-white px-4 py-3 shadow-lg sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f3eb] text-lg text-[#176b4e]">✓</span><span><span className="block text-xs font-semibold text-[#244333]">Every shilling has a record</span><span className="mt-0.5 block text-[10px] text-[#7c8a80]">Progress your group can see</span></span></div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e9eeea] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-5 py-6 sm:grid-cols-4 sm:px-8 lg:px-12">
          {[["For chamas", "Save and plan as a group"], ["For families", "Show up for one another"], ["For communities", "Move local projects forward"], ["For every member", "Know how the goal is progressing"]].map(([title, text]) => <div key={title} className="py-1"><p className="text-sm font-semibold text-[#294638]">{title}</p><p className="mt-1 text-xs leading-5 text-[#78867c]">{text}</p></div>)}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#4d8061]">Simple from the first step</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#19372b] sm:text-4xl">One shared goal. A clearer way to get there.</h2><p className="mt-4 text-sm leading-7 text-[#68796e] sm:text-base">Start with what your group wants to do. Boma gives everyone one place to take part and follow the progress.</p></div>
        <div className="mt-9 grid gap-4 md:grid-cols-3 md:gap-5">{principles.map((step) => <article key={step.number} className="rounded-2xl border border-[#e4ebe5] bg-white p-6 sm:p-7"><span className="text-xs font-semibold tracking-[.14em] text-[#6f9478]">STEP {step.number}</span><h3 className="mt-5 text-lg font-semibold text-[#233d2f]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#718076]">{step.text}</p></article>)}</div>
      </section>

      <section id="trust" className="bg-[#f1f6f1]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-12 lg:py-24">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#4d8061]">Built around trust</p><h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-[-.04em] text-[#19372b] sm:text-4xl">People give with confidence when they can see the plan.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#68796e] sm:text-base">A clear purpose and a visible contribution record help every member understand where the group is, and what comes next.</p><Link href="/bomas" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#176b4e] hover:text-[#104d38]">See active group goals <span aria-hidden="true">→</span></Link></div>
          <div className="grid gap-3 sm:grid-cols-3">{benefits.map((benefit) => <article key={benefit.title} className="rounded-2xl border border-[#dfe9e0] bg-white p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4ec] text-xl text-[#28704d]">{benefit.icon}</span><h3 className="mt-4 text-sm font-semibold text-[#284535]">{benefit.title}</h3><p className="mt-2 text-xs leading-5 text-[#748278]">{benefit.text}</p></article>)}</div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] bg-[#164f3b] px-6 py-10 text-center text-white sm:px-12 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#b9d9c4]">Good things grow together</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Bring your people together around a goal.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#d1e3d6]">Create a group fund, share it with members, and make every step easier to follow.</p><Link href="/auth/signup?role=organizer" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#174f39] transition hover:bg-[#eef5ef]">Create your group fund <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <footer className="border-t border-[#e7ece8] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-[#78867c] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>© {new Date().getFullYear()} BomaPay · Clear contributions, together.</span><div className="flex gap-5"><Link href="/bomas" className="hover:text-[#176b4e]">Explore goals</Link><Link href="/auth/login" className="hover:text-[#176b4e]">Sign in</Link></div></div></footer>
    </div>
  );
}
