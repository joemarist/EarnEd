import {
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  GraduationCap,
  Pencil,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { useState } from "react";
import { Button, Card, Input, PageHeader } from "../components/ui";

export function GoalsPage() {
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState(3200);
  const earned = 2650;
  const percent = Math.min(100, Math.round((earned / goal) * 100));

  return (
    <>
      <PageHeader
        eyebrow="Motivation"
        title="Income goals"
        description="Turn a monthly target into a simple, achievable teaching plan."
        action={
          <Button onClick={() => setEditing(true)}>
            <Plus size={16} /> New goal
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[1.25fr_.75fr]">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark dark:text-brand">
                  Active goal
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold">May income target</h2>
                <p className="mt-1 text-sm text-muted">May 1 – May 31, 2025</p>
              </div>
              <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => setEditing(true)}>
                <Pencil size={17} />
              </Button>
            </div>
            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Current progress</p>
                <p className="mt-1 font-display text-4xl font-bold">
                  $2,650{" "}
                  <span className="text-lg font-medium text-muted">/ ${goal.toLocaleString()}</span>
                </p>
              </div>
              <p className="text-2xl font-bold text-brand-dark dark:text-brand">{percent}%</p>
            </div>
            <div className="mt-5 h-4 overflow-hidden rounded-full bg-soft">
              <div
                className="relative h-full rounded-full bg-brand transition-all"
                style={{ width: `${percent}%` }}
              >
                <span className="absolute inset-y-0 right-0 w-8 bg-white/20" />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">
              <b className="text-ink">${Math.max(0, goal - earned).toLocaleString()}</b> to go with
              18 days remaining
            </p>
          </div>
          <div className="flex flex-col justify-center bg-deep p-6 text-white sm:p-8">
            <Sparkles className="text-brand" size={26} />
            <p className="mt-5 text-xl font-bold leading-7">
              {percent >= 100
                ? "Goal reached—brilliant work!"
                : "You’re on track to reach your goal 3 days early."}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              At your current pace, you’ll earn approximately <b className="text-white">$3,420</b>{" "}
              by May 31.
            </p>
          </div>
        </div>
      </Card>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: CircleDollarSign,
            label: "Needed per day",
            value: "$30.56",
            detail: "across remaining 18 days",
          },
          {
            icon: GraduationCap,
            label: "Classes still needed",
            value: "44",
            detail: "at your average $12.50 rate",
          },
          {
            icon: CalendarRange,
            label: "Teaching days",
            value: "14",
            detail: "3.1 classes per teaching day",
          },
          {
            icon: Target,
            label: "Daily pace",
            value: "$147.22",
            detail: "18% ahead of required pace",
          },
        ].map(({ icon: Icon, label, value, detail }) => (
          <Card key={label} className="p-5">
            <Icon size={19} className="text-brand" />
            <p className="mt-4 text-sm text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-2 text-xs text-muted">{detail}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">Weekly milestones</h2>
            <p className="text-xs text-muted">Small wins on the way to your goal</p>
          </div>
          <CheckCircle2 size={20} className="text-brand" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ["May 1–7", "$710", true],
            ["May 8–14", "$1,465", true],
            ["May 15–21", "$2,350", true],
            ["May 22–31", "$3,200", false],
          ].map(([date, amount, done]) => (
            <div
              key={String(date)}
              className={`rounded-xl border p-4 ${done ? "border-brand/30 bg-brand-soft/60" : "border-line"}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? "bg-brand text-white" : "bg-soft text-muted"}`}
              >
                {done ? <CheckCircle2 size={15} /> : "4"}
              </span>
              <p className="mt-3 text-xs text-muted">{String(date)}</p>
              <p className="mt-1 font-bold">{String(amount)}</p>
            </div>
          ))}
        </div>
      </Card>

      {editing && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onMouseDown={() => setEditing(false)}
        >
          <Card className="w-full max-w-md rounded-b-none p-5 sm:rounded-2xl">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setGoal(Number(form.get("target")));
                setEditing(false);
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <h2 className="text-xl font-bold">Set an income goal</h2>
              <label className="mt-5 block text-sm font-semibold">
                Target amount
                <Input name="target" type="number" defaultValue={goal} className="mt-2" />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">
                  Start date
                  <Input type="date" defaultValue="2025-05-01" className="mt-2" />
                </label>
                <label className="text-sm font-semibold">
                  End date
                  <Input type="date" defaultValue="2025-05-31" className="mt-2" />
                </label>
              </div>
              <Button className="mt-6 w-full" type="submit">
                Save goal
              </Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
