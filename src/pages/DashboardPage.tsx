import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  Filter,
  Plus,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, PageHeader, Select } from "../components/ui";
import { incomeByWorkplace, monthlyIncome, periods, workplaces } from "../data/mock";
import { money } from "../lib/utils";

const stats = [
  {
    label: "Total earned",
    value: "$2,650.00",
    detail: "12.4% from April",
    trend: "up",
    icon: CircleDollarSign,
    tone: "brand",
  },
  {
    label: "Received",
    value: "$2,180.00",
    detail: "82% collected",
    trend: "up",
    icon: WalletCards,
    tone: "teal",
  },
  {
    label: "Still owed",
    value: "$470.00",
    detail: "2 open payments",
    trend: "down",
    icon: Clock3,
    tone: "amber",
  },
  {
    label: "Current period",
    value: "$537.50",
    detail: "43 classes logged",
    trend: "up",
    icon: CalendarClock,
    tone: "blue",
  },
];

export function DashboardPage() {
  const [workplace, setWorkplace] = useState("all");
  const [wizard, setWizard] = useState(false);
  const total = incomeByWorkplace.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A clear view of what you earned, received, and are still owed."
        action={
          <div className="flex gap-2">
            <Select
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              aria-label="Filter workplace"
            >
              <option value="all">All workplaces</option>
              {workplaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Button className="hidden sm:flex" onClick={() => setWizard(true)}>
              <Plus size={16} /> Quick log
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
        <AlertTriangle size={19} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold">One payment is overdue</p>
          <p className="mt-0.5 text-xs opacity-80">
            TutorLoop’s April payment of $390 was due 4 days ago.
          </p>
        </div>
        <Button variant="ghost" className="hidden h-8 min-h-0 px-2 text-xs sm:flex">
          Review
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, trend, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl stat-${tone}`}>
                <Icon size={19} />
              </div>
            </div>
            <p
              className={`mt-3 flex items-center gap-1 text-xs font-semibold ${trend === "up" ? "text-emerald-600" : "text-amber-600"}`}
            >
              {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {detail}
            </p>
          </Card>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="p-5">
          <div>
            <h2 className="font-bold">Income by workplace</h2>
            <p className="text-xs text-muted">May 1–31, 2025</p>
          </div>
          <div className="mt-2 grid items-center sm:grid-cols-[1fr_.9fr] xl:grid-cols-1 2xl:grid-cols-[1fr_.9fr]">
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeByWorkplace}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {incomeByWorkplace.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => money(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-muted">Total</p>
                <p className="text-xl font-bold">{money(total)}</p>
              </div>
            </div>
            <div className="space-y-3">
              {incomeByWorkplace.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
                    {item.name}
                  </span>
                  <span className="font-semibold">{money(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold">Earned vs. received</h2>
              <p className="text-xs text-muted">Last 6 months</p>
            </div>
            <Button variant="ghost" className="h-8 min-h-0 px-2 text-xs">
              <Filter size={14} /> Filter
            </Button>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIncome} barGap={3}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  width={44}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "var(--soft)" }}
                  formatter={(value) => money(Number(value))}
                />
                <Bar dataKey="earned" fill="#76BE3F" radius={[5, 5, 0, 0]} />
                <Bar dataKey="received" fill="#2F7D6D" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 text-xs text-muted">
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-sm bg-brand" />
              Earned
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-sm bg-[#2F7D6D]" />
              Received
            </span>
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className="font-bold">Recent pay periods</h2>
              <p className="text-xs text-muted">Expected and received income</p>
            </div>
            <Button variant="ghost" className="h-8 min-h-0 px-2 text-xs">
              View all
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Workplace</th>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">Expected</th>
                  <th className="px-4 py-3 font-semibold">Received</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {periods.map((item) => (
                  <tr key={item.workplace + item.period} className="hover:bg-soft/60">
                    <td className="px-5 py-4 font-semibold">{item.workplace}</td>
                    <td className="px-4 py-4 text-muted">{item.period}</td>
                    <td className="px-4 py-4">{money(item.expected)}</td>
                    <td className="px-4 py-4">{money(item.received)}</td>
                    <td className="px-4 py-4">
                      <Badge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Next paydays</h2>
              <p className="text-xs text-muted">What’s coming up</p>
            </div>
            <CalendarClock size={19} className="text-brand" />
          </div>
          <div className="mt-4 space-y-1">
            {workplaces.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-soft">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: item.color }}
                >
                  {item.shortName}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{item.schedule}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{item.payday}</p>
                  <p className="text-xs text-muted">
                    {index === 0 ? "in 3 days" : index === 1 ? "in 7 days" : "in 17 days"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {wizard && <QuickAdd close={() => setWizard(false)} />}
    </>
  );
}

function QuickAdd({ close }: { close: () => void }) {
  const [step, setStep] = useState(1);
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onMouseDown={close}
    >
      <Card className="w-full max-w-md rounded-b-none p-6 sm:rounded-2xl">
        <div onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Quick add</p>
              <h2 className="mt-1 text-xl font-bold">
                {step === 1 ? "Log today’s classes" : "Classes added"}
              </h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
              {step === 1 ? <Sparkles size={19} /> : <Check size={20} />}
            </span>
          </div>
          {step === 1 ? (
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">
                Workplace
                <Select className="mt-2 w-full">
                  {workplaces.map((item) => (
                    <option key={item.id}>{item.name}</option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm font-semibold">
                Classes
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 outline-none focus:border-brand"
                  type="number"
                  defaultValue={4}
                />
              </label>
              <div className="rounded-xl bg-soft p-3 text-sm">
                <span className="text-muted">Estimated income</span>
                <span className="float-right font-bold">$50.00</span>
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                Save log
              </Button>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted">
                4 classes at LingoStar Academy were added for today.
              </p>
              <Button className="mt-6 w-full" onClick={close}>
                Done
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
