import Image from 'next/image';
import Link from 'next/link';

const goalExamples = [
  {
    name: 'Family support',
    description: 'Show up for one another through life’s big moments.',
    image: '/assets/images/funds/family/family_1080w_web.webp',
    alt: 'Family members sharing a moment together',
  },
  {
    name: 'Education',
    description: 'Bring a class, school, or community learning goal within reach.',
    image: '/assets/images/funds/education/pexels-valerie-sutton-34163824-14935332.webp',
    alt: 'Students learning together',
  },
  {
    name: 'Medical care',
    description: 'Gather support for care, recovery, and wellbeing.',
    image: '/assets/images/funds/medical/medical_1080w_web.webp',
    alt: 'People supporting a health and wellbeing goal',
  },
  {
    name: 'Community projects',
    description: 'Turn a shared local idea into something everyone can see.',
    image: '/assets/images/funds/community/pexels-droneafrica-12431091.webp',
    alt: 'People joining hands around a shared goal',
  },
  {
    name: 'Chama savings',
    description: 'Keep a group savings goal and its progress in one place.',
    image: '/assets/images/funds/community/pexels-pixabay-53958.webp',
    alt: 'People working together on a common goal',
  },
  {
    name: 'Food and essentials',
    description: 'Coordinate practical support for people in your community.',
    image: '/assets/images/funds/community/rural/pexels-oladele-olaniyi-541492341-16658745.webp',
    alt: 'A rural community landscape',
  },
  {
    name: 'Housing',
    description: 'Bring people together to improve or build a place to call home.',
    image: '/assets/images/africa/landscapes/pexels-isaac-naph-567522839-20730310.webp',
    alt: 'A landscape in Africa',
  },
  {
    name: 'Group events',
    description: 'Plan a gathering and make the shared costs easy to follow.',
    image: '/assets/images/events/pexels-rdne-7551733.webp',
    alt: 'A group taking part in an event together',
  },
] as const;

export default function ExploreBomasPage() {
  return (
    <div className="min-h-full bg-[#f7f8f5] text-[#18352a]">
      <section className="border-b border-[#e6ebe5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#58804d]">Shared goals, made clear</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">What could your group do together?</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65736a] sm:text-base">Choose a goal, bring your people together, and follow the progress in one place.</p>
            </div>
            <Link href="/auth/signup?role=organizer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#99d452] px-5 text-sm font-semibold text-[#19352c] transition hover:bg-[#8ac841] sm:self-auto">
              Start a group <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Group goal ideas" className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {goalExamples.map((goal) => (
            <article key={goal.name} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e4e9e2] bg-white shadow-[0_5px_22px_rgba(28,56,38,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(28,56,38,.09)]">
              <div className="relative aspect-[1.55] overflow-hidden bg-[#e9eee7]">
                <Image src={goal.image} alt={goal.alt} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h2 className="text-base font-semibold tracking-tight text-[#20392d]">{goal.name}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-5 text-[#718076]">{goal.description}</p>
                <Link
                  href="/auth/signup?role=organizer"
                  className="mt-4 inline-flex min-h-9 self-start items-center justify-center gap-1.5 rounded-full bg-[#99d452] px-3.5 text-xs font-semibold text-[#19352c] transition hover:bg-[#8ac841] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6da72e]"
                >
                  Start this goal <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
