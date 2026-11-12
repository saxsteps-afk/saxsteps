import Image from "next/image";
import Link from "next/link";
import curriculum from "@/data/curriculum.json";
import { PLAYER_PATH, site } from "@/lib/site";

const WEEKS = [
  { name: "Week 1", focus: "First sounds", days: [1, 7] },
  { name: "Week 2", focus: "The octave key", days: [8, 14] },
  { name: "Week 3", focus: "Rhythm and range", days: [15, 21] },
  { name: "Week 4", focus: "Style and expression", days: [22, 28] },
  { name: "Recital", focus: "Your first performance", days: [29, 30] },
] as const;

const STEPS = [
  {
    title: "Read the lesson",
    text: "Each day starts with a short lesson: the new note, how to finger it, and what to listen for.",
  },
  {
    title: "Play along",
    text: "Your phone or laptop listens through its microphone. The fingering chart shows every key to press.",
  },
  {
    title: "The music waits",
    text: "Play the right note and the band plays on. Miss it, and the music waits for you — no rushing, no getting lost.",
  },
] as const;

const INCLUDED = [
  "30 daily lessons, 20–30 minutes each",
  "60+ play-along pieces with piano and drums",
  "Slow and standard tempo for every piece",
  "A tuner and fingering chart on screen",
  "Stars and progress saved to your account",
  "Works on phone, tablet and computer",
  "Alto, tenor, soprano or baritone sax",
  "Lifetime access",
];

const FAQ = [
  [
    "I have never played an instrument. Is this for me?",
    "Yes. Day 1 starts with how to hold the sax and make your first sound. You learn to read the notes you need as you go, one or two at a time.",
  ],
  [
    "Which saxophone do I need?",
    "Any: alto, tenor, soprano or baritone. Saxophone music is written the same way for all of them, and the app works out the real pitch of your instrument. Most beginners start on alto.",
  ],
  [
    "What else do I need?",
    "A phone, tablet or computer with a microphone and an up-to-date browser (Chrome, Edge, Safari or Firefox), plus 20–30 minutes a day. Headphones help: then the app hears only your sax, not the backing track.",
  ],
  [
    "What if I need more than 30 days?",
    "Take as long as you like. Access never expires, and you can repeat any day, at slow or standard tempo, as often as you want.",
  ],
  [
    "Can I try it first?",
    `Yes — days ${site.freeDays.join(", ")} are free, no payment needed.`,
  ],
  [
    "What songs will I play?",
    "Well-loved melodies in the public domain: Ode to Joy, Amazing Grace, When the Saints Go Marching In, Greensleeves, Danny Boy, Shenandoah and many more — plus short tunes written for each new note.",
  ],
  [
    "What if it's not for me?",
    `Email us within ${site.refundDays} days of your purchase and we'll refund you in full. No questions asked.`,
  ],
] as const;

const SONGS = curriculum.filter((d) => d.day > 3 && !/medley|recital|review/i.test(d.song)).length;

export default function Home() {
  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brass">Saxophone for beginners</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              Learn sax in 30 days.
              <span className="block text-brass">The music waits for you.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-dark">
              One short lesson a day, from your very first note to a three-song recital. The app listens to your sax as you play
              along — hit the right note and the band plays on.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={PLAYER_PATH} className="rounded-full bg-brass px-6 py-3.5 font-bold text-ink hover:bg-brass-soft">
                Try Day 1 free
              </a>
              <Link href="#pricing" className="rounded-full border border-white/20 px-6 py-3.5 font-semibold hover:border-brass hover:text-brass">
                Get the full course · {site.price.label}
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-dark">No download. Works in your browser on phone, tablet or computer.</p>
          </div>
          <div className="relative mx-auto w-full max-w-[320px]">
            <div className="absolute -inset-10 rounded-full bg-brass/15 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.2rem] border-[6px] border-ink-3 shadow-2xl">
              <Image
                src="/screens/practice.png"
                alt="The SaxSteps practice screen: the music, the fingering chart and a tuner"
                width={390}
                height={844}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Practice that listens to you</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Playing along with a recording is hard when you&apos;re new: it never slows down. SaxSteps follows you instead.
        </p>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-3xl border border-line bg-white/60 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-bold text-brass">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 grid items-center gap-10 rounded-3xl bg-ink-2 p-6 text-cream sm:p-10 md:grid-cols-[0.8fr_1.2fr]">
          <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.8rem] border-[5px] border-ink-3">
            <Image src="/screens/day.png" alt="A day in the course: lesson text, note practice and a song" width={390} height={844} className="h-auto w-full" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold">Every day: one new skill, one song</h3>
            <p className="mt-3 text-muted-dark">
              Each day pairs a short note exercise with a real song that uses exactly what you just learned. Start slow, earn your
              stars, then try the standard tempo.
            </p>
            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              {["A short written lesson every day", "Slow → standard tempo", "Stars show how smoothly you played", "Pick up where you left off on any device"].map(
                (t) => (
                  <li key={t} className="flex gap-2">
                    <Check /> {t}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* curriculum */}
      <section id="curriculum" className="bg-cream-2/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your 30 days</h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            From one note to the full range from low C to high G, with {SONGS}+ songs along the way.
          </p>
          <div className="mt-10 space-y-8">
            {WEEKS.map((w) => (
              <div key={w.name}>
                <h3 className="flex items-baseline gap-3 text-lg font-bold">
                  {w.name}
                  <span className="text-sm font-medium text-muted">{w.focus}</span>
                </h3>
                <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {curriculum
                    .filter((d) => d.day >= w.days[0] && d.day <= w.days[1])
                    .map((d) => (
                      <li key={d.day} className="rounded-2xl border border-line bg-cream p-4">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                          <span className="text-brass-deep">Day {d.day}</span>
                          {site.freeDays.includes(d.day as 1 | 2 | 3) && (
                            <span className="rounded-full bg-brass/25 px-2 py-0.5 text-ink">Free</span>
                          )}
                        </div>
                        <p className="mt-1 font-bold">{d.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          ♪ {d.song}
                          {d.bonus.length > 0 && ` · bonus: ${d.bonus.join(", ")}`}
                        </p>
                      </li>
                    ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-ink text-cream shadow-xl md:grid md:grid-cols-[1fr_1.1fr]">
          <div className="p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brass">Full course</p>
            <p className="mt-4 text-6xl font-extrabold">{site.price.label}</p>
            <p className="mt-2 text-muted-dark">{site.price.note}</p>
            <a href="/buy" className="mt-8 block rounded-full bg-brass px-6 py-3.5 text-center font-bold text-ink hover:bg-brass-soft">
              Get SaxSteps
            </a>
            <a href={PLAYER_PATH} className="mt-3 block text-center text-sm text-muted-dark hover:text-cream">
              or try days {site.freeDays[0]}–{site.freeDays[site.freeDays.length - 1]} free
            </a>
            <p className="mt-6 text-xs text-muted-dark">{site.refundDays}-day money-back guarantee. Secure checkout.</p>
          </div>
          <ul className="space-y-3 bg-ink-2 p-8 text-sm sm:p-10">
            {INCLUDED.map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-white/60">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                {q}
                <span className="text-xl text-brass-deep transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Another question?{" "}
          <a href={`mailto:${site.email}`} className="font-semibold text-brass-deep underline">
            {site.email}
          </a>
        </p>
      </section>
    </>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="mt-0.5 shrink-0 text-brass" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
