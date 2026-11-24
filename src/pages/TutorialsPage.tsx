import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Laptop,
  Lightbulb,
  ListChecks,
  Play,
  PlayCircle,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Card, Input, PageHeader } from "../components/ui";

type Resource = {
  title: string;
  category: string;
  summary: string;
  readTime: string;
  level: string;
  url: string;
  source: string;
};

type TutorialVideo = {
  id: string;
  title: string;
  creator: string;
  description: string;
  duration: string;
  category: string;
};

const articles: Resource[] = [
  {
    title: "Teaching online: a guide for new tutors",
    category: "Starting out",
    summary:
      "Understand what online tutoring involves, how it differs from face-to-face teaching, and the skills you can build before your first class.",
    readTime: "10–15 min",
    level: "Beginner",
    url: "https://www.teachingenglish.org.uk/professional-development/teachers/using-digital-technologies/teaching-online",
    source: "British Council · TeachingEnglish",
  },
  {
    title: "Plan lessons with clear aims and outcomes",
    category: "Lesson planning",
    summary:
      "A free professional-development pathway covering lesson aims, motivating activities, lesson stages, feedback and adapting to learner needs.",
    readTime: "2 hours",
    level: "Beginner",
    url: "https://www.teachingenglish.org.uk/professional-development/teachers/professional-development-pathways/pathways-planning-lessons-and",
    source: "British Council · TeachingEnglish",
  },
  {
    title: "The basics of lesson planning",
    category: "Lesson planning",
    summary:
      "Learn what belongs in a lesson plan, why preparation matters, and how to make each activity connect to the lesson topic.",
    readTime: "10 min",
    level: "Beginner",
    url: "https://www.teachingenglish.org.uk/professional-development/teachers/planning-lessons-and-courses/articles/basics-lesson-planning",
    source: "British Council · TeachingEnglish",
  },
  {
    title: "Managing the lesson",
    category: "Classroom skills",
    summary:
      "Explore practical ways to build a supportive learning environment, manage online or in-person classes, and make lesson goals clear.",
    readTime: "Guided resources",
    level: "Beginner",
    url: "https://www.teachingenglish.org.uk/professional-development/teachers/managing-the-lesson",
    source: "British Council · TeachingEnglish",
  },
  {
    title: "Free English lesson plans and classroom activities",
    category: "Teaching resources",
    summary:
      "Browse ready-to-use lesson plans for children, teenagers and adults, with activities organised by learner age and CEFR level.",
    readTime: "Browse at your pace",
    level: "All levels",
    url: "https://www.teachingenglish.org.uk/teaching-resources",
    source: "British Council · TeachingEnglish",
  },
  {
    title: "Top ten tips for online tutors",
    category: "Online teaching",
    summary:
      "A practical checklist for supporting learners online, handling technical issues, building rapport and improving your lessons over time.",
    readTime: "Part of the guide",
    level: "Beginner",
    url: "https://www.teachingenglish.org.uk/professional-development/teachers/using-digital-technologies/teaching-online",
    source: "British Council · TeachingEnglish",
  },
  {
    title: "Applying to online ESL platforms in the Philippines",
    category: "Philippines",
    summary:
      "Review a Philippine-based platform's published tutor criteria, including age, English proficiency, equipment, internet, onboarding and TIN documentation. Requirements differ by company, so always verify the current official application page.",
    readTime: "5–10 min",
    level: "Beginner",
    url: "https://tutor.rarejob.com.ph/site/faqs",
    source: "RareJob Philippines · Official tutor FAQ",
  },
  {
    title: "TESDA's ESL competency standards: beginner A1–A2",
    category: "Philippines",
    summary:
      "Read the official TESDA competency standards document for beginner ESL. It explains the training framework and trainer qualifications; it is not a universal hiring requirement for every online tutoring platform.",
    readTime: "Reference document",
    level: "Reference",
    url: "https://tesda.gov.ph/Downloadables/CS/CS-ESL-BEGINNER-A1-and-A2-LEVEL.pdf",
    source: "TESDA · Official competency standards",
  },
  {
    title: "BIR registration checklist for freelancers and professionals",
    category: "Philippines",
    summary:
      "See the BIR's 2025 documentary checklist for self-employed individuals, including professionals and freelancers, and its ORUS online registration route. Confirm which taxpayer classification and obligations apply to your situation with the BIR.",
    readTime: "Official checklist",
    level: "Money & records",
    url: "https://bir-cdn.bir.gov.ph/BIR/pdf/CDR%20-%202025.pdf",
    source: "Bureau of Internal Revenue · 2025",
  },
  {
    title: "Prepare a reliable home teaching setup in the Philippines",
    category: "Philippines",
    summary:
      "Use a laptop or desktop, a clear microphone, front-facing light, a quiet background and stable internet. Consider a backup mobile-data connection and power option for local outages; check the exact technical standards of each platform.",
    readTime: "5 min",
    level: "Beginner",
    url: "https://tutor.rarejob.com.ph/site/faqs",
    source: "EarnEd guide · Check platform requirements",
  },
  {
    title: "Plan your tutoring schedule using Philippine time",
    category: "Philippines",
    summary:
      "Build a realistic weekly timetable in Philippine Time (UTC+8), then confirm each platform's peak hours, booking windows, cancellation rules and payout schedule before committing.",
    readTime: "4 min",
    level: "Beginner",
    url: "https://tutor.rarejob.com.ph/site/how_it_works",
    source: "RareJob Philippines · How it works",
  },
];

const videos: TutorialVideo[] = [
  {
    id: "vHdclsdkp28",
    title: "Self-introduction video for ESL teaching",
    creator: "Learn with Leri",
    description:
      "A Filipino ESL teacher shares an example of an online-teacher self-introduction. Use it to study your delivery and structure, then create an introduction in your own words.",
    duration: "ESL application preparation",
    category: "Philippines",
  },
  {
    id: "H3lGHUoWcGc",
    title: "Who's vs. whose: a practical English lesson",
    creator: "Pinay English Teacher · Myra Caguete",
    description:
      "A Filipino ESL trainer explains a common grammar point. This is useful for strengthening the English knowledge you may need to explain clearly to learners.",
    duration: "Grammar lesson",
    category: "Philippines",
  },
  {
    id: "tOpkAPuQXEs",
    title: "How to teach your first online class",
    creator: "ESL Teacher 365",
    description:
      "Beginner-friendly advice for preparing your first online ESL lesson and getting comfortable with the teaching process.",
    duration: "Beginner tutorial",
    category: "Starting out",
  },
  {
    id: "GWMt1djgszQ",
    title: "Top 10 tips for new English teachers",
    creator: "Jackie Bolen",
    description:
      "Practical classroom habits: lesson plans, routines, review, clear instructions, checking understanding and positive feedback.",
    duration: "10 practical tips",
    category: "Classroom skills",
  },
  {
    id: "8yVgDsCfAp8",
    title: "How a lesson plan becomes a real ESL lesson",
    creator: "Teacher Val",
    description:
      "Watch a lesson move from warm-up and vocabulary to practice activities, listening and a final speaking task.",
    duration: "Full lesson demonstration",
    category: "Lesson planning",
  },
  {
    id: "PqMZ6i3Ttcg",
    title: "Plan your first day of class",
    creator: "Atlas Teaching",
    description:
      "See ideas for icebreakers, introductions, class expectations and setting a welcoming tone with learners.",
    duration: "First-day lesson plan",
    category: "Classroom skills",
  },
];

const categories = [
  "All",
  "Starting out",
  "Lesson planning",
  "Online teaching",
  "Classroom skills",
  "Teaching resources",
  "Philippines",
];

const starterTasks = [
  "Check your internet, microphone, camera and lighting",
  "Prepare a backup mobile-data connection and power option",
  "Choose the age group and level you feel ready to teach",
  "Prepare a simple lesson objective and a short activity",
  "Practise introducing yourself and giving clear instructions",
  "Prepare a backup activity in case technology fails",
];

export function TutorialsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [contentType, setContentType] = useState<"articles" | "videos">("articles");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const filteredArticles = useMemo(
    () =>
      articles.filter((item) => {
        const matchesCategory = category === "All" || item.category === category;
        const searchText = `${item.title} ${item.summary} ${item.source} ${item.category}`.toLowerCase();
        return matchesCategory && searchText.includes(query.toLowerCase().trim());
      }),
    [category, query],
  );

  const filteredVideos = useMemo(
    () =>
      videos.filter((item) => {
        const matchesCategory = category === "All" || item.category === category;
        const searchText = `${item.title} ${item.description} ${item.creator} ${item.category}`.toLowerCase();
        return matchesCategory && searchText.includes(query.toLowerCase().trim());
      }),
    [category, query],
  );

  const progress = Math.round((completedTasks.length / starterTasks.length) * 100);

  const toggleTask = (task: string) => {
    setCompletedTasks((current) =>
      current.includes(task) ? current.filter((item) => item !== task) : [...current, task],
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Learn & grow"
        title="ESL tutor learning hub"
        description="A beginner-friendly library of trusted articles, practical teaching tips and video demonstrations to help you prepare for your first class and keep improving."
      />

      <Card className="relative isolate overflow-hidden border-0 bg-deep p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand">
            <Sparkles size={14} /> Your starting point
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Every great tutor starts with one good lesson.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
            You do not need to know everything on day one. Start with the basics: understand your
            learner, set one clear goal, prepare a simple activity and create a welcoming class.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setContentType("articles");
                setCategory("Starting out");
                setQuery("");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 dark:bg-brand dark:text-[#14200f]"
            >
              Explore beginner guides <ChevronRight size={17} />
            </button>
            <button
              onClick={() => {
                setContentType("videos");
                setCategory("All");
                setQuery("");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <PlayCircle size={17} /> Watch tutorials
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <BookOpen className="text-brand" size={19} />
            <div>
              <p className="text-sm font-bold">Trusted reading</p>
              <p className="text-xs text-white/55">Curated teacher resources</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Video className="text-brand" size={19} />
            <div>
              <p className="text-sm font-bold">Watch and learn</p>
              <p className="text-xs text-white/55">Real teaching demonstrations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GraduationCap className="text-brand" size={20} />
            <div>
              <p className="text-sm font-bold">Start at your pace</p>
              <p className="text-xs text-white/55">No experience required</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-dark dark:text-[#b8e986]">
                <ListChecks size={15} /> First-class checklist
              </p>
              <h2 className="mt-2 text-lg font-bold">Get ready to teach</h2>
              <p className="mt-1 text-sm text-muted">
                Tick off these essentials as you prepare for your first class.
              </p>
            </div>
            <span className="rounded-xl bg-brand-soft dark:bg-[#26351f] px-3 py-2 text-sm font-bold text-brand-dark dark:text-[#b8e986]">
              {progress}%
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {starterTasks.map((task) => {
              const checked = completedTasks.includes(task);
              return (
                <label
                  key={task}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${checked ? "border-brand/30 bg-brand-soft/60 dark:bg-[#26351f]" : "border-line hover:bg-soft"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTask(task)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#76BE3F]"
                  />
                  <span className={checked ? "text-muted line-through" : "text-ink"}>{task}</span>
                  {checked && <CheckCircle2 className="ml-auto shrink-0 text-brand" size={17} />}
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">
            Your checklist progress is kept while this page is open.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-dark dark:text-[#b8e986]">
            <Lightbulb size={15} /> A simple lesson flow
          </p>
          <h2 className="mt-2 text-lg font-bold">A structure you can reuse</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            For a short beginner lesson, try this flexible 4-part sequence. Adjust the timing to
            your learner and lesson length.
          </p>
          <div className="mt-5 space-y-4">
            {[
              ["01", "Warm welcome", "Greet the learner and ask an easy opening question.", "2–3 min"],
              ["02", "Teach one goal", "Introduce a small set of words, phrases or one skill.", "5–8 min"],
              ["03", "Guided practice", "Model an example, then let the learner try with support.", "8–12 min"],
              ["04", "Feedback & recap", "Praise effort, correct gently and review the key point.", "2–3 min"],
            ].map(([number, title, description, time]) => (
              <div key={number} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft dark:bg-[#26351f] text-xs font-extrabold text-brand-dark dark:text-[#b8e986]">
                  {number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">{title}</p>
                    <span className="text-xs text-muted">{time}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-dark dark:text-[#b8e986]">
              Learning library
            </p>
            <h2 className="mt-1 text-xl font-bold">Explore articles and videos</h2>
            <p className="mt-1 text-sm text-muted">
              Hand-picked resources from established English-teaching educators.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-xl border border-line bg-surface p-1">
            <button
              onClick={() => {
                setContentType("articles");
                setActiveVideo(null);
              }}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${contentType === "articles" ? "bg-brand-dark text-white shadow-sm dark:bg-brand dark:text-[#14200f]" : "text-muted hover:text-ink"}`}
            >
              <BookOpen size={15} /> Articles
            </button>
            <button
              onClick={() => setContentType("videos")}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${contentType === "videos" ? "bg-brand-dark text-white shadow-sm dark:bg-brand dark:text-[#14200f]" : "text-muted hover:text-ink"}`}
            >
              <Play size={15} /> Videos
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-muted" size={17} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
              placeholder="Search lesson planning, online teaching, classroom tips..."
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`min-h-9 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition ${category === item ? "bg-brand-dark text-white dark:bg-brand dark:text-[#14200f]" : "border border-line bg-surface text-muted hover:text-ink"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {contentType === "articles" ? (
          <>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">{filteredArticles.length} reading resources</p>
              <span className="text-xs text-muted">External resources · Opens in a new tab</span>
            </div>
            {filteredArticles.length ? (
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredArticles.map((item) => (
                  <Card key={item.title} className="group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-brand-soft dark:bg-[#26351f] px-2.5 py-1 text-[11px] font-bold text-brand-dark dark:text-[#b8e986]">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock3 size={13} /> {item.readTime}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold leading-6">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.summary}</p>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{item.source}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{item.level}</p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-brand-dark transition hover:bg-brand-soft dark:text-[#b8e986] dark:hover:bg-[#26351f]"
                      >
                        Read guide <ArrowUpRight size={15} />
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-line px-5 py-12 text-center">
                <Search className="mx-auto text-muted" size={27} />
                <p className="mt-3 font-semibold">No articles found</p>
                <p className="mt-1 text-sm text-muted">Try another keyword or choose a different category.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">{filteredVideos.length} video tutorials</p>
              <span className="text-xs text-muted">YouTube embeds</span>
            </div>
            {filteredVideos.length ? (
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {filteredVideos.map((item) => {
                  const isActive = activeVideo === item.id;
                  return (
                    <Card key={item.id} className="overflow-hidden p-0">
                      {isActive ? (
                        <div className="aspect-video bg-black">
                          <iframe
                            className="h-full w-full"
                            src={`https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`}
                            title={item.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveVideo(item.id)}
                          className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-deep text-white"
                          aria-label={`Play ${item.title}`}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${item.id}/hqdefault.jpg`}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                          />
                          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
                          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl transition group-hover:scale-110">
                            <Play fill="currentColor" size={22} />
                          </span>
                          <span className="absolute bottom-3 left-4 right-4 text-left text-xs font-semibold text-white/90">
                            {item.duration}
                          </span>
                        </button>
                      )}
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-brand-soft dark:bg-[#26351f] px-2.5 py-1 text-[11px] font-bold text-brand-dark dark:text-[#b8e986]">
                            {item.category}
                          </span>
                          <span className="text-xs text-muted">{item.creator}</span>
                        </div>
                        <h3 className="mt-3 font-bold leading-6">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                          <span className="text-xs text-muted">YouTube learning video</span>
                          <button
                            onClick={() => setActiveVideo(isActive ? null : item.id)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-brand-dark transition hover:bg-brand-soft dark:text-[#b8e986] dark:hover:bg-[#26351f]"
                          >
                            {isActive ? "Close video" : "Play video"} <PlayCircle size={15} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-line px-5 py-12 text-center">
                <Search className="mx-auto text-muted" size={27} />
                <p className="mt-3 font-semibold">No videos found</p>
                <p className="mt-1 text-sm text-muted">Try another keyword or choose a different category.</p>
              </div>
            )}
          </>
        )}
      </section>

      <Card className="mt-7 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft dark:bg-[#26351f] text-brand-dark dark:text-[#b8e986]">
            <Laptop size={21} />
          </span>
          <div>
            <h2 className="font-bold">Keep building your teaching skills</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              The British Council's TeachingEnglish library includes free lesson plans, classroom
              activities and professional-development materials for teachers at different stages.
            </p>
          </div>
        </div>
        <a
          href="https://www.teachingenglish.org.uk/teaching-resources"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:bg-soft"
        >
          Explore free resources <ArrowUpRight size={16} />
        </a>
      </Card>
    </>
  );
}
