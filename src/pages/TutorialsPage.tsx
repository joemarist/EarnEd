import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckSquare2,
  Clock3,
  PlayCircle,
  Rocket,
  Search,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, Input, PageHeader } from "../components/ui";
import { tutorialArticles } from "../data/mock";

const icons = {
  rocket: Rocket,
  check: CheckSquare2,
  building: BriefcaseBusiness,
  chart: BarChart3,
  video: PlayCircle,
  wallet: WalletCards,
};
const categories = [
  "All",
  "Getting started",
  "Requirements",
  "Platforms",
  "Rates",
  "Demo class",
  "Money basics",
];

export function TutorialsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = useMemo(
    () =>
      tutorialArticles.filter(
        (item) =>
          (category === "All" || item.category === category) &&
          `${item.title} ${item.summary}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, category],
  );
  return (
    <>
      <PageHeader
        eyebrow="Learn & grow"
        title="Tutorials and tips"
        description="Practical guides for building a sustainable online ESL tutoring career."
      />
      <Card className="overflow-hidden bg-deep p-6 text-white sm:p-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-brand">
            <BookOpen size={14} /> Featured guide
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold">
            The aspiring ESL tutor starter pack
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            From choosing your first platform to delivering a confident demo class and tracking your
            first payment.
          </p>
          <Button className="mt-6">
            Start the guide <PlayCircle size={17} />
          </Button>
        </div>
      </Card>
      <div className="mt-5 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-muted" size={17} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            placeholder="Search tutorials, guides, and FAQs"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? "bg-brand text-white" : "border border-line bg-surface text-muted hover:text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          return (
            <Card
              key={item.title}
              className="group cursor-pointer p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                  <Icon size={19} />
                </span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock3 size={13} />
                  {item.time}
                </span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-brand-dark dark:text-brand">
                {item.category}
              </p>
              <h2 className="mt-2 text-lg font-bold leading-6">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
              <button className="mt-5 text-sm font-bold text-brand-dark dark:text-brand">
                Read article →
              </button>
            </Card>
          );
        })}
      </section>
      {!filtered.length && (
        <div className="py-16 text-center">
          <Search size={28} className="mx-auto text-muted" />
          <p className="mt-3 font-semibold">No guides found</p>
          <p className="mt-1 text-sm text-muted">Try a broader search or another category.</p>
        </div>
      )}
      <Card className="mt-6 p-6">
        <h2 className="font-bold">Quick payment & tax checklist</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "Save payment statements and invoices",
            "Record platform fees separately",
            "Keep exchange rate records",
            "Set aside tax based on local guidance",
            "Export a monthly income summary",
            "Consult a qualified local professional",
          ].map((item, index) => (
            <label key={item} className="flex items-start gap-3 rounded-xl bg-soft p-3 text-sm">
              <input
                type="checkbox"
                defaultChecked={index < 3}
                className="mt-0.5 accent-[#76BE3F]"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </Card>
    </>
  );
}
