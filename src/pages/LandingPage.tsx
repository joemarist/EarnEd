import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarCheck2,
  Check,
  ChevronDown,
  CircleDollarSign,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Brand } from "../components/Brand";
import { Button, Card } from "../components/ui";

const features = [
  {
    icon: CalendarCheck2,
    title: "Log in seconds",
    text: "Record classes by workplace and let date-aware rates calculate your earnings.",
  },
  {
    icon: WalletCards,
    title: "Know what you're owed",
    text: "Match expected income against payments and carry shortfalls forward automatically.",
  },
  {
    icon: Target,
    title: "Teach toward a goal",
    text: "See exactly how much—and how many classes—you need each day to stay on track.",
  },
  {
    icon: BarChart3,
    title: "Spot your trends",
    text: "Compare workplaces, understand monthly patterns, and export clean reports.",
  },
  {
    icon: BellRing,
    title: "Stay on top of pay cycles",
    text: "Track each workplace's pay schedule and compare what you earned with what you received.",
  },
  {
    icon: ShieldCheck,
    title: "Built for privacy",
    text: "Designed for secure, user-owned data with row-level access controls.",
  },
];

const faqs = [
  [
    "Can I track more than one school?",
    "Yes. Add as many workplaces as you need, each with its own rate history, currency and pay schedule.",
  ],
  [
    "What happens when my rate changes?",
    "Add a new effective date. EarnEd applies the right historical rate to every class automatically.",
  ],
  [
    "Can I import my spreadsheet?",
    "Spreadsheet import is not available yet. You can enter classes in Daily Log and export your records from Reports or Settings & Account.",
  ],
  [
    "Does EarnEd handle taxes?",
    "EarnEd organizes income records and exports, but it does not replace advice from a qualified tax professional.",
  ],
];

export function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen overflow-hidden bg-canvas text-ink">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <a href="#how" className="hover:text-ink">
              How it works
            </a>
            <a href="#about" className="hover:text-ink">
              About
            </a>
            <a href="#faq" className="hover:text-ink">
              FAQ
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button>
                Start tracking <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <Button
            variant="ghost"
            className="h-10 w-10 px-0 md:hidden"
            onClick={() => setMobileNav(!mobileNav)}
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
        {mobileNav && (
          <div className="border-t border-line bg-surface p-4 md:hidden">
            <nav className="grid gap-1">
              {["features", "how", "about", "faq"].map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  onClick={() => setMobileNav(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold capitalize hover:bg-soft"
                >
                  {item === "how" ? "How it works" : item}
                </a>
              ))}
              <Link to="/login" className="mt-2">
                <Button className="w-full">Sign in to EarnEd</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative pt-30 sm:pt-36">
          <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-18 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:pb-24">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-dark dark:text-brand">
                <Sparkles size={14} /> Made for independent ESL tutors
              </div>
              <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
                Teach more.
                <br />
                Wonder{" "}
                <span className="relative text-brand-dark dark:text-brand">
                  less.
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 220 12"
                    fill="none"
                  >
                    <path
                      d="M3 9C65 2 136 2 217 5"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity=".3"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
                EarnEd turns your classes, rates, and pay schedules into one clear picture—so you
                always know what you earned, received, and are still owed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login">
                  <Button className="w-full px-6 sm:w-auto">
                    Start tracking for free <ArrowRight size={17} />
                  </Button>
                </Link>
                <Link to="/app">
                  <Button variant="secondary" className="w-full px-6 sm:w-auto">
                    Open your workspace
                  </Button>
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {["No credit card", "Unlimited workplaces", "Built for mobile"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check size={15} className="text-brand" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div className="absolute -left-7 -top-7 h-24 w-24 rounded-3xl bg-amber-200/50 blur-xl" />
              <div className="relative rounded-[2rem] border border-line bg-surface p-3 shadow-[0_35px_90px_-25px_rgba(36,61,48,.3)] sm:p-5">
                <div className="rounded-2xl bg-canvas p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted">Illustrative dashboard preview · sample data</p>
                      <h2 className="mt-1 text-xl font-bold">Your May overview</h2>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                      <CircleDollarSign size={21} />
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-line bg-surface p-4">
                      <p className="text-xs text-muted">Total earned</p>
                      <p className="mt-1 text-2xl font-bold">$2,650</p>
                      <p className="mt-1 text-xs font-semibold text-brand-dark">
                        ↑ 12.4% this month
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-4">
                      <p className="text-xs text-muted">Still owed</p>
                      <p className="mt-1 text-2xl font-bold">$470</p>
                      <p className="mt-1 text-xs font-semibold text-amber-600">2 open payments</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-line bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Monthly progress</p>
                      <p className="text-xs text-muted">$2,650 / $3,200</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
                      <div className="h-full w-[82%] rounded-full bg-brand" />
                    </div>
                    <div className="mt-5 flex h-28 items-end gap-2">
                      {[38, 54, 47, 70, 62, 84, 74, 96, 78, 90].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-md bg-brand/20"
                          style={{ height: `${height}%` }}
                        >
                          <div className="h-2 rounded-full bg-brand" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-7 -left-4 rounded-2xl border border-line bg-surface p-3 shadow-xl sm:-left-12">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Next payday
                </p>
                <p className="mt-1 text-sm font-bold">LingoStar · Friday</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-surface py-7">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-muted">
              One calm place for
            </p>
            {["Cambly", "Preply", "NativeCamp", "Private students"].map((name) => (
              <p key={name} className="font-display text-base font-bold text-muted/70">
                {name}
              </p>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-22 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">Everything in one view</p>
            <h2 className="section-title">Your income, finally organized.</h2>
            <p className="section-copy">
              Stop rebuilding spreadsheets every payday. EarnEd is shaped around the way online
              tutors actually work.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }, index) => (
              <Card
                key={title}
                className={`group p-6 transition hover:-translate-y-1 hover:shadow-lg ${index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how" className="bg-deep py-22 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="section-kicker text-brand">Simple by design</p>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
                From first class to payday
                <br />
                in three easy steps.
              </h2>
            </div>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {[
                [
                  "01",
                  "Add your workplaces",
                  "Set each school’s rate, currency and pay schedule once.",
                ],
                [
                  "02",
                  "Log your classes",
                  "Quick-add classes in seconds. EarnEd applies the right rate.",
                ],
                [
                  "03",
                  "Reconcile payday",
                  "Record what arrived and see any shortfall carried forward.",
                ],
              ].map(([number, title, text], index) => (
                <div key={number} className="relative">
                  {index < 2 && (
                    <div className="absolute left-14 top-6 hidden h-px w-[calc(100%-2rem)] bg-white/15 md:block" />
                  )}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-brand/40 bg-brand/15 text-sm font-bold text-brand">
                    {number}
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-22 sm:px-6 sm:py-28 lg:grid-cols-[.8fr_1.2fr]"
        >
          <div className="relative mx-auto max-w-md">
            <div className="absolute -inset-4 -rotate-3 rounded-[2rem] bg-brand-soft" />
            <img
              src="/developer-placeholder.png"
              alt="Illustration representing the EarnEd workspace"
              className="relative aspect-[4/5] w-full rounded-[1.75rem] object-cover object-top shadow-xl"
            />
            <div className="absolute -bottom-5 -right-4 rounded-2xl bg-surface p-4 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">
                Built with tutors
              </p>
              <p className="mt-1 text-sm font-semibold">Not just for them</p>
            </div>
          </div>
          <div>
            <p className="section-kicker">Made for independent tutors</p>
            <h2 className="section-title text-left">
              A clearer view of the work behind every paycheck.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted">
              EarnEd brings your workplaces, class records, pay schedules, and income reports together in one place. It is designed to help independent tutors understand what they have earned and what they have received.
            </p>
            <p className="mt-4 text-base leading-7 text-muted">
              Keep historical class rates, payment schedules, and financial records organized as your teaching work changes.
            </p>
          </div>
        </section>

        <section id="faq" className="border-t border-line bg-surface py-22 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="section-kicker">Questions, answered</p>
              <h2 className="section-title text-left">A few things you might be wondering.</h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                Find quick answers about workplaces, class records, income goals, and reports below.
              </p>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {faqs.map(([question, answer], index) => (
                <button
                  key={question}
                  className="w-full py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                >
                  <span className="flex items-center justify-between gap-4 font-semibold">
                    {question}
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </span>
                  {openFaq === index && (
                    <span className="mt-3 block pr-8 text-sm leading-6 text-muted">{answer}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Ready to make every class count?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Join tutors who want a clearer, calmer way to understand their income.
            </p>
            <Link to="/login" className="mt-7 inline-block">
              <Button className="bg-white px-6 text-brand-dark hover:bg-white/90">
                Get started free <ArrowRight size={17} />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted sm:flex-row sm:px-6">
          <Brand />
          <p>© {new Date().getFullYear()} EarnEd. Built for tutors everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
